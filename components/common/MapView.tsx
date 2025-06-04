// MapView.tsx : version mobile (Expo/React Native)
import React, { useEffect, useRef, useState } from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, Platform, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocation } from "../../hooks/useLocation";
import { Ionicons } from "@expo/vector-icons";

MapboxGL.setAccessToken(""); // Pas besoin de token pour les styles libres OSM/MapTiler

// Style OSM dark compatible mobile/web, sans sprite, public
const OSM_STYLE = "https://demotiles.maplibre.org/style.json";

export default function MapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const mapRef = useRef(null);
  const [centered, setCentered] = useState(true);
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;

  // Toujours afficher le marker, même si la carte n'est pas centrée
  // (le marker dépend uniquement de location?.coords)
  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        styleURL={OSM_STYLE}
        logoEnabled={false}
        compassEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        zoomEnabled={true}
        attributionEnabled={false}
        onRegionWillChange={() => setCentered(false)}
      >
        <MapboxGL.Camera
          centerCoordinate={centered ? [lon, lat] : undefined}
          zoomLevel={16}
          animationMode="flyTo"
          animationDuration={800}
        />
        {/* Marker toujours visible, couleur dynamique */}
        {location?.coords && (
          <MapboxGL.PointAnnotation id="me" coordinate={[lon, lat]}>
            <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="navigate" size={28} color={color} style={{ transform: [{ rotate: `${location?.coords?.heading ?? 0}deg` }] }} />
              <View style={{ position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff', opacity: 0.7 }} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
}
