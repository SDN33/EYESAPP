import React from "react";
import { View, Text } from "react-native";
import { useLocation } from "../../hooks/useLocation";

export default function ExploreScreen() {
  const { location, error } = useLocation();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Détection Moto</Text>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {location && (
        <Text>
          Latitude: {location.coords.latitude}{"\n"}
          Longitude: {location.coords.longitude}
        </Text>
      )}
    </View>
  );
}

