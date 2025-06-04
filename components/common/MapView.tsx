// MapView.tsx : version mobile (Expo/React Native)
import React, { useEffect, useRef } from "react";
import { View, Platform, Animated } from "react-native";
import { useLocation } from "../../hooks/useLocation";
import { useHeading } from "../../hooks/useHeading";
import MapView, { Marker, PROVIDER_GOOGLE, AnimatedRegion } from 'react-native-maps';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#181B2C' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#181B2C' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A259FF' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#888' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#181A20' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function CustomMapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const compassHeading = useHeading();

  useEffect(() => {
    if (location?.coords && mapRef.current) {
      const { height } = require('react-native').Dimensions.get('window');
      const offsetPx = 200;
      const latitudeDelta = 0.01;
      const offsetLat = (offsetPx / height) * latitudeDelta;
      // Choix du heading : GPS si vitesse > 2 km/h, sinon boussole
      const speed = location?.coords?.speed || 0;
      let heading = location?.coords?.heading;
      if (!heading || speed * 3.6 < 2) heading = compassHeading ?? 0;
      const rad = (heading - 90) * Math.PI / 180;
      const dLat = Math.cos(rad) * offsetLat;
      const dLon = Math.sin(rad) * offsetLat;
      const centerLat = lat + dLat;
      const centerLon = lon + dLon;
      let zoom = 17 - (speed / 60);
      if (zoom < 15) zoom = 15;
      if (zoom > 17) zoom = 17;
      mapRef.current.animateCamera({
        center: { latitude: centerLat, longitude: centerLon },
        heading,
        pitch: 65,
        zoom,
      }, { duration: 500 });
    }
  }, [lat, lon, location?.coords?.heading, location?.coords?.speed, compassHeading]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsBuildings={false}
        toolbarEnabled={false}
        minZoomLevel={10}
        maxZoomLevel={19}
      >
        {location?.coords && (
          <Marker.Animated
            ref={markerRef}
            coordinate={{ latitude: lat, longitude: lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            {/* Marker custom bleu ou violet selon le mode, identique web/mobile */}
            <View style={{
              width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(30,30,40,0.95)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: color === '#A259FF' ? '#A259FF' : '#2979FF',
              shadowColor: color === '#A259FF' ? '#A259FF' : '#2979FF', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
              elevation: 8,
            }}>
              <View style={{
                width: 28, height: 28, transform: [{ rotate: `${location?.coords?.heading ?? 0}deg` }],
                alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Triangle bleu ou violet façon web, version RN */}
                <View style={{
                  width: 0, height: 0,
                  borderLeftWidth: 14, borderRightWidth: 14,
                  borderBottomWidth: 24, borderLeftColor: 'transparent', borderRightColor: 'transparent',
                  borderBottomColor: color === '#A259FF' ? '#A259FF' : '#2979FF',
                  borderTopWidth: 0, borderTopColor: 'transparent',
                }} />
                {/* Contour blanc */}
                <View style={{
                  position: 'absolute', top: 0, left: 0, width: 28, height: 28,
                  borderRadius: 14, borderWidth: 2.5, borderColor: '#fff',
                }} />
              </View>
            </View>
          </Marker.Animated>
        )}
      </MapView>
    </View>
  );
}
