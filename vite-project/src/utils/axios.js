import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = String(response?.config?.method || '').toLowerCase();
    const url = String(response?.config?.url || '');
    const isWrite = method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
    const touchesStock = url.includes('/ingredients') || url.includes('/orders') || url.includes('/stock-movements');

    if (isWrite && touchesStock && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('stock-updated'));
    }

    return response;
  },
  (error) => {
    if (error?.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
