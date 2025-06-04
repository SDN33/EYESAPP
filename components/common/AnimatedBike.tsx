// components/common/AnimatedBike.tsx
import React from "react";
import { Animated, View, Image } from "react-native";

type AnimatedBikeProps = {
  lean: number; // angle en degrés, négatif = penche à gauche
};

export default function AnimatedBike({ lean }: AnimatedBikeProps) {
  // Animation via rotationZ (lean)
  return (
    <View style={{ alignItems: "center", justifyContent: "center", margin: 12 }}>
      <Animated.View
        style={{
          transform: [{ rotate: `${lean}deg` }]
        }}
      >
        {/* Prends une icône moto simple ou une image png/svg */}
        <Image source={require("../../assets/images/moto.png")} style={{ width: 80, height: 40 }} />
      </Animated.View>
    </View>
  );
}
