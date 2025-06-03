import React from "react";
import { Text, Linking, StyleSheet, TouchableOpacity } from "react-native";

export default function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(href)}>
      <Text style={styles.link}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: { color: "#2176ff", textDecorationLine: "underline" }
});
