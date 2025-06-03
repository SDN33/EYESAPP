import React, { useEffect, useRef, useState } from "react";
import {
  default as RNMapView,
  PROVIDER_GOOGLE,
  Marker,
} from "react-native-maps";
import { useLocation } from "../../hooks/useLocation";
import { Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export { PROVIDER_GOOGLE };

export default function MapView(props: any) {
  const { location } = useLocation();
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;

  // Pour animer le déplacement du marker et de la caméra
  const [region, setRegion] = useState({
    latitude: lat,
    longitude: lon,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (location?.coords) {
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

  return (
    <RNMapView
      {...props}
      provider={PROVIDER_GOOGLE}
      style={props.style}
      initialRegion={region}
      region={region}
      showsUserLocation={false}
      followsUserLocation={false}
      showsMyLocationButton={true}
      loadingEnabled={true}
    >
      <Marker
        coordinate={{ latitude: region.latitude, longitude: region.longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        flat
      >
        <AnimatedUserIcon />
      </Marker>
    </RNMapView>
  );
}

function AnimatedUserIcon() {
  // Animation de pulsation
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialCommunityIcons
        name="navigation-variant"
        size={38}
        color="#10B981"
        style={{ transform: [{ rotate: "45deg" }] }}
      />
      <MaterialCommunityIcons
        name="circle"
        size={16}
        color="#10B98155"
        style={{ position: "absolute", left: 11, top: 11 }}
      />
    </Animated.View>
  );
}
