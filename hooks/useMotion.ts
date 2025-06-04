// hooks/useMotion.ts

import { useState, useEffect } from "react";
import { Accelerometer, Gyroscope } from "expo-sensors";

type MotionData = {
  acceleration: { x: number; y: number; z: number } | null;
  rotation: { x: number; y: number; z: number } | null;
};

export function useMotion(updateInterval: number = 300): MotionData {
  const [acceleration, setAcceleration] = useState<MotionData["acceleration"]>(null);
  const [rotation, setRotation] = useState<MotionData["rotation"]>(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(updateInterval);
    Gyroscope.setUpdateInterval(updateInterval);

    const accSub = Accelerometer.addListener(setAcceleration);
    const gyroSub = Gyroscope.addListener(setRotation);

    return () => {
      accSub.remove();
      gyroSub.remove();
    };
  }, [updateInterval]);

  return { acceleration, rotation };
}
