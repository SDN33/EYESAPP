import React from "react";
import { ScrollView, View, Image, Text, StyleSheet } from "react-native";

export default function ParallaxScrollView({ children, image }: { children: React.ReactNode; image: any }) {
  return (
    <ScrollView>
      <Image source={image} style={styles.img} />
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  img: { width: "100%", height: 200, resizeMode: "cover" },
  content: { padding: 20 }
});
