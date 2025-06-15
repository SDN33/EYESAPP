// hooks/useNearbyUsers.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useLocation } from './useLocation';
import { useAuth } from './useAuth';
import { useUserId } from './useUserId';

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
  const { user } = useAuth();
  const myId = useUserId();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(false);

  const getOtherUserId = (u: any) => u?.id || u?.user_id || u?.sub || u?.uid || u?.email || 'default';

  useEffect(() => {
    if (!location?.coords) return;
    setLoading(true);
    (async () => {
      const userId = myId;
      const userData = {
        id: userId,
        name: userId,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        last_seen_at: new Date().toISOString(),
        is_active: true,
        mode: mode, // Correction : toujours utiliser le paramètre mode du hook
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
          // Filtrage : ne garder que les users actifs (moins de 2 min)
          const now = Date.now();
          const filtered = data.filter((user: any) => {
            if (!user.last_seen_at) return false;
            return new Date(user.last_seen_at).getTime() > now - 2 * 60 * 1000;
          });
          setUsers(filtered);
        });
    })();
  }, [location, radius, mode, user]);

  return { users, loading };
}
