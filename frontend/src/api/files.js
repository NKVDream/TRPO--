import { request } from './client';

export const listFiles = () => request('/files');

export function uploadFile(file) {
  const body = new FormData();
  body.append('file', file);
  return request('/files', { method: 'POST', body });
}

export function updateFile(id, attributes) {
  return request(`/files/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attributes),
  });
}
