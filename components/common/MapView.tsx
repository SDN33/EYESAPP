// MapView.tsx : version mobile (Expo/React Native)
import React, { useEffect, useRef, useState } from "react";
import { View, Platform, Animated, TouchableOpacity } from "react-native";
import { useLocation } from "../../hooks/useLocation";
import { useHeading } from "../../hooks/useHeading";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Polygon } from 'react-native-svg';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#181A20' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#181A20' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#888' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  // ROUTES plus visibles (gris clair ou bleu)
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3A3D4D' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#5A5D6D' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#bbb' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#181A20' }] },
  { featureType: 'water', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
];

export default function CustomMapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const lat = location?.coords?.latitude;
  const lon = location?.coords?.longitude;
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const compassHeading = useHeading();
  const [isFollowing, setIsFollowing] = useState(true);

  // Recentrage immersif 1s après le chargement initial de la carte
  useEffect(() => {
    if (mapRef.current && lat && lon) {
      const timeout = setTimeout(() => {
        mapRef.current?.animateCamera({
          center: { latitude: lat, longitude: lon },
          zoom: 17,
          pitch: 65,
          heading: location?.coords?.heading || 0,
        }, { duration: 500 });
        setIsFollowing(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [lat, lon]);

  // Recentrage immédiat si la position devient disponible après le premier rendu
  useEffect(() => {
    if (mapRef.current && lat && lon) {
      mapRef.current.animateCamera({
        center: { latitude: lat, longitude: lon },
        zoom: 17,
        pitch: 65,
        heading: location?.coords?.heading || 0,
      }, { duration: 500 });
      setIsFollowing(true);
    }
  }, [lat, lon]);

  useEffect(() => {
    if (location?.coords && mapRef.current) {
      const { height } = require('react-native').Dimensions.get('window');
      const offsetPx = 200;
      const latitudeDelta = 0.01;
      const offsetLat = (offsetPx / height) * latitudeDelta;
      // Choix du heading : GPS si vitesse > 2 km/h, sinon boussole
      const speed = location?.coords?.speed || 0;
      let heading = location?.coords?.heading;
      if (!heading || speed * 3.6 < 2) heading = compassHeading ?? heading ?? 0;
      const rad = (heading - 90) * Math.PI / 180;
      const dLat = Math.cos(rad) * offsetLat;
      const dLon = Math.sin(rad) * offsetLat;
      const centerLat = lat ? lat + dLat : 48.8584;
      const centerLon = lon ? lon + dLon : 2.2945;
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
        style={{ flex: 1, borderRadius: 0, overflow: 'hidden' }}
        initialRegion={{
          latitude: lat || 48.8584,
          longitude: lon || 2.2945,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={true}
        followsUserLocation={isFollowing}
        showsMyLocationButton={false}
        showsCompass={true}
        showsBuildings={false}
        toolbarEnabled={true}
        minZoomLevel={6}
        maxZoomLevel={19}
        onPanDrag={() => setIsFollowing(false)}
        mapPadding={{ top: 0, right: 0, bottom: 80, left: 0 }} // padding bas raisonnable pour cacher le logo
      >
        {lat && lon && (
          <Marker.Animated
        coordinate={{ latitude: lat, longitude: lon }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
          >
        <View style={{
          width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(30,30,40,0.95)', borderRadius: 18,
          borderWidth: 2, borderColor: color,
          shadowColor: color, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
          elevation: 8,
        }}>
          <View style={{
            width: 28, height: 28, transform: [{ rotate: `${location?.coords?.heading ?? 0}deg` }],
            alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Triangle qui pointe vers la direction du téléphone */}
            <View style={{
          width: 0, height: 0,
          borderLeftWidth: 14, borderRightWidth: 14,
          borderBottomWidth: 24, borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: color,
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
      {/* Bouton unique de recentrage, toujours visible en haut à droite */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 7, // encore plus haut
          right: 24,
          backgroundColor: isFollowing ? color : '#23242A', // couleur dynamique selon le mode
          borderRadius: 24,
          padding: 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 6,
          zIndex: 100
        }}
        onPress={() => {
          setIsFollowing(true);
          if (mapRef.current && lat && lon) {
            mapRef.current.animateCamera({
              center: { latitude: lat, longitude: lon },
              zoom: 17,
              pitch: 65
            }, { duration: 500 });
          }
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Icône 3D dédiée pour la vue immersive */}
          <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Polygon points="12,2 22,7 12,12 2,7" fill={isFollowing ? color : '#888'} />
              <Polygon points="12,12 22,7 22,17 12,22" fill={isFollowing ? (color === '#A259FF' ? '#7C3AED' : '#3B82F6') : '#444'} />
              <Polygon points="12,12 2,7 2,17 12,22" fill={isFollowing ? (color === '#A259FF' ? '#6D28D9' : '#2563EB') : '#222'} />
            </Svg>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
