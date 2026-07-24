import axios from 'axios';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35_000, // 35 s — Groq can take up to ~30 s on long pages
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
      router.replace('/(auth)/welcome');
    }
    return Promise.reject(error);
  }
);

export default api;
