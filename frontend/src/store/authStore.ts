import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Role } from '../types/auth';
import * as AuthApi from '../api/auth';

type AuthState = {
  accessToken: string | null;
  role: Role | null;
  user: any | null;
  isBootstrapping: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const KEY_TOKEN = 'auth:accessToken';
const KEY_ROLE = 'auth:role';

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  role: null,
  user: null,
  isBootstrapping: true,

  bootstrap: async () => {
    const [t, r] = await Promise.all([
      AsyncStorage.getItem(KEY_TOKEN),
      AsyncStorage.getItem(KEY_ROLE),
    ]);
    set({ accessToken: t, role: (r as Role) ?? null, isBootstrapping: false });

    // если есть токен — подтянем /api/me
    if (t) {
      try {
        const user = await AuthApi.me();
        set({ user });
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
    if (role) await AsyncStorage.setItem(KEY_ROLE, role);

    set({ accessToken: token, role });

    // подтягиваем user
    const user = await AuthApi.me();
    set({ user });
  },

  register: async (email, password, name) => {
    const data = await AuthApi.register({ email, password, name });

    const token = data.accessToken;
    const role = (data.role ?? null) as Role | null;

    await AsyncStorage.setItem(KEY_TOKEN, token);
    if (role) await AsyncStorage.setItem(KEY_ROLE, role);

    set({ accessToken: token, role });

    const user = await AuthApi.me();
    set({ user });
  },

  logout: async () => {
    await Promise.all([
      AsyncStorage.removeItem(KEY_TOKEN),
      AsyncStorage.removeItem(KEY_ROLE),
    ]);
    set({ accessToken: null, role: null, user: null });
  },
}));