import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5050/api';
  }
  return import.meta.env.VITE_API_URL || '/api';
};

// Canlıda backend (örn. Render) cold start'ta 30+ sn sürebilir
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 35000,
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

export default api;
