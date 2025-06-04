import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";

interface ModeSelectionModalProps {
  visible: boolean;
  onSelectMode: (mode: "motard" | "voiture") => void;
}

const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({ visible, onSelectMode }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Choisissez votre mode</Text>
          <TouchableOpacity style={styles.button} onPress={() => onSelectMode("motard")}> 
            <Text style={styles.buttonText}>Motard 🏍️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => onSelectMode("voiture")}> 
            <Text style={styles.buttonText}>Voiture 🚗</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,10,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#181A20",
    borderRadius: 18,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 28,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: "#23242A",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginVertical: 8,
    width: 200,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2F36",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default ModeSelectionModal;
