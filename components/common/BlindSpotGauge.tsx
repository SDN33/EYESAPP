// components/common/BlindSpotGauge.tsx
import React from "react";
import { View } from "react-native";

type Spot = {
  angleStart: number;
  angleEnd: number;
  color: string;
  filled: boolean;
};

export default function BlindSpotGauge({ userBearingList = [], myHeading = 0 }) {
  // On veut 10 points, chaque "spot" couvre 36°
  const points: Spot[] = Array.from({ length: 10 }).map((_, i) => {
    const angleStart = i * 36;
    const angleEnd = angleStart + 36;
    // Check si un user est dans ce secteur (bearing relatif au heading)
    const filled = userBearingList.some(({ bearing, dist }) => {
      if (dist > 60) return false; // Seulement si <60m
      // Calcul angle relatif au heading (0 = devant, 180 = derrière)
      let relative = (bearing - myHeading + 360) % 360;
      return relative >= angleStart && relative < angleEnd;
    });
    // Couleur angle mort : points entre 120–240° (arrière latéral)
    const relAngle = (angleStart + angleEnd) / 2;
    let color = "#eee";
    if (relAngle > 120 && relAngle < 240) color = "#ff9800"; // Angle mort
    else if (relAngle <= 60 || relAngle >= 300) color = "#4caf50"; // Devant
    else color = "#1976d2"; // Latéral
    return { angleStart, angleEnd, color, filled };
  });

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 32 }}>
      {points.map((spot, i) => (
        <View
          key={i}
          style={{
            width: 22, height: 22, borderRadius: 11,
            marginHorizontal: 2,
            backgroundColor: spot.filled ? spot.color : "#ddd",
            borderWidth: 1, borderColor: "#bbb",
            opacity: spot.filled ? 1 : 0.5,
          }}
        />
      ))}
    </View>
  );
}
