import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const MODE_KEY = 'theme-mode'; // 'system' | 'light' | 'dark'

export function useColorScheme() {
  const [mode, setMode] = useState<'system' | 'light' | 'dark'>('system');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let stored: string | null = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      stored = localStorage.getItem(MODE_KEY);
    }
    if (!stored && typeof global !== 'undefined' && global.AsyncStorage) {
      // @ts-ignore
      stored = global.AsyncStorage.getItem(MODE_KEY);
    }
    setMode((stored as any) || 'system');
  }, []);

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

  return colorScheme;
}
