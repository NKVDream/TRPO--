import React, { useState } from 'react';
import { deleteTask, listTasks, saveTask } from '../api/tasks';
import './workspace-modules.css';

const EMPTY_FORM = { title: '', notes: '', dueDate: '', priority: 'normal', completed: false };
const PRIORITY_LABELS = { low: 'Низкий', normal: 'Обычный', high: 'Высокий' };

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function Organizer() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const today = localDate();

  const completedCount = tasks.filter((task) => task.completed).length;
  const overdueCount = tasks.filter(
    (task) => !task.completed && task.dueDate && task.dueDate < today,
  ).length;
  const visibleTasks = tasks.filter((task) => {
    const matchesStatus =
      filter === 'all' || (filter === 'done' ? task.completed : !task.completed);
    const matchesQuery = `${task.title} ${task.notes}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase());
    return matchesStatus && matchesQuery;
  });

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function refreshTasks() {
    setBusy(true);
    try {
      setTasks(await listTasks());
      setLoaded(true);
      setMessage('Список задач обновлён');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    const id = editingId || crypto.randomUUID();
    const task = { ...form, dueDate: form.dueDate || null };
    try {
      await saveTask(id, task);
      setTasks((items) => [...items.filter((item) => item.id !== id), { id, ...task }]);
      setLoaded(true);
      resetForm();
      setMessage('Задача сохранена в SQLite');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function editTask(task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      notes: task.notes,
      dueDate: task.dueDate || '',
      priority: task.priority,
      completed: task.completed,
    });
  }

  async function toggleCompleted(task) {
    setBusy(true);
    try {
      const updated = { ...task, completed: !task.completed };
      await saveTask(task.id, updated);
      setTasks((items) => items.map((item) => (item.id === task.id ? updated : item)));
      if (editingId === task.id) updateForm('completed', updated.completed);
      setMessage(updated.completed ? 'Задача выполнена' : 'Задача возвращена в работу');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;
    setBusy(true);
    try {
      await deleteTask(task.id);
      setTasks((items) => items.filter((item) => item.id !== task.id));
      if (editingId === task.id) resetForm();
      setMessage('Задача удалена');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="organizer-module">
      <div className="module-heading">
        <div>
          <span className="eyebrow">PLAN & PROGRESS / 04</span>
          <h1>Органайзер</h1>
          <p>Освободите место для самого важного.</p>
        </div>
        <button className="primary" disabled={busy} onClick={refreshTasks}>
          Загрузить задачи ↻
        </button>
      </div>
      <div className="task-stats">
        <div>
          <strong>{tasks.length}</strong>
          <span>Всего в списке</span>
        </div>
        <div>
          <strong>{completedCount}</strong>
          <span>Выполнено</span>
        </div>
        <div>
          <strong>{overdueCount}</strong>
          <span>Просрочено</span>
        </div>
      </div>
      <div className="workspace-columns">
        <form className="workspace-panel task-form" onSubmit={submitTask}>
          <h2>{editingId ? 'Редактировать задачу' : 'Новая задача'}</h2>
          <fieldset disabled={busy}>
            <label className="workspace-field">
              Название
              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
              />
            </label>
            <label className="workspace-field">
              Заметки
              <textarea
                maxLength={10000}
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
              />
            </label>
            <label className="workspace-field">
              Срок
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => updateForm('dueDate', event.target.value)}
              />
            </label>
            <label className="workspace-field">
              Приоритет
              <select
                value={form.priority}
                onChange={(event) => updateForm('priority', event.target.value)}
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary" type="submit">
              {editingId ? 'Сохранить изменения' : 'Добавить задачу +'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Отменить
              </button>
            )}
          </fieldset>
        </form>
        <div className="workspace-panel task-list">
          <div className="workspace-toolbar">
            <input
              aria-label="Поиск задач"
              placeholder="Поиск по названию и заметкам"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              aria-label="Фильтр задач"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Все задачи</option>
              <option value="active">В работе</option>
              <option value="done">Выполненные</option>
            </select>
          </div>
          {!loaded && (
            <p className="empty-message">
              Нажмите «Загрузить задачи», чтобы открыть сохранённый список.
            </p>
          )}
          {loaded && visibleTasks.length === 0 && (
            <p className="empty-message">Задачи не найдены. Создайте новую или измените фильтр.</p>
          )}
          {visibleTasks.map((task) => (
            <article className={`task-card ${task.completed ? 'task-done' : ''}`} key={task.id}>
              <div className="task-title">
                <input
                  type="checkbox"
                  aria-label={`Выполнено: ${task.title}`}
                  checked={task.completed}
                  disabled={busy}
                  onChange={() => toggleCompleted(task)}
                />
                <h3>{task.title}</h3>
              </div>
              {task.notes && <p className="task-notes">{task.notes}</p>}
              <div className="task-meta">
                <span className={`priority-${task.priority}`}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
                <span className={!task.completed && task.dueDate < today ? 'overdue' : ''}>
                  {task.dueDate || 'Без срока'}
                </span>
              </div>
              <div className="workspace-actions">
                <button disabled={busy} onClick={() => editTask(task)}>
                  Изменить
                </button>
                <button disabled={busy} onClick={() => removeTask(task)}>
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <p role="status" className="status-message">
        {message || 'Задачи хранятся на сервере. Уведомления и фоновые напоминания не включены.'}
      </p>
    </section>
  );
}
