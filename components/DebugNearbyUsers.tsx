import React from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useNearbyUsers } from '../hooks/useNearbyUsers';

export default function DebugNearbyUsers({ radius = 5000 }: { radius?: number }) {
  const { users, loading } = useNearbyUsers(radius);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 16 }}>Debug Nearby Users</Text>
      {loading && <ActivityIndicator size="small" color="#A259FF" style={{ marginBottom: 16 }} />}
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name || 'Unknown'}</Text>
            <Text style={{ color: '#666', fontSize: 13 }}>ID: {item.id}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>Lat: {item.lat}, Lng: {item.lng}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>Mode: {item.mode || 'N/A'}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>Premium: {item.is_premium ? 'yes' : 'no'}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>Last seen: {item.last_seen_at}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={{ color: '#888', marginTop: 24 }}>No one nearby.</Text> : null}
      />
    </View>
  );
}
