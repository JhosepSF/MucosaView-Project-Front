// App.tsx
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppNavigator from './src/navigation/AppNavigator';
import { initDb } from './src/libs/db';    
import { startAutoSync, trySync } from './src/libs/sync';

enableScreens(); 
const qc = new QueryClient();

export default function App() {
  useEffect(() => {
    initDb();                 // crea tablas (API nueva de expo-sqlite)
    const off = startAutoSync(); // se suscribe a cambios de red
    trySync();                // intenta sincronizar al abrir
    return () => off?.();     // limpia el listener al desmontar
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
