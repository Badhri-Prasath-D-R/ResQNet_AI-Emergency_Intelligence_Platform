const normalizeBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const getApiBaseUrl = () => {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (configured) return configured;
  return import.meta.env.DEV ? 'http://localhost:8000' : '';
};

const getWsBaseUrl = () => {
  const configured = normalizeBaseUrl(import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL);
  if (configured) return configured;
  return import.meta.env.DEV ? 'http://localhost:8000' : '';
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const buildWsUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!WS_BASE_URL) return normalizedPath;

  const base = WS_BASE_URL.startsWith('ws://') || WS_BASE_URL.startsWith('wss://')
    ? WS_BASE_URL
    : WS_BASE_URL.startsWith('https://')
      ? WS_BASE_URL.replace(/^https/, 'wss')
      : WS_BASE_URL.startsWith('http://')
        ? WS_BASE_URL.replace(/^http/, 'ws')
        : `ws://${WS_BASE_URL}`;

  return `${base}${normalizedPath}`;
};
