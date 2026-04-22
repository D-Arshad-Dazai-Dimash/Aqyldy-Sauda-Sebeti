import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/env';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: config.API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401 && !isRefreshing) {
      isRefreshing = true;
      const refreshToken = await AsyncStorage.getItem('auth:refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${config.API_URL}/api/auth/refresh`, { refreshToken });
          const newToken = res.data.accessToken;
          await AsyncStorage.setItem('auth:accessToken', newToken);
          useAuthStore.getState().setAccessToken(newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          isRefreshing = false;
          return api(error.config);
        } catch {
          isRefreshing = false;
          useAuthStore.getState().logout();
        }
      } else {
        isRefreshing = false;
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
