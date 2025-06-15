import 'react-native-reanimated';
import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { ThemeProvider as AppThemeProvider, useThemeMode } from '../hooks/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useLiveUserTracking } from '../hooks/useLiveUserTracking';
import { UserIdContext } from '../contexts/UserIdContext';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { user } = useAuth();
  const [anonId, setAnonId] = useState<string>('');
  const [trackingMode, setTrackingMode] = useState<'moto' | 'auto'>('moto');

  useEffect(() => {
    async function getOrCreateAnonId() {
      try {
        let id = await AsyncStorage.getItem('anon_user_id');
        console.log('[RootLayout] AsyncStorage.getItem anon_user_id:', id);
        if (!id || id.length < 8) { // fallback si id vide ou corrompu
          id = uuidv4();
          try {
            await AsyncStorage.setItem('anon_user_id', id);
            console.log('[RootLayout] New anon_user_id generated and stored:', id);
          } catch (e) {
            console.warn('[RootLayout] Failed to store anon_user_id:', e);
            // On garde l'id en mémoire même si le stockage échoue
          }
        } else {
          console.log('[RootLayout] Existing anon_user_id found:', id);
        }
        setAnonId(id);
        console.log('[RootLayout] anonId set to:', id);
      } catch (err) {
        console.error('[RootLayout] Error in getOrCreateAnonId:', err);
        // Fallback ultime : générer un id en mémoire
        const fallbackId = uuidv4();
        setAnonId(fallbackId);
        console.log('[RootLayout] Fallback anonId generated:', fallbackId);
      }
    }
    getOrCreateAnonId();
    // Récupérer le mode de tracking stocké (si dispo)
    AsyncStorage.getItem('tracking_mode').then((mode) => {
      if (mode === 'auto' || mode === 'moto') setTrackingMode(mode);
    });
  }, []);

  // Effet pour relire le mode de tracking toutes les 2s
  useEffect(() => {
    const interval = setInterval(() => {
      AsyncStorage.getItem('tracking_mode').then((mode) => {
        if ((mode === 'auto' || mode === 'moto') && mode !== trackingMode) {
          setTrackingMode(mode);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [trackingMode]);

  const trackingId = user?.id ?? anonId;
  const trackingReady = !!trackingId && trackingId.length > 0;
  useEffect(() => {
    if (!trackingReady) {
      console.log('[RootLayout] trackingId not ready, waiting...');
    }
  }, [trackingReady]);
  useLiveUserTracking(trackingId, trackingReady, trackingMode);

  console.log('[RootLayout] user:', user, 'anonId:', anonId, 'trackingId:', trackingId);

  if (!loaded) {
    // Attendre que les polices soient prêtes
    return null;
  }

  return (
    <UserIdContext.Provider value={{ anonId }}>
      <AppThemeProvider>
        <ThemeWrapper />
      </AppThemeProvider>
    </UserIdContext.Provider>
  );
}

function ThemeWrapper() {
  const { colorScheme } = useThemeMode();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
