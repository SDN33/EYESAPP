import React from "react";
import { Modal, View, Text, StyleSheet, Button } from "react-native";

type AlertPopupProps = {
  visible: boolean;
  message: string;
  onClose: () => void;
};

export default function AlertPopup({ visible, message, onClose }: AlertPopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.txt}>{message}</Text>
          <Button title="Fermer" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0008" },
  content: { backgroundColor: "white", borderRadius: 12, padding: 24, alignItems: "center" },
  txt: { marginBottom: 18, fontSize: 16, textAlign: "center" }
});
