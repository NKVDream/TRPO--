// Все обращения к C# API собраны здесь. При разработке /api проксирует Vite.
async function request(path, options) {
  const response = await fetch(`/api${path}`, options);

  if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status}`);
  }

  return response.json();
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
