// hooks/useLeanAngle.ts
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useLeanAngle() {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Mobile natif : expo-sensors
      let subscription: any;
      const { DeviceMotion } = require('expo-sensors');
      DeviceMotion.setUpdateInterval(200);
      subscription = DeviceMotion.addListener((motion: any) => {
        // Pour support moto (téléphone monté droit, haut vers le ciel), l'inclinaison gauche/droite = gamma
        const gamma = motion.rotation?.gamma ?? 0;
        setAngle(-Math.round((gamma * 180) / Math.PI)); // Inversion du signe
      });
      return () => {
        if (subscription) subscription.remove();
      };
    } else if (window.DeviceOrientationEvent) {
      // Web : DeviceOrientation API
      const handleOrientation = (event: DeviceOrientationEvent) => {
        // gamma = inclinaison gauche/droite, [-90, 90]
        setAngle(-(Math.round(event.gamma ?? 0))); // Inversion du signe
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    } else {
      setAngle(0);
    }
  }, []);

  return angle;
}
