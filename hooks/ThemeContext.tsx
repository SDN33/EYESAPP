import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODE_KEY = 'theme-mode'; // 'system' | 'light' | 'dark'

export type ThemeMode = 'system' | 'light' | 'dark';

export const ThemeContext = createContext<{
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colorScheme: 'light' | 'dark';
}>({
  mode: 'system',
  setMode: () => {},
  colorScheme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  // Chargement initial
  useEffect(() => {
    const load = async () => {
      let stored = 'system';
      if (Platform.OS === 'web') {
        stored = localStorage.getItem(MODE_KEY) || 'system';
      } else {
        const val = await AsyncStorage.getItem(MODE_KEY);
        if (val) stored = val;
      }
      setMode(stored as ThemeMode);
    };
    load();
  }, []);

  // Appliquer le mode
  useEffect(() => {
    if (mode === 'system') {
      const sys = Appearance.getColorScheme() || 'light';
      setColorScheme(sys);
      const listener = Appearance.addChangeListener(({ colorScheme }) => {
        setColorScheme(colorScheme || 'light');
      });
      return () => listener.remove();
    } else {
      setColorScheme(mode);
    }
  }, [mode]);

  // Persistance
  const setModePersist = async (m: ThemeMode) => {
    setMode(m);
    if (Platform.OS === 'web') {
      localStorage.setItem(MODE_KEY, m);
    } else {
      await AsyncStorage.setItem(MODE_KEY, m);
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode: setModePersist, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
