const DEFAULT_API_URL = 'http://localhost:5000/api';

export function getQuickBookApiUrl() {
  return window.QUICKBOOK_API_URL || import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}

export async function quickBookRequest(path, options = {}) {
  const res = await fetch(`${getQuickBookApiUrl()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
