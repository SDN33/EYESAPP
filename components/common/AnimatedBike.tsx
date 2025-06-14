// components/common/AnimatedBike.tsx
import React from "react";
import { Animated, View } from "react-native";
import Svg, { G, Circle, Rect, Path, Ellipse, Line } from "react-native-svg";

type AnimatedBikeProps = {
  lean: number; // angle en degrés, négatif = penche à gauche
};

export default function AnimatedBike({ lean }: AnimatedBikeProps) {
  // Clamp lean angle for visual clarity (e.g., max 45°)
  const clampedLean = Math.max(-45, Math.min(45, lean));
  // Map lean to arc sweep (in degrees)
  const arcStart = 135; // leftmost
  const arcEnd = 45;    // rightmost
  const arcAngle = ((clampedLean + 45) / 90) * (arcEnd - arcStart) + arcStart;
  // Arc path for inclinometer (inspired by aviation attitude indicator)
  const arcPath = `M10 30 A10 10 0 0 1 30 30`;
  // Needle endpoint (polar to cartesian)
  const r = 10;
  const cx = 20, cy = 30;
  const theta = ((clampedLean + 45) / 90) * Math.PI - Math.PI; // -45° to +45° mapped to -π to 0
  const needleX = cx + r * Math.cos(theta);
  const needleY = cy + r * Math.sin(theta);
  return (
    <View style={{ alignItems: "center", justifyContent: "center", margin: 0 }}>
      <Svg width={40} height={40} viewBox="0 0 40 40">
        {/* Arc (inclinometer scale) */}
        <Path d={arcPath} stroke="#A259FF" strokeWidth="2" fill="none" />
        {/* Needle (shows current lean) */}
        <Line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
        {/* Minimalistic bike (centered, rear view) */}
        <Ellipse cx="20" cy="30" rx="3.5" ry="3.5" stroke="#A259FF" strokeWidth="1.5" fill="none" />
        <Ellipse cx="20" cy="18" rx="2.2" ry="2.2" stroke="#A259FF" strokeWidth="1.2" fill="#181A20" />
        <Rect x="18.5" y="21" width="3" height="7" rx="1.5" fill="#A259FF" />
        {/* Handlebars */}
        <Path d="M16 16 Q20 12 24 16" stroke="#A259FF" strokeWidth="1.2" fill="none" />
      </Svg>
    </View>
  );
}
