import { useThemeMode } from './ThemeContext';
import { Appearance } from 'react-native';

export function useColorScheme() {
  // Privilégie le context global si dispo
  try {
    const ctx = useThemeMode();
    if (ctx && ctx.colorScheme) return ctx.colorScheme;
  } catch {}
  // Fallback legacy
  return Appearance.getColorScheme() || 'light';
}
