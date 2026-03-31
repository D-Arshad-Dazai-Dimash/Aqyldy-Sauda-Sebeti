import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const STORAGE_KEY = 'favorites:ids';

interface FavoritesState {
  favorites: string[];
  loaded: boolean;
  load: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  loaded: false,

  load: async () => {
    try {
      // Бэкенддан жүктеу (авторизацияланған болса)
      const res = await api.get<string[]>('/api/favorites/ids');
      const ids = res.data.map((id: any) => String(id));
      set({ favorites: ids, loaded: true });
      // AsyncStorage-ке де сақтаймыз (офлайн fallback)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
    } catch {
      // Бэкенд қолжетімсіз болса — AsyncStorage-тен аламыз
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          set({ favorites: JSON.parse(raw), loaded: true });
        } else {
          set({ loaded: true });
        }
      } catch {
        set({ loaded: true });
      }
    }
  },

  toggleFavorite: async (productId) => {
    // Оптимистикалық жаңарту: алдымен UI жаңартамыз
    const current = get().favorites;
    const isCurrentlyFav = current.includes(productId);
    const optimistic = isCurrentlyFav
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    set({ favorites: optimistic });

    try {
      // Бэкендке POST — toggle (қосса 200, өшірсе 204)
      await api.post(`/api/favorites/${productId}`);
      // AsyncStorage жаңарту
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(optimistic)).catch(() => {});
    } catch {
      // Қате болса — оптимистикалық өзгерісті қайтарамыз
      set({ favorites: current });
    }
  },

  isFavorite: (productId) => get().favorites.includes(productId),
}));
