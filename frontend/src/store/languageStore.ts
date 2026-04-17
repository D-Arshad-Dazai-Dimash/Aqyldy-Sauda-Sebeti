import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AppLanguage = 'kk' | 'ru';

const KEY_LANG = 'app:language';

type LanguageState = {
  language: AppLanguage;
  bootstrapLanguage: () => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'kk',

  bootstrapLanguage: async () => {
    const stored = await AsyncStorage.getItem(KEY_LANG);
    if (stored === 'kk' || stored === 'ru') {
      set({ language: stored });
    }
  },

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(KEY_LANG, lang);
    set({ language: lang });
  },

  toggleLanguage: async () => {
    const next = get().language === 'kk' ? 'ru' : 'kk';
    await AsyncStorage.setItem(KEY_LANG, next);
    set({ language: next });
  },
}));
