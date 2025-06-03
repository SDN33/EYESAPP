import React from "react";
import { View, Text } from "react-native";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";

export default function HomeScreen() {
  const { hasConsent, acceptConsent } = useConsent();

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Bienvenue sur Moto Angles 👋</Text>
    </View>
  );
}
