import React from "react";
import { View, Text } from "react-native";
import { useThemeMode } from "../../hooks/ThemeContext";
import { Colors } from "../../constants/Colors";
import PremiumFeatureCard from "../../components/premium/PremiumFeatureCard";

export default function PremiumScreen() {
  const { colorScheme } = useThemeMode();
  const bgColor = Colors[colorScheme].background;
  const cardBg = colorScheme === "dark" ? "#232650" : "#f3f4f6";
  const textColor = Colors[colorScheme].text;
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
        paddingTop: 48,
      }}
    >
      <Text
        style={{
          fontWeight: "bold",
          marginBottom: 20,
          color: textColor,
        }}
      >
        Accédez au Premium 🚀
      </Text>
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 18,
          padding: 18,
          width: 320,
          shadowColor: colorScheme === "dark" ? "#000" : "#aaa",
          shadowOpacity: 0.12,
          shadowRadius: 8,
        }}
      >
        <PremiumFeatureCard />
      </View>
    </View>
  );
}
