// hooks/useHeading.ts

import { useState, useEffect } from "react";
import { Magnetometer } from "expo-sensors";

function calculateHeading({ x, y }: { x: number; y: number }) {
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return Math.round(angle); // 0 = Nord, 90 = Est, 180 = Sud, 270 = Ouest
}

export function useHeading(updateInterval: number = 400): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    Magnetometer.setUpdateInterval(updateInterval);
    const sub = Magnetometer.addListener(data => {
      setHeading(calculateHeading(data));
    });
    return () => sub.remove();
  }, [updateInterval]);

  return heading;
}
