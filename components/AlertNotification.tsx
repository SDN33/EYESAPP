import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert } from '../hooks/useActiveAlerts';

export function AlertNotification({ alert, onConfirm, onDismiss }: {
  alert: Alert,
  onConfirm: () => void,
  onDismiss: () => void,
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Alerte signalée à proximité !</Text>
      <Text style={styles.type}>{alert.type}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FFB300' }]}
          onPress={() => { setConfirming(true); onConfirm(); }}
          disabled={confirming}
        >
          <Text style={styles.buttonText}>Toujours en place</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#bbb' }]}
          onPress={onDismiss}
        >
          <Text style={styles.buttonText}>Alerte disparue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    zIndex: 300,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#C2410C',
  },
  type: {
    fontSize: 15,
    marginBottom: 12,
    color: '#222',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
