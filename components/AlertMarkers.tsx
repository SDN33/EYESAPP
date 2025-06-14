import React from 'react';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from '../hooks/useActiveAlerts';

export function AlertMarkers({ alerts }: { alerts: Alert[] }) {
  return (
    <>
      {alerts.map(alert => (
        <Marker
          key={alert.id}
          coordinate={{ latitude: alert.latitude, longitude: alert.longitude }}
          title={alert.type || 'Alerte'}
          description={new Date(alert.created_at).toLocaleTimeString()}
        >
          <Ionicons name="warning" size={28} color="#FFB300" />
        </Marker>
      ))}
    </>
  );
}
