import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export type Alert = {
  id: string;
  user_id: string;
  type: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

// Retourne les alertes actives (moins de 15 min)
export function useActiveAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => {
    let isMounted = true;
    async function fetchAlerts() {
      const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .gte('created_at', since);
      if (!error && isMounted) setAlerts(data || []);
    }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // refresh toutes les 10s
    return () => { isMounted = false; clearInterval(interval); };
  }, []);
  return alerts;
}
