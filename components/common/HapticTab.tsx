import React from "react";
import { TouchableOpacity, Text } from "react-native";
import * as Haptics from "expo-haptics";

export default function HapticTab({ title, onPress }: { title: string; onPress: () => void }) {
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };
  return (
    <TouchableOpacity onPress={handlePress}>
      <Text style={{ padding: 8, fontWeight: "bold" }}>{title}</Text>
    </TouchableOpacity>
  );
}
