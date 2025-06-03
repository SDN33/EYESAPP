import React from "react";
import { View } from "react-native";

export default function TabBarBackground() {
  return (
    <View style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 60,
      backgroundColor: "#fff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: "#000", shadowOpacity: 0.09, shadowRadius: 8,
      elevation: 2,
    }} />
  );
}
