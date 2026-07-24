import '../global.css';

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useFonts, DelaGothicOne_400Regular } from '@expo-google-fonts/dela-gothic-one';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/authStore';
import { JWT_KEY } from '../lib/constants';
import api from '../lib/axios';
import { NBToast } from '../components/ui';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const [fontsLoaded, fontError] = useFonts({
    DelaGothicOne: DelaGothicOne_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    (async () => {
      // Health-check: log env config so problems are visible immediately
      try {
        const { data } = await api.get('/health', { timeout: 4_000 });
        console.log('[Server]', JSON.stringify(data));
        if (!data.groqConfigured) {
          console.warn('[Server] ⚠️  GROQ_API_KEY is not set — AI features will fail');
        }
      } catch (e: any) {
        console.warn('[Server] ⚠️  Could not reach API at', api.defaults.baseURL, '—', e.message);
      }

      try {
        const token = await SecureStore.getItemAsync(JWT_KEY);
        if (token) {
          const { data } = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          await login(token, data);
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/welcome');
        }
      } catch {
        await logout();
        router.replace('/(auth)/welcome');
      } finally {
        await SplashScreen.hideAsync();
      }
    })();
  }, [fontsLoaded, fontError]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
          </Stack>
        <NBToast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
