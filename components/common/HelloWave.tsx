import React from "react";
import { View, Text } from "react-native";

export default function HelloWave({ name = "motard" }: { name?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>👋 Salut, {name} !</Text>
    </View>
  );
}
