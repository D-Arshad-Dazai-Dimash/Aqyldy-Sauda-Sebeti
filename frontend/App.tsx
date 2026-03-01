import React, { useEffect } from 'react';
import RootNavigation from './src/app/navigation';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return <RootNavigation />;
}