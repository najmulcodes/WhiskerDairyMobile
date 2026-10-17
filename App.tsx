import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BrandSplash } from './src/components/BrandSplash';
import { AppNavigator } from './src/navigation/AppNavigator';
import { EmptyState } from './src/components/EmptyState';
import { getMissingConfig } from './src/lib/config';
import { Colors } from './src/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function ConfigMissingScreen({ missing }: { missing: string[] }) {
  // BrandSplash keeps the native splash up; release it when the app never mounts it.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <EmptyState
          icon="warning-outline"
          title="App configuration missing"
          message={`This build is missing required settings:\n${missing.join('\n')}`}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Root() {
  const { loading } = useAuth();
  return (
    <BrandSplash ready={!loading}>
      <StatusBar style="auto" />
      <AppNavigator />
    </BrandSplash>
  );
}

export default function App() {
  const missing = getMissingConfig();

  if (missing.length > 0) {
    return <ConfigMissingScreen missing={missing} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Root />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
