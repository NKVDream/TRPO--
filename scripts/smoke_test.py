"""API smoke test against an isolated server and temporary SQLite/files directory.

Run from the repository root after `dotnet build backend/Hub.csproj`:
    python3 scripts/smoke_test.py
Only the temporary application's own records/files are modified.
"""

import json
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DLL = ROOT / "backend/bin/Debug/net8.0/Hub.dll"


def run():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    base = f"http://127.0.0.1:{port}"

    def request(path, method="GET", body=None, expected=200, content_type="application/json"):
        if isinstance(body, dict):
            body = json.dumps(body).encode()
        req = urllib.request.Request(
            base + path, data=body, method=method,
            headers={"Content-Type": content_type},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                status, data = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, data = error.code, error.read()
        assert status == expected, (method, path, status, expected, data[:300])
        return json.loads(data) if data and data[:1] in (b"{", b"[") else data

    with tempfile.TemporaryDirectory(prefix="forum-smoke-") as directory:
        log_path = Path(directory) / "server.log"
        process = None
        log = log_path.open("w+")

        def start_server():
            server = subprocess.Popen(
                ["dotnet", str(DLL), "--urls", base, "--contentRoot", directory],
                cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
            )
            for _ in range(100):
                if server.poll() is not None:
                    raise AssertionError(log_path.read_text())
                try:
                    request("/api/health")
                    return server
                except (OSError, urllib.error.URLError):
                    time.sleep(0.1)
            server.terminate()
            server.wait(timeout=10)
            raise AssertionError("Server did not become ready")

        try:
            process = start_server()
            document_id = str(uuid.uuid4())
            task_id = str(uuid.uuid4())
            project_id = str(uuid.uuid4())

            document = {"name": "Кириллица", "content": "Строка один\nСтрока два 🎵"}
            request(f"/api/documents/{document_id}", "PUT", document)
            assert request(f"/api/documents/{document_id}")["content"] == document["content"]
            document["content"] = ""
            request(f"/api/documents/{document_id}", "PUT", document)
            assert len(request("/api/documents")) == 1
            request("/api/documents/missing", expected=404)
            request("/api/documents/bad", "PUT", {"name": " ", "content": "x"}, 400)
            request("/api/documents/bad", "PUT", {"name": "test", "content": None}, 400)
            request("/api/documents/bad", "PUT", {"name": "test", "content": "x" * 1_000_001}, 400)
            print("PASS documents: create, update, empty text, validation, 404")

            task = {"title": "Подготовить отчёт", "notes": "Заметка", "dueDate": "2026-11-02", "priority": "high", "completed": False}
            request(f"/api/tasks/{task_id}", "PUT", task)
            task["completed"] = True
            request(f"/api/tasks/{task_id}", "PUT", task)
            assert request("/api/tasks")[0]["completed"] is True
            request("/api/tasks/bad", "PUT", {**task, "dueDate": "2026-02-30"}, 400)
            request("/api/tasks/bad", "PUT", {**task, "priority": "urgent"}, 400)
            request("/api/tasks/bad", "PUT", {**task, "title": ""}, 400)
            print("PASS tasks: create, complete, date/priority/title validation")

            project = {"name": "PNG", "content": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=="}
            request(f"/api/projects/{project_id}", "PUT", project)
            assert request(f"/api/projects/{project_id}")["content"] == project["content"]
            request("/api/projects/bad", "PUT", {"name": "bad", "content": "text"}, 400)
            print("PASS graphics projects: save, read, validation")

            boundary = "ForumTestBoundary"
            payload = (
                f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\n'
                'Content-Type: text/plain\r\n\r\nHello workspace\r\n'
                f'--{boundary}--\r\n'
            ).encode()
            uploaded = request("/api/files", "POST", payload, content_type=f"multipart/form-data; boundary={boundary}")
            file_id = uploaded["id"]
            attributes = {"name": "renamed.txt", "readOnly": True, "hidden": False, "modifiedUtc": "2025-01-02T03:04:00Z"}
            updated = request(f"/api/files/{file_id}", "PUT", attributes)
            assert updated["name"] == "renamed.txt" and updated["readOnly"] is True
            assert updated["modifiedUtc"].startswith("2025-01-02T03:04:00")
            assert request(f"/api/files/{file_id}/download") == b"Hello workspace"
            for bad_name in ("../outside.txt", "CON", "bad/name.txt"):
                request(f"/api/files/{file_id}", "PUT", {**attributes, "name": bad_name}, 400)
            request(f"/api/files/{file_id}", "PUT", {**attributes, "modifiedUtc": "1800-01-01T00:00:00Z"}, 400)
            request("/api/files/not-a-uuid/download", expected=404)
            if not uploaded["supportsHidden"]:
                request(f"/api/files/{file_id}", "PUT", {**attributes, "hidden": True}, 400)
            print("PASS files: upload, rename, read-only, timestamp, bytes, path validation")

            process.terminate()
            process.wait(timeout=10)
            process = start_server()
            assert request(f"/api/documents/{document_id}")["content"] == ""
            assert request("/api/tasks")[0]["completed"] is True
            assert len(request("/api/projects")) == 1
            assert request("/api/files")[0]["readOnly"] is True
            print("PASS persistence after server restart")

            request(f"/api/documents/{document_id}", "DELETE", expected=204)
            request(f"/api/documents/{document_id}", expected=404)
            request(f"/api/tasks/{task_id}", "DELETE", expected=204)
            request(f"/api/tasks/{task_id}", "DELETE", expected=404)
            assert request("/api/tasks") == []
            # Снять ReadOnly для переносимой очистки временной папки в Windows.
            request(f"/api/files/{file_id}", "PUT", {**attributes, "readOnly": False})
            print("PASS deletion and empty lists")
        finally:
            if process is not None and process.poll() is None:
                process.terminate()
                process.wait(timeout=10)
            log.close()

    print("All API smoke tests passed. Temporary data removed.")


if __name__ == "__main__":
    run()
