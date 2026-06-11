const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  createProject: (data) => request('/projects', { method: 'POST', body: data }),
  getProject: (slug) => request(`/projects/${slug}`),
  updateProject: (slug, data) => request(`/projects/${slug}`, { method: 'PUT', body: data }),
  deleteProject: (slug) => request(`/projects/${slug}`, { method: 'DELETE' }),

  // Story
  getStory: (slug) => request(`/projects/${slug}/story`),
  updateStory: (slug, text) => request(`/projects/${slug}/story`, { method: 'PUT', body: { text } }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: data }),

  // AI
  getAiStatus: () => request('/ai/status'),
  getAiModels: () => request('/ai/models'),
  chatAi: (data) => request('/ai/chat', { method: 'POST', body: data }),

  // Exports
  getExports: (slug) => request(`/projects/${slug}/exports`),
  exportHtml: (slug, data) => request(`/projects/${slug}/export/html`, { method: 'POST', body: data }),
  exportFountain: (slug) => request(`/projects/${slug}/export/fountain`, { method: 'POST' }),
  exportPdf: (slug) => request(`/projects/${slug}/export/pdf`, { method: 'POST' }),
  getSnapshots: (slug) => request(`/projects/${slug}/snapshots`),
  createSnapshot: (slug) => request(`/projects/${slug}/snapshot`, { method: 'POST' }),
};
