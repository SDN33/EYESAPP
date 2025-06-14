// hooks/useNearbyUsers.ts
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { haversine } from '../utils/haversine';
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
 * Hook pour récupérer les utilisateurs proches dans un rayon donné (en mètres)
 * @param radius Rayon en mètres (par défaut 5000m)
 * @param onlyActive Filtrer uniquement les utilisateurs actifs (par défaut true)
 */
export function useNearbyUsers(radius: number = 5000, onlyActive: boolean = true) {
  const { location } = useLocation();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    // Récupère tous les utilisateurs avec coordonnées (optionnel: filtrer côté serveur sur is_active)
    let query = supabase
      .from('users')
      .select('id, name, lat, lng, is_premium, last_seen_at, mode, is_active');
    if (onlyActive) query = query.eq('is_active', true);
    query.then(({ data, error }) => {
      setLoading(false);
      if (error || !data) return;
      // Filtrage Haversine côté client
      const filtered = data.filter((u: any) =>
        typeof u.lat === 'number' && typeof u.lng === 'number' &&
        haversine(location.coords.latitude, location.coords.longitude, u.lat, u.lng) <= radius
      );
      setUsers(filtered);
    });
  }, [location, radius, onlyActive]);

  return { users, loading };
}
