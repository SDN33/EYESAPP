import React from "react";
import { View } from "react-native";

export default function TabBarBackground() {
  return (
    <View style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 16,
      height: 60,
      backgroundColor: "#191A22",
      borderRadius: 0, // plus d'arrondi
      shadowColor: "#000", shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
      elevation: 8,
      borderWidth: 1,
      borderColor: "#23242A",
    }} />
  );
}
