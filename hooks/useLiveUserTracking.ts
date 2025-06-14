// hooks/useLiveUserTracking.ts
import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';
import * as Crypto from 'expo-crypto';

/**
 * Génère un identifiant pseudonymisé (hashé) à partir de l'UUID utilisateur.
 * Ne jamais utiliser l'email !
 */
async function getHashedName(uuid: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, uuid);
}

/**
 * Hook pour tracker la position de l'utilisateur actif en temps réel (toutes les 2s)
 * et mettre à jour la table Supabase 'users' (colonne 'name' = hashé, + lat/lng/last_seen_at)
 */
export function useLiveUserTracking(userId: string | null, isActive: boolean, mode: 'moto' | 'auto' = 'moto') {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPosition = useRef<{ lat: number, lng: number, timestamp: number } | null>(null);

  useEffect(() => {
    if (!userId || !isActive) return;
    let isMounted = true;
    let hashedName: string;

    async function startTracking() {
      if (!userId) {
        console.log('[LiveTracking] Pas de userId, tracking annulé');
        return;
      }
      console.log('[LiveTracking] startTracking', { userId, mode });
      hashedName = await getHashedName(userId);
      // Demande la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[LiveTracking] Permission localisation refusée');
        return;
      }

      // Fonction d'update
      const updatePosition = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          const { latitude, longitude } = loc.coords;
          const now = Date.now();
          let isActiveSignal = true;
          if (lastPosition.current) {
            const { lat, lng, timestamp } = lastPosition.current;
            // Si la position n'a pas changé depuis 10 min (600000 ms), signal inactif
            if (lat === latitude && lng === longitude && now - timestamp > 600000) {
              isActiveSignal = false;
            }
            // Si la position a changé, on reset le timer
            if (lat !== latitude || lng !== longitude) {
              lastPosition.current = { lat: latitude, lng: longitude, timestamp: now };
              isActiveSignal = true;
            }
          } else {
            lastPosition.current = { lat: latitude, lng: longitude, timestamp: now };
          }
          const { data, error } = await supabase.from('users').upsert([
            {
              id: userId,
              name: hashedName,
              is_premium: false, // à adapter si besoin
              consent_given: true, // à adapter si besoin
              lat: latitude,
              lng: longitude,
              last_seen_at: new Date().toISOString(),
              mode,
              is_active: isActiveSignal,
            },
          ], { onConflict: 'id' });
          console.log('[LiveTracking] upsert', { id: userId, lat: latitude, lng: longitude, mode, is_active: isActiveSignal, error, data });
          if (error) console.error('[LiveTracking] Supabase error:', error);
        } catch (e) {
          console.error('[LiveTracking] Loc error:', e);
        }
      };
      // Premier update immédiat
      await updatePosition();
      // Puis toutes les 2s
      intervalRef.current = setInterval(updatePosition, 2000);
    }
    startTracking();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
    };
  }, [userId, isActive, mode]);
}
