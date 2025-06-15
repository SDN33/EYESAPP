import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

const MuteButton: React.FC<MuteButtonProps> = ({ muted, onToggle }) => {
  return (
    <View style={styles.container}>
    <TouchableOpacity
      onPress={onToggle}
      style={styles.button}
      accessibilityLabel={muted ? 'Activer le son' : 'Couper le son'}
    >
      <Ionicons
        name={muted ? 'volume-mute' : 'volume-high'}
        size={16}
        color={'#222'} // même couleur que les icônes de zoom
      />
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.7)', // même fond que les boutons de zoom
    borderRadius: 16, // même arrondi
    padding: 6, // même padding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 3,
    zIndex: 30,
    opacity: 1,
    marginLeft: 0,
    marginRight: 0,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
});

export default MuteButton;
