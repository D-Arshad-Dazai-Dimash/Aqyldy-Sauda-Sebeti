import React, { useEffect } from 'react';
import RootNavigation from './src/app/navigation';
import { useAuthStore } from './src/store/authStore';
import { useFavoritesStore } from './src/store/favoritesStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const loadFavorites = useFavoritesStore((s) => s.load);

  useEffect(() => {
    bootstrap();
    loadFavorites();
  }, [bootstrap, loadFavorites]);

  return <RootNavigation />;
}