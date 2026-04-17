import React, { useEffect } from 'react';
import RootNavigation from './src/app/navigation';
import { useAuthStore } from './src/store/authStore';
import { useFavoritesStore } from './src/store/favoritesStore';
import { useLanguageStore } from './src/store/languageStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const loadFavorites = useFavoritesStore((s) => s.load);
  const bootstrapLanguage = useLanguageStore((s) => s.bootstrapLanguage);

  useEffect(() => {
    bootstrap();
    loadFavorites();
    bootstrapLanguage();
  }, [bootstrap, loadFavorites, bootstrapLanguage]);

  return <RootNavigation />;
}