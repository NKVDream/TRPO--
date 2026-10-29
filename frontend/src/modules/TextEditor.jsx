import React, { useRef, useState } from 'react';
import { deleteDocument, getDocument, listDocuments, saveDocument } from '../api/documents';
import './workspace-modules.css';

const MAX_TEXT_LENGTH = 1_000_000;

export default function TextEditor() {
  const fileInput = useRef(null);
  const [documentId, setDocumentId] = useState(null);
  const [name, setName] = useState('Новый документ');
  const [text, setText] = useState('');
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const matches = search
    ? text.toLocaleLowerCase().split(search.toLocaleLowerCase()).length - 1
    : 0;

  function mayReplaceDocument() {
    return !dirty || window.confirm('В документе есть несохранённые изменения. Продолжить?');
  }

  function newDocument() {
    if (!mayReplaceDocument()) return;
    setDocumentId(null);
    setName('Новый документ');
    setText('');
    setDirty(false);
    setMessage('Создан новый документ');
  }

  async function refreshLibrary() {
    setBusy(true);
    try {
      const items = await listDocuments();
      setDocuments(items);
      setMessage(items.length ? 'Библиотека обновлена' : 'В библиотеке пока нет документов');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(id) {
    if (!mayReplaceDocument()) return;
    setBusy(true);
    try {
      const document = await getDocument(id);
      setDocumentId(document.id);
      setName(document.name);
      setText(document.content);
      setDirty(false);
      setMessage('Документ открыт из SQLite');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function persistDocument() {
    if (!name.trim()) {
      setMessage('Укажите название документа');
      return;
    }
    setBusy(true);
    try {
      const id = documentId || crypto.randomUUID();
      await saveDocument(id, { name, content: text });
      setDocumentId(id);
      setDirty(false);
      // Запись уже успешна: сбой обновления списка не должен сообщать об ошибке сохранения.
      setMessage('Документ сохранён в SQLite');
      try {
        setDocuments(await listDocuments());
      } catch {
        setMessage('Документ сохранён. Список обновите кнопкой «Библиотека».');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeDocument(document) {
    if (!window.confirm(`Удалить «${document.name}» из библиотеки?`)) return;
    setBusy(true);
    try {
      await deleteDocument(document.id);
      setDocuments((items) => items.filter((item) => item.id !== document.id));
      if (documentId === document.id) {
        setDocumentId(null);
        setDirty(true);
      }
      setMessage('Документ удалён из базы. Открытый текст остался в редакторе.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function importText(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !mayReplaceDocument()) return;
    if (file.size > 4_000_000) {
      setMessage('Файл слишком большой. Допускается до 1 млн символов UTF-8.');
      return;
    }
    try {
      const content = await file.text();
      if (content.length > MAX_TEXT_LENGTH) throw new Error('Допускается до 1 млн символов');
      setText(content);
      setName(file.name.replace(/\.txt$/i, '').slice(0, 200));
      setDocumentId(null);
      setDirty(true);
      setMessage('TXT открыт. Для библиотеки нажмите «Сохранить».');
    } catch (error) {
      setMessage(error.message);
    }
  }

  function exportText() {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.trim() || 'Документ'}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('TXT передан браузеру для скачивания');
  }

  return (
    <section className="text-module">
      <div className="module-heading">
        <div>
          <span className="eyebrow">WRITING SPACE / 03</span>
          <h1>Текстовый редактор</h1>
          <p>Мысли, заметки и документы в одном месте.</p>
        </div>
        <button className="primary" disabled={busy} onClick={persistDocument}>
          Сохранить в библиотеку ↗
        </button>
      </div>
      <div className="workspace-toolbar">
        <button disabled={busy} onClick={newDocument}>
          Новый
        </button>
        <button disabled={busy} onClick={() => fileInput.current.click()}>
          Открыть TXT
        </button>
        <button onClick={exportText}>Скачать TXT ↓</button>
        <button disabled={busy} onClick={refreshLibrary}>
          Библиотека
        </button>
        <input ref={fileInput} hidden type="file" accept=".txt,text/plain" onChange={importText} />
      </div>
      <div className="workspace-columns">
        <aside className="workspace-panel document-library">
          <span className="eyebrow">ВАШИ ДОКУМЕНТЫ</span>
          {documents.length === 0 && (
            <p className="muted">Нажмите «Библиотека», чтобы загрузить список.</p>
          )}
          {documents.map((document) => (
            <div className="library-item" key={document.id}>
              <button
                disabled={busy}
                className={documentId === document.id ? 'selected-document' : ''}
                onClick={() => openDocument(document.id)}
              >
                {document.name}
              </button>
              <button
                disabled={busy}
                aria-label={`Удалить ${document.name}`}
                onClick={() => removeDocument(document)}
              >
                ×
              </button>
            </div>
          ))}
        </aside>
        <div className="workspace-panel text-document">
          <label className="workspace-field">
            Название документа
            <input
              disabled={busy}
              maxLength={200}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setDirty(true);
              }}
            />
          </label>
          <label className="workspace-field">
            Найти в тексте
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Введите фразу — покажем число совпадений"
            />
          </label>
          {search && <p className="muted">Совпадений без учёта регистра: {matches}</p>}
          <textarea
            aria-label="Текст документа"
            disabled={busy}
            maxLength={MAX_TEXT_LENGTH}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setDirty(true);
            }}
            placeholder="Начните писать…"
          />
          <div className="document-stats">
            <span>
              {words} слов · {text.length} символов
            </span>
            <span>{dirty ? 'Есть изменения' : 'Нет изменений'}</span>
          </div>
        </div>
      </div>
      <p className="status-message" role="status">
        {message || 'Перед перезагрузкой сохраните документ в библиотеку или скачайте TXT.'}
      </p>
    </section>
  );
}
