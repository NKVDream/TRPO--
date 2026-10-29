import { request } from './client';

export const listTasks = () => request('/tasks');
export const deleteTask = (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });

export function saveTask(id, task) {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
}
