import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PremiumFeatureCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Alerte Prioritaire</Text>
      <Text style={styles.desc}>
        Recevez des notifications instantanées lorsque des motos s'approchent de votre angle mort. Fonctionnalité réservée aux abonnés Premium (bientôt disponible).
      </Text>
      <View style={styles.badge}>
        <Text style={{ color: "white" }}>Premium</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f6f6fc",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 2
  },
  title: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  desc: { textAlign: "center", color: "#444", marginBottom: 16 },
  badge: { backgroundColor: "#7654f6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }
});
