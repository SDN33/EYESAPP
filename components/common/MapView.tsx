// MapView.tsx : version mobile (Expo/React Native)
import React, { useEffect, useRef, useState } from "react";
import MapboxGL from "@rnmapbox/maps";
import { View, Platform, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocation } from "../../hooks/useLocation";
import { Ionicons } from "@expo/vector-icons";

MapboxGL.setAccessToken(""); // Pas besoin de token pour les styles libres OSM/MapTiler

const OSM_STYLE = "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"; // Style sombre, minimaliste, open source

export default function MapView() {
  const { location } = useLocation();
  const mapRef = useRef(null);
  const [centered, setCentered] = useState(true);
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;

  // Toujours afficher le marker, même si la carte n'est pas centrée
  useEffect(() => {
    if (centered && mapRef.current && location?.coords) {
      (mapRef.current as any).setCamera({ centerCoordinate: [lon, lat], zoomLevel: 16, animationDuration: 800 });
    }
  }, [lat, lon, centered]);

  // Bouton recentrer
  const handleRecenter = () => {
    setCentered(true);
    if (mapRef.current && location?.coords) {
      (mapRef.current as any).setCamera({ centerCoordinate: [lon, lat], zoomLevel: 16, animationDuration: 800 });
    }
  };

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
        {/* Marker toujours visible */}
        {location?.coords && (
          <MapboxGL.PointAnnotation id="me" coordinate={[lon, lat]}>
            <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="navigate" size={28} color="#A259FF" style={{ transform: [{ rotate: `${location?.coords?.heading ?? 0}deg` }] }} />
              <View style={{ position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff', opacity: 0.7 }} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
      {/* Bouton recentrer */}
      <View style={{ position: 'absolute', bottom: 24, right: 18, zIndex: 10 }}>
        <View style={{ backgroundColor: '#23242A', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6 }}>
          <Ionicons name="locate" size={28} color="#A259FF" onPress={handleRecenter} />
        </View>
      </View>
    </View>
  );
}
