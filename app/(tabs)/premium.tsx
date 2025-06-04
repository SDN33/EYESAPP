import React from "react";
import { View, Text } from "react-native";
import PremiumFeatureCard from "../../components/premium/PremiumFeatureCard";

export default function PremiumScreen() {
  const colorScheme =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  const isDark = colorScheme === "dark";
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#181B2C" : "#fff",
      }}
    >
      <Text
        style={{
          fontWeight: "bold",
          marginBottom: 20,
          color: isDark ? "#fff" : "#222",
        }}
      >
        Accédez au Premium 🚀
      </Text>
      <View
        style={{
          backgroundColor: isDark ? "#23242A" : "#f3f4f6",
          borderRadius: 18,
          padding: 18,
          width: 320,
          shadowColor: isDark ? "#000" : "#aaa",
          shadowOpacity: 0.12,
          shadowRadius: 8,
        }}
      >
        <PremiumFeatureCard />
      </View>
    </View>
  );
}
