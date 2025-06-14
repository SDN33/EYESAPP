// hooks/useLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation(mode: 'moto' | 'auto' = 'moto') {
  const [location, setLocation] = useState<(Location.LocationObject & { mode: 'moto' | 'auto' }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number | null = null;
    let cleanup: (() => void) | undefined;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      // Web: utilise watchPosition pour le tracking temps réel
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              accuracy: pos.coords.accuracy,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            },
            timestamp: pos.timestamp,
            mode,
          });
        },
        (err) => setError(err.message),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      cleanup = () => {
        if (watchId !== null && navigator.geolocation.clearWatch) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    } else {
      // Mobile natif : expo-location
      let sub: any;
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission localisation refusée');
          return;
        }
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Highest, timeInterval: 250, distanceInterval: 0.5 },
          (loc) => setLocation({ ...(loc as Location.LocationObject), mode })
        );
      })();
      cleanup = () => {
        if (sub && sub.remove) sub.remove();
      };
    }
    return cleanup;
  }, [mode]);

  return { location, error };
}
