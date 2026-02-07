import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const url = envUrl && envUrl.trim() !== '' ? envUrl.trim() : (import.meta.env.DEV ? 'http://localhost:5050/api' : '/api');
  if (url && !url.endsWith('/api') && !url.endsWith('/api/')) {
    return url.replace(/\/?$/, '') + '/api';
  }
  return url;
};

export { getBaseURL };

/** API base (e.g. https://xxx.onrender.com/api) → backend root (https://xxx.onrender.com) */
export const getBackendRoot = () => {
  const base = getBaseURL();
  return base.replace(/\/api\/?$/, '') || base;
};

// Canlıda backend (örn. Render free) cold start 1–2 dk sürebilir
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (status === 429) {
      const msg = error.response?.data?.error || 'Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin.';
      error.message = msg;
    }
    return Promise.reject(error);
  }
);

/** Sayfa açılışında backend uyansın diye health ping (canlıda kullan) */
export const pingBackendHealth = (timeoutMs = 120000): Promise<boolean> => {
  const root = getBackendRoot();
  if (import.meta.env.DEV) return Promise.resolve(true);
  return axios
    .get(`${root}/health`, { timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
};

export default api;
