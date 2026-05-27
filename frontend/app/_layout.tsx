import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/hooks/useAuth';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import '@/i18n'; // Initialize i18n
import { loadPersistedLanguage } from '@/i18n';
import { useEffect } from 'react';

// Tell React Query how to detect network status
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours (data stays valid for offline use)
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      retry: 2,
    },
  },
});

// Configure persistence to AsyncStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
});

export default function RootLayout() {
  useFrameworkReady();

  // Restore the user's previously selected language from AsyncStorage
  useEffect(() => {
    loadPersistedLanguage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineIndicator />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(mhp)" />
          <Stack.Screen name="(chw)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(family)" />
          <Stack.Screen name="(shared)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
