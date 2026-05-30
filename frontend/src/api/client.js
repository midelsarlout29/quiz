import axios from 'axios';

const defaultBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:4000/api';

function resolveApiBaseUrl(value) {
  const configured = String(value || '').trim();
  if (!configured) return defaultBaseUrl;
  if (configured === '/api' || configured.endsWith('/api')) return configured;
  if (configured.endsWith('/api/')) return configured.slice(0, -1);
  if (configured.startsWith('/')) return `${configured.replace(/\/$/, '')}/api`;

  try {
    const url = new URL(configured);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/api`;
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_URL)
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_quiz_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(error) {
  return error?.response?.data?.message || error.message || 'Terjadi kesalahan';
}
