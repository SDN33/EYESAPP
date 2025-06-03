import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  title: { color: "white", fontSize: 22, fontWeight: "bold" }
});
