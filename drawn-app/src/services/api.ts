import axios from 'axios';
import { API_URL } from '../config';
import { getToken, deleteToken } from './storage';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) await deleteToken();
    return Promise.reject(error);
  },
);

export const login = (username: string, password: string) =>
  api.post<{ access_token: string }>('/auth/login', { username, password });

export const registerClick = () => api.post('/clicks');

export default api;
