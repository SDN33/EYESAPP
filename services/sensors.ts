// services/sensors.ts

import { Accelerometer, Gyroscope, Magnetometer } from "expo-sensors";

// Ajoute ici des fonctions utilitaires si tu veux logger tous les sensors en même temps ou formatter les data
export function subscribeToAllSensors(onData: (data: any) => void) {
  const accSub = Accelerometer.addListener((acc: any) => onData({ type: "acceleration", ...acc }));
  const gyroSub = Gyroscope.addListener((gyro: any) => onData({ type: "rotation", ...gyro }));
  const magSub = Magnetometer.addListener((mag: any) => onData({ type: "heading", ...mag }));
  return () => {
    accSub.remove();
    gyroSub.remove();
    magSub.remove();
  };
}
