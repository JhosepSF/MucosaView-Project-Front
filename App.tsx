// App.tsx
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppNavigator from './src/navigation/AppNavigator';
import { initDb } from './src/libs/db';

enableScreens(); 
const qc = new QueryClient();

export default function App() {
  useEffect(() => {
    initDb();                 // crea tablas (API nueva de expo-sqlite)
    
    // SINCRONIZACIÓN MANUAL DESHABILITADA
    // La sincronización ahora es completamente MANUAL desde SyncQueueScreen
    // para evitar pérdida de datos durante conexiones inestables.
    // const off = startAutoSync(); // suscripción a cambios de red - DESHABILITADO
    // trySync();                   // sincronización automática al abrir - DESHABILITADO
    // return () => off?.();         // limpieza del listener - DESHABILITADO
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
