import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Role } from '../types/auth';
import * as AuthApi from '../api/auth';
import { useFavoritesStore } from './favoritesStore';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;
  user: any | null;
  isBootstrapping: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  registerBusiness: (data: {
    email: string; password: string; name?: string;
    storeName: string; storeAddress?: string; phone?: string;
    bin?: string; workingHours?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
};

const KEY_TOKEN = 'auth:accessToken';
const KEY_REFRESH = 'auth:refreshToken';
const KEY_ROLE = 'auth:role';

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  role: null,
  user: null,
  isBootstrapping: true,

  setAccessToken: (token: string) => set({ accessToken: token }),

  bootstrap: async () => {
    const [t, r, rt] = await Promise.all([
      AsyncStorage.getItem(KEY_TOKEN),
      AsyncStorage.getItem(KEY_ROLE),
      AsyncStorage.getItem(KEY_REFRESH),
    ]);
    set({ accessToken: t, refreshToken: rt, role: (r as Role) ?? null, isBootstrapping: false });

    // если есть токен — подтянем /api/me
    if (t) {
      try {
        const user = await AuthApi.me();
        set({ user });
        await useFavoritesStore.getState().load();
      } catch {
        await get().logout();
      }
    }
  },

  login: async (email, password) => {
    const data = await AuthApi.login({ email, password });

    const token = data.accessToken;
    const role = (data.role ?? null) as Role | null;

    await AsyncStorage.setItem(KEY_TOKEN, token);
    if (data.refreshToken) await AsyncStorage.setItem(KEY_REFRESH, data.refreshToken);
    if (role) await AsyncStorage.setItem(KEY_ROLE, role);

    set({ accessToken: token, refreshToken: data.refreshToken ?? null, role });

    // подтягиваем user
    const user = await AuthApi.me();
    set({ user });
    await useFavoritesStore.getState().load();
  },

  register: async (email, password, name) => {
    const data = await AuthApi.register({ email, password, name });

    const token = data.accessToken;
    const role = (data.role ?? null) as Role | null;

    await AsyncStorage.setItem(KEY_TOKEN, token);
    if (data.refreshToken) await AsyncStorage.setItem(KEY_REFRESH, data.refreshToken);
    if (role) await AsyncStorage.setItem(KEY_ROLE, role);

    set({ accessToken: token, refreshToken: data.refreshToken ?? null, role });

    const user = await AuthApi.me();
    set({ user });
    await useFavoritesStore.getState().load();
  },

  registerBusiness: async (params) => {
    const data = await AuthApi.registerBusiness(params);

    const token = data.accessToken;
    const role = (data.role ?? null) as Role | null;

    await AsyncStorage.setItem(KEY_TOKEN, token);
    if (data.refreshToken) await AsyncStorage.setItem(KEY_REFRESH, data.refreshToken);
    if (role) await AsyncStorage.setItem(KEY_ROLE, role);

    set({ accessToken: token, refreshToken: data.refreshToken ?? null, role });

    const user = await AuthApi.me();
    set({ user });
    await useFavoritesStore.getState().load();
  },

  logout: async () => {
    const refreshToken = await AsyncStorage.getItem(KEY_REFRESH);
    if (refreshToken) {
      const { api } = require('../api/client');
      api.post('/api/auth/logout', { refreshToken }).catch(() => {});
    }
    await AsyncStorage.multiRemove([KEY_TOKEN, KEY_REFRESH, KEY_ROLE]);
    set({ accessToken: null, refreshToken: null, role: null, user: null });
    useFavoritesStore.setState({ favorites: [], loaded: false });
  },
}));