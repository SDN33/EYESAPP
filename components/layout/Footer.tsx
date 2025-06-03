import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.txt}>© 2024 Moto Angles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 8,
    backgroundColor: "#f6f6f6",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  txt: { color: "#aaa", fontSize: 14 }
});
