import React, { useEffect } from 'react';
import RootNavigation from './src/app/navigation';
import { useAuthStore } from './src/store/authStore';
import { useFavoritesStore } from './src/store/favoritesStore';
import { useLanguageStore } from './src/store/languageStore';
import { useLocationStore } from './src/store/locationStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const loadFavorites = useFavoritesStore((s) => s.load);
  const bootstrapLanguage = useLanguageStore((s) => s.bootstrapLanguage);
  const initLocation = useLocationStore((s) => s.init);

  useEffect(() => {
    bootstrap();
    loadFavorites();
    bootstrapLanguage();
    // Best-effort: kick off store list + GPS so the cart, scanner and
    // recommendations have an `activeStoreId` ready before the user reaches
    // them. Failure is silent (init handles its own errors).
    initLocation();
  }, [bootstrap, loadFavorites, bootstrapLanguage, initLocation]);

  return <RootNavigation />;
}