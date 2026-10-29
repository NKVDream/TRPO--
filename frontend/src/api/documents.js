import { request } from './client';

export const listDocuments = () => request('/documents');
export const getDocument = (id) => request(`/documents/${encodeURIComponent(id)}`);
export const deleteDocument = (id) =>
  request(`/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });

export function saveDocument(id, document) {
  return request(`/documents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(document),
  });
}
