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

// Token-refresh queue.
//
// While one refresh is in flight, every other 401 must WAIT for the same
// refresh to finish, then retry with the new token. Without a queue, parallel
// 401s each fire their own refresh — the second one sees the now-rotated
// refreshToken and 401s, and the user gets logged out even though refresh
// would have succeeded for the first request.
let isRefreshing = false;
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushQueue = (token: string | null, err?: unknown) => {
  for (const p of pendingRequests) {
    if (token) p.resolve(token);
    else p.reject(err ?? new Error('refresh failed'));
  }
  pendingRequests = [];
};

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    // Skip retry for the refresh endpoint itself and for already-retried
    // requests, otherwise we loop forever.
    const isRefreshCall = typeof original?.url === 'string' && original.url.includes('/api/auth/refresh');
    if (status !== 401 || !original || original._retry || isRefreshCall) {
      return Promise.reject(error);
    }
    original._retry = true;

    // Another request is already refreshing — queue this one.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (token: string) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await AsyncStorage.getItem('auth:refreshToken');
      if (!refreshToken) {
        flushQueue(null, error);
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      const res = await axios.post(
        `${config.API_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 15000 },
      );
      const newToken = res.data?.accessToken;
      if (!newToken) throw new Error('no accessToken in refresh response');
      await AsyncStorage.setItem('auth:accessToken', newToken);
      // Persist a rotated refresh token if the server issued one.
      if (res.data?.refreshToken) {
        await AsyncStorage.setItem('auth:refreshToken', res.data.refreshToken);
      }
      useAuthStore.getState().setAccessToken(newToken);

      flushQueue(newToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshErr) {
      flushQueue(null, refreshErr);
      // Force logout — RootNavigation watches `accessToken` and will swap
      // the navigator over to the AuthStack automatically.
      try { await useAuthStore.getState().logout(); } catch { /* noop */ }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
