const normalizeBaseUrl = (value?: string) => {
  if (!value) return 'http://localhost:8000';
  return value.replace(/\/+$/, '');
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);
export const WS_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL);

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const buildWsUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = WS_BASE_URL.startsWith('ws://') || WS_BASE_URL.startsWith('wss://')
    ? WS_BASE_URL
    : WS_BASE_URL.startsWith('https://')
      ? WS_BASE_URL.replace(/^https/, 'wss')
      : WS_BASE_URL.startsWith('http://')
        ? WS_BASE_URL.replace(/^http/, 'ws')
        : `ws://${WS_BASE_URL}`;

  return `${base}${normalizedPath}`;
};
