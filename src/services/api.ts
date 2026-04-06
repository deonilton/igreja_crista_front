import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = sessionStorage.getItem('@igreja:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      sessionStorage.removeItem('@igreja:token');
      sessionStorage.removeItem('@igreja:user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { status: 401 } }));
    }

    if (status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', { detail: { status: 403 } }));
    }

    return Promise.reject(error);
  }
);

export default api;
