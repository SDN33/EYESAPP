import React from "react";
import { View, Text } from "react-native";
import PremiumFeatureCard from "../../components/premium/PremiumFeatureCard";

export default function PremiumScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontWeight: "bold", marginBottom: 20 }}>Accédez au Premium 🚀</Text>
      <PremiumFeatureCard />
    </View>
  );
}
