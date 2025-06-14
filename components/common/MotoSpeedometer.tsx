import React, { useEffect } from "react";
import { View, Text, Platform } from "react-native";
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G, Filter } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MotoSpeedometer({ speed, speedLimit, isOverLimit, color = "#A259FF" }) {
  const maxSpeed = 220;
  const radius = 90;
  const strokeWidth = 18;
  const arcLength = Math.PI * radius; // demi-cercle
  const speedPerc = Math.min(speed / maxSpeed, 1);
  const animated = useSharedValue(speedPerc);

  useEffect(() => {
    animated.value = withTiming(speedPerc, { duration: 700, easing: Easing.out(Easing.exp) });
  }, [speedPerc]);

  const animatedProps = useAnimatedProps(() => {
    const dashoffset = arcLength - (animated.value * arcLength);
    return { strokeDashoffset: dashoffset };
  });

  // Couleur dynamique
  const arcColor = isOverLimit ? "#EF4444" : color;
  const shadowColor = isOverLimit ? "#EF4444" : color;

  return (
    <View style={{ width: 210, height: 140, alignItems: "center", justifyContent: "center" }}>
      <Svg width={210} height={140}>
        <Defs>
          <LinearGradient id="speedo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={arcColor} stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>
        {/* Fond verre */}
        <Circle cx={105} cy={120} r={radius + 10} fill="#fff" opacity={0.05} />
        {/* Arc fond */}
        <Path
          d={`M${105 - radius},120 A${radius},${radius} 0 0,1 ${105 + radius},120`}
          stroke="#444"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={0.18}
        />
        {/* Arc dynamique */}
        <AnimatedCircle
          cx={105}
          cy={120}
          r={radius}
          stroke="url(#speedo-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={arcLength}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-180}
          originX={105}
          originY={120}
        />
      </Svg>
      {/* Affichage digital */}
      <View style={{ position: "absolute", top: 38, left: 0, right: 0, alignItems: "center" }}>
        <Text style={{ fontSize: 54, fontWeight: "700", color: isOverLimit ? "#EF4444" : color, letterSpacing: -2, textShadowColor: shadowColor, textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } }}>{speed}</Text>
        <Text style={{ color: color, fontSize: 18, fontWeight: "600", marginTop: -6 }}>km/h</Text>
      </View>
      {/* Badge limite stylisé */}
      <View style={{ position: "absolute", right: 18, top: 18, backgroundColor: isOverLimit ? "#EF4444" : color, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, shadowColor: shadowColor, shadowOpacity: 0.18, shadowRadius: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>{speedLimit > 0 ? speedLimit : "—"}</Text>
      </View>
      {/* Effet halo */}
      {isOverLimit && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140, borderRadius: 99, backgroundColor: "#EF444420", zIndex: -1 }} />
      )}
    </View>
  );
}
