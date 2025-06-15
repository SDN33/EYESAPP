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
      <TouchableOpacity onPress={onToggle} style={styles.button} accessibilityLabel={muted ? 'Activer le son' : 'Couper le son'}>
        <Ionicons
          name={muted ? 'volume-mute' : 'volume-high'}
          size={28}
          color={muted ? '#888' : '#007AFF'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 18,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MuteButton;
