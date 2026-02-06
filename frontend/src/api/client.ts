import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5050/api';
  }
  return import.meta.env.VITE_API_URL || '/api';
};

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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
