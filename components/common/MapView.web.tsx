import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";

export default function MapView() {
  const [coords, setCoords] = useState<{ lat: number; lon: number; heading?: number } | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
          });
        },
        () => setCoords(null),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId.current !== null && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // Fallback Paris si pas de géoloc
  const lat = coords?.lat ?? 48.8584;
  const lon = coords?.lon ?? 2.2945;
  const delta = 0.01;
  const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
  // Marqueur standard OSM (curseur rouge d'origine)
  const marker = `&marker=${lat}%2C${lon}`;

  return (
    <View style={styles.container}>
      <iframe
        title="Carte OpenStreetMap"
        key={lat + "," + lon}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`}
        style={{
          border: 0,
          width: "100%",
          height: "100%",
          minHeight: 300,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          overflow: "hidden",
        }}
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#23242A",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
});
