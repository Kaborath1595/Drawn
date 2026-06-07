import axios from 'axios';
import { API_URL } from '../config';


const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export const login = (username: string, password: string) =>
  api.post<{ access_token: string }>('/auth/login', { username, password });

export const register = (username: string, password: string) =>
  api.post<{ access_token: string }>('/auth/register', { username, password });

export const registerClick = (): Promise<Response> => {
  const token = localStorage.getItem('jwt_token');
  return fetch(`${API_URL}/clicks`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

export default api;
