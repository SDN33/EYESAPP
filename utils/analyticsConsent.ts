// utils/analyticsConsent.ts
// Centralise la gestion du consentement analytics (RGPD)
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'analytics_consent';

export async function hasAnalyticsConsent(): Promise<boolean> {
  const value = await AsyncStorage.getItem(CONSENT_KEY);
  return value === 'true';
}

export async function setAnalyticsConsent(value: boolean): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, value ? 'true' : 'false');
}

// Wrapper pour bloquer l'envoi d'analytics si refusé
export async function withAnalyticsConsent<T>(fn: () => Promise<T> | T): Promise<T | null> {
  const consent = await hasAnalyticsConsent();
  if (!consent) return null;
  return await fn();
}
