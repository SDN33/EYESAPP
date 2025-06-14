import { useEffect, useState } from 'react';
import { Alert } from './useActiveAlerts';
import { useLocation } from './useLocation';

// Distance en mètres pour déclencher la notification
const ALERT_RADIUS = 200;

export function useNearbyAlert(alerts: Alert[]) {
  const { location } = useLocation();
  const [nearby, setNearby] = useState<Alert | null>(null);

  useEffect(() => {
    if (!location || !alerts.length) return setNearby(null);
    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;
    const now = Date.now();
    const found = alerts.find(alert => {
      const dLat = (alert.latitude - userLat) * Math.PI / 180;
      const dLon = (alert.longitude - userLon) * Math.PI / 180;
      const a = Math.sin(dLat/2) ** 2 + Math.cos(userLat * Math.PI / 180) * Math.cos(alert.latitude * Math.PI / 180) * Math.sin(dLon/2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = 6371000 * c; // Terre en mètres
      return distance < ALERT_RADIUS;
    });
    setNearby(found || null);
  }, [location, alerts]);

  return nearby;
}
