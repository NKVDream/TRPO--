// Общий HTTP-клиент C# API. При разработке /api проксирует Vite.
export async function request(path, options) {
  const response = await fetch(`/api${path}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const validation = error?.errors ? Object.values(error.errors).flat().join(' ') : null;
    throw new Error(error?.error || validation || `Ошибка API: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export function getHealth() {
  return request('/health');
}

export function listProjects() {
  return request('/projects');
}

export function getProject(id) {
  return request(`/projects/${encodeURIComponent(id)}`);
}

export function saveProject(id, project) {
  return request(`/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
}
