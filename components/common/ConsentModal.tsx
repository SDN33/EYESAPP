import React from "react";
import { Modal, View, Text, Button } from "react-native";

type ConsentModalProps = {
  visible: boolean;
  onAccept: () => void;
};

export default function ConsentModal({ visible, onAccept }: ConsentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex:1, justifyContent: "center", alignItems: "center", backgroundColor: "#0008" }}>
        <View style={{ backgroundColor: "white", borderRadius: 12, padding: 24, width: 300, alignItems: "center" }}>
          <Text style={{ fontWeight: "bold", marginBottom: 12 }}>
            Consentement RGPD
          </Text>
          <Text style={{ marginBottom: 20, textAlign: "center" }}>
            Pour utiliser l’app, nous avons besoin de votre accord pour collecter les données d’usage et de géolocalisation. (Aucune donnée n'est vendue.)
          </Text>
          <Button title="J'accepte" onPress={onAccept} />
        </View>
      </View>
    </Modal>
  );
}
