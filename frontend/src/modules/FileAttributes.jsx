import React, { useRef, useState } from 'react';
import { listFiles, updateFile, uploadFile } from '../api/files';
import './workspace-modules.css';

function localDateTime(utc) {
  const date = new Date(utc);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} Б` : `${(bytes / 1024).toFixed(1)} КБ`;
}

export default function FileAttributes() {
  const input = useRef(null);
  const [files, setFiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selected = files.find((file) => file.id === selectedId);

  function selectFile(file) {
    setSelectedId(file.id);
    setForm({
      name: file.name,
      readOnly: file.readOnly,
      hidden: file.supportsHidden && file.hidden,
      modified: localDateTime(file.modifiedUtc),
    });
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function refreshFiles() {
    setBusy(true);
    try {
      const items = await listFiles();
      setFiles(items);
      setMessage(
        items.length ? 'Список копий обновлён' : 'Загрузите файл, чтобы изменить его атрибуты',
      );
      const current = items.find((file) => file.id === selectedId);
      if (current) selectFile(current);
      else {
        setSelectedId(null);
        setForm(null);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage('Максимальный размер файла — 20 МБ');
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadFile(file);
      setFiles((items) => [...items, uploaded]);
      selectFile(uploaded);
      setMessage('Копия загружена в рабочую папку приложения');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function applyAttributes(event) {
    event.preventDefault();
    if (!selected || !form) return;
    setBusy(true);
    try {
      const updated = await updateFile(selected.id, {
        name: form.name,
        readOnly: form.readOnly,
        hidden: form.hidden,
        // Если поле времени не меняли, сохраняем исходные секунды и миллисекунды.
        modifiedUtc:
          form.modified && form.modified !== localDateTime(selected.modifiedUtc)
            ? new Date(form.modified).toISOString()
            : null,
      });
      setFiles((items) => items.map((file) => (file.id === updated.id ? updated : file)));
      selectFile(updated);
      setMessage('Атрибуты копии изменены на сервере');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="files-module">
      <div className="module-heading">
        <div>
          <span className="eyebrow">FILE WORKSPACE / 05</span>
          <h1>Атрибуты файлов</h1>
          <p>Порядок начинается с деталей.</p>
        </div>
        <button className="primary" disabled={busy} onClick={() => input.current.click()}>
          Загрузить копию +
        </button>
        <input ref={input} hidden type="file" onChange={importFile} />
      </div>
      <div className="workspace-notice">
        Изменяется копия в рабочей папке C# сервера, а не исходный файл на компьютере. Скачивание
        переносит содержимое и имя; системные атрибуты и время на скачанном файле браузер не
        сохраняет.
      </div>
      <div className="workspace-columns">
        <div className="workspace-panel file-library">
          <div className="workspace-toolbar">
            <h2>Рабочие копии</h2>
            <button disabled={busy} onClick={refreshFiles}>
              Обновить ↻
            </button>
          </div>
          {!files.length && (
            <p className="empty-message">
              Загрузите файл до 20 МБ или обновите список сохранённых копий.
            </p>
          )}
          {files.map((file) => (
            <button
              className={`file-item ${selectedId === file.id ? 'selected-document' : ''}`}
              disabled={busy}
              key={file.id}
              onClick={() => selectFile(file)}
            >
              <strong>{file.name}</strong>
              <span>
                {formatSize(file.size)} · {file.readOnly ? 'Только чтение' : 'Чтение и запись'}
              </span>
            </button>
          ))}
        </div>
        <div className="workspace-panel file-details">
          {!selected || !form ? (
            <div className="empty-message">Выберите файл для просмотра свойств.</div>
          ) : (
            <form onSubmit={applyAttributes}>
              <h2>Свойства копии</h2>
              <fieldset disabled={busy}>
                <label className="workspace-field">
                  Имя файла
                  <input
                    required
                    maxLength={180}
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                  />
                </label>
                <dl>
                  <dt>Размер</dt>
                  <dd>{formatSize(selected.size)}</dd>
                  <dt>Изменён (локальное время)</dt>
                  <dd>{new Date(selected.modifiedUtc).toLocaleString('ru-RU')}</dd>
                </dl>
                <label className="workspace-checkbox">
                  <input
                    type="checkbox"
                    checked={form.readOnly}
                    onChange={(event) => updateForm('readOnly', event.target.checked)}
                  />
                  Только чтение
                </label>
                <label className="workspace-checkbox">
                  <input
                    type="checkbox"
                    disabled={!selected.supportsHidden}
                    checked={form.hidden}
                    onChange={(event) => updateForm('hidden', event.target.checked)}
                  />
                  Скрытый (Windows)
                </label>
                {!selected.supportsHidden && (
                  <p className="muted">
                    Сервер работает не в Windows: атрибут «скрытый» недоступен.
                  </p>
                )}
                <label className="workspace-field">
                  Новое время изменения
                  <input
                    type="datetime-local"
                    min="1980-01-01T00:00"
                    max="2100-12-31T23:59"
                    value={form.modified}
                    onChange={(event) => updateForm('modified', event.target.value)}
                  />
                </label>
                <div className="workspace-actions">
                  <button className="primary" type="submit">
                    Применить атрибуты
                  </button>
                  <a
                    className="download-link"
                    href={`/api/files/${encodeURIComponent(selected.id)}/download`}
                  >
                    Скачать содержимое ↓
                  </a>
                </div>
              </fieldset>
            </form>
          )}
        </div>
      </div>
      <p role="status" className="status-message">
        {message || 'Нужен работающий C# сервер. Рабочие копии сохраняются между запусками.'}
      </p>
    </section>
  );
}
