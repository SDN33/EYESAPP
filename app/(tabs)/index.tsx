import React, { useState, useEffect } from "react";
import { View, Text, Platform, Easing, Alert, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedProps, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useLocation } from "../../hooks/useLocation";
import { useRef } from "react";
import ConsentModal from "../../components/common/ConsentModal";
import ModeSelectionModal from "../../components/common/ModeSelectionModal";
import { useConsent } from "../../hooks/useConsent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { PROVIDER_GOOGLE } from "../../components/common/MapView";
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const [mode, setMode] = useState<string | null>(null);
  const [modeModalVisible, setModeModalVisible] = useState(true); // Toujours true au départ

  // Affiche le modal à chaque lancement (pas de AsyncStorage)
  const handleSelectMode = (selectedMode: "motard" | "voiture") => {
    setMode(selectedMode);
    setModeModalVisible(false);
    setTimeout(() => setModeModalVisible(true), 1000 * 60 * 60 * 24); // Réaffiche après 24h si besoin (ou à chaque reload)
  };

  const { location } = useLocation();
  const speed = location?.coords?.speed ? Math.max(0, Math.round(location.coords.speed * 3.6)) : 0;
  const [speedLimit, setSpeedLimit] = useState(80);
  const isOverLimit = speed > speedLimit;

  // Animation compteur (aiguille)
  const animatedSpeed = useSharedValue(speed);
  useEffect(() => {
    animatedSpeed.value = withTiming(speed, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [speed]);

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  // Affiche toujours le modal au démarrage
  if (modeModalVisible) {
    return <ModeSelectionModal visible={modeModalVisible} onSelectMode={handleSelectMode} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      {/* Haut : Compteur moderne et infos */}
      <View style={styles.headerContainer}>
        {/* Effet lumineux */}
        <View style={styles.headerGlow} />
        <View style={styles.speedoWrap}>
          <ModernSpeedometer speed={speed} speedLimit={speedLimit} isOverLimit={isOverLimit} />
        </View>
        <View style={styles.limitsRow}>
          <View style={[styles.limitBadge, isOverLimit ? styles.limitBadgeOver : {}]}>
            <Text style={[styles.limitBadgeText, isOverLimit ? styles.limitBadgeTextOver : {}]}>{speedLimit}</Text>
          </View>
          <Text style={styles.limitLabel}>Limite de vitesse</Text>
        </View>
        {/* Alerte radar */}
        <View style={styles.radarAlertBox}>
          <View style={styles.radarAlertIcon}><Ionicons name="alert-circle" size={20} color="#fff" /></View>
          <Text style={styles.radarAlertText}>Une Moto est à proximité</Text>
          <Text style={styles.radarAlertDist}>50 m</Text>
        </View>
      </View>
      {/* Bas : Carte GPS (50%) ou placeholder web */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 48.8584,
            longitude: 2.2945,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          customMapStyle={appleDarkMapStyle}
        />
      </View>
    </View>
  );
}

function ModernSpeedometer({ speed, speedLimit, isOverLimit }: { speed: number, speedLimit: number, isOverLimit: boolean }) {
  const maxSpeed = 180;
  const radius = 85;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const speedPercentage = Math.min(speed / maxSpeed, 1);
  const arcLength = circumference * 0.75;
  const dashoffset = arcLength - (speedPercentage * arcLength);

  return (
    <View style={{ width: 200, height: 120, alignItems: "center", justifyContent: "center" }}>
      <Svg width={200} height={200} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Cercle de fond */}
        <Path
          d="M100,15 a85,85 0 1,1 0,170"
          fill="none"
          stroke="rgba(55,65,81,0.3)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference * 0.125}
        />
        {/* Cercle de progression */}
        <Path
          d="M100,15 a85,85 0 1,1 0,170"
          fill="none"
          stroke={isOverLimit ? "#EF4444" : "#10B981"}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Vitesse au centre */}
      <View style={styles.speedCenter}>
        <Text style={styles.speedText}>{speed}</Text>
        <Text style={styles.speedUnit}>KM/H</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    backgroundColor: "#181A20",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
  },
  headerGlow: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#10B98110",
    zIndex: 0
  },
  speedoWrap: {
    marginTop: 32,
    marginBottom: 12,
    zIndex: 2
  },
  speedCenter: {
    position: "absolute",
    top: 38,
    left: 0, right: 0,
    alignItems: "center"
  },
  speedText: {
    fontSize: 54,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: -2,
    marginBottom: 2
  },
  speedUnit: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "600"
  },
  limitsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8
  },
  limitBadge: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 3, borderColor: "#fff",
    backgroundColor: "#23242A",
    alignItems: "center", justifyContent: "center"
  },
  limitBadgeOver: {
    borderColor: "#EF4444",
    backgroundColor: "#EF444420"
  },
  limitBadgeText: {
    color: "#fff", fontWeight: "bold", fontSize: 18
  },
  limitBadgeTextOver: {
    color: "#EF4444"
  },
  limitLabel: {
    color: "#aaa", fontSize: 16
  },
  radarAlertBox: {
    backgroundColor: "#F87171",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  radarAlertIcon: {
    backgroundColor: "#F59E42",
    borderRadius: 999,
    padding: 6,
    marginRight: 6
  },
  radarAlertText: {
    color: "#fff", fontWeight: "bold", fontSize: 16
  },
  radarAlertDist: {
    color: "#fff", fontSize: 18, fontWeight: "bold", marginLeft: 10
  }
});

// Style sombre inspiré Apple pour la carte
const appleDarkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8e8e93" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#23242a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#181a20" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#23242a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#23242a" }] },
];

// Compteur circulaire moderne
function Speedometer({ speed, animatedSpeed }: { speed: number; animatedSpeed: any }) {
  const circumference = 180;
  const radius = 60;
  const strokeWidth = 14;
  const maxSpeed = 180;
  const percent = Math.min(speed / maxSpeed, 1);
  const dashoffset = circumference * (1 - percent);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.min(animatedSpeed.value / maxSpeed, 1)),
  }));

  return (
    <View style={{ alignItems: "center", justifyContent: "center", marginTop: 18 }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 48, fontWeight: "bold", letterSpacing: 1 }}>{speed}</Text>
        <Text style={{ color: "#6EE7B7", fontSize: 18, fontWeight: "600" }}>km/h</Text>
      </View>
      <Svg width={radius * 2 + strokeWidth} height={radius + strokeWidth} style={{ zIndex: -1 }}>
        <Path
          d={`M${strokeWidth / 2},${radius + strokeWidth / 2} A${radius},${radius} 0 0 1 ${radius * 2 + strokeWidth / 2},${radius + strokeWidth / 2}`}
          fill="none"
          stroke="#23242A"
          strokeWidth={strokeWidth}
        />
        <AnimatedPath
          d={`M${strokeWidth / 2},${radius + strokeWidth / 2} A${radius},${radius} 0 0 1 ${radius * 2 + strokeWidth / 2},${radius + strokeWidth / 2}`}
          fill="none"
          stroke="#6EE7B7"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
const AnimatedPath = Animated.createAnimatedComponent(Path);
