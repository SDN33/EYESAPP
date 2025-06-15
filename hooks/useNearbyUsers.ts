// hooks/useNearbyUsers.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useLocation } from './useLocation';

export type NearbyUser = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  is_premium?: boolean;
  last_seen_at?: string;
  mode?: string;
};

/**
 * Hook pour récupérer les utilisateurs proches dans un rayon donné (en mètres) via filtrage géospatial Supabase/PostGIS
 * @param radius Rayon en mètres (par défaut 100m)
 * @param mode Mode de l'utilisateur ('moto' ou 'auto')
 */
export function useNearbyUsers(radius: number = 100, mode: 'moto' | 'auto' = 'moto') {
  const { location } = useLocation(mode);
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location?.coords) return;
    setLoading(true);
    (async () => {
      let userId = 'me';
      if (supabase.auth.getUser) {
        const user = await supabase.auth.getUser();
        if (user && user.data && user.data.user && user.data.user.id) {
          userId = user.data.user.id;
        }
      }
      const userData = {
        id: userId,
        name: 'You (test)',
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        last_seen_at: new Date().toISOString(),
        is_active: true,
        mode: location.mode,
      };
      await supabase
        .from('users')
        .upsert([userData], { onConflict: 'id' });
      // Après update, on récupère les users proches
      supabase
        .rpc('users_within_radius', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          radius_m: radius
        })
        .then(({ data, error }) => {
          setLoading(false);
          // Ajout d'un log détaillé pour debug
          console.log('[NearbyUsers][Debug] userId:', userId, 'mode:', mode, 'location:', location.coords, 'data:', data, 'error:', error);
          if (error || !data) return;
          setUsers(data);
        });
    })();
  }, [location, radius, mode]);

  return { users, loading };
}
