import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Easing, Platform } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient } from "react-native-svg";
import { useLocation } from "../../hooks/useLocation";
import { useLeanAngle } from "../../hooks/useLeanAngle";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";
import MapView from "./MapView";
import { Ionicons } from '@expo/vector-icons';
import { getAddressFromCoords, getSpeedLimitFromCoords } from "../../utils/roadInfo";
import { IconSymbol } from "../ui/IconSymbol";

export default function ExploreMotoScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const { location } = useLocation();
  const angle = useLeanAngle();
  const speed = location?.coords?.speed ? Math.max(0, Math.round(location.coords.speed * 3.6)) : 0;
  const [speedLimit, setSpeedLimit] = useState<number|null>(null);
  const [address, setAddress] = useState<string>("");

  // Animation compteur (aiguille)
  const animatedSpeed = useSharedValue(speed);
  useEffect(() => {
    animatedSpeed.value = withTiming(speed, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [speed]);

  useEffect(() => {
    if (location?.coords) {
      setSpeedLimit(null); // Reset à chaque changement de position
      // Adresse (ville, rue...)
      getAddressFromCoords(location.coords.latitude, location.coords.longitude)
        .then(addr => {
          const { road, city, town, village, suburb } = addr || {};
          setAddress([road, suburb, city, town, village].filter(Boolean).join(", "));
        })
        .catch(() => setAddress(""));
      // Limite de vitesse dynamique
      getSpeedLimitFromCoords(location.coords.latitude, location.coords.longitude)
        .then(limit => {
          if (limit && !isNaN(Number(limit))) setSpeedLimit(Number(limit));
          else setSpeedLimit(null);
        })
        .catch(() => setSpeedLimit(null));
    }
  }, [location?.coords]);
  const isOverLimit = speedLimit !== null && speed > speedLimit;

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      {/* Haut : Compteur moderne + indicateur angle */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGlow} />
        <View style={styles.speedAngleRow} key="moto-header-row">
          {/* Rappel du mode actuel (icône moto + label) */}
          <View style={styles.modeBox}>
            <IconSymbol name="motorcycle" size={28} color="#A259FF" style={{ marginBottom: 2 }} />
            <Text style={styles.modeLabel}>Moto</Text>
          </View>
          <View style={styles.speedoWrap}>
            <ModernSpeedometer speed={speed} speedLimit={speedLimit ?? 0} isOverLimit={isOverLimit} />
          </View>
          <View style={styles.leanBox}>
            <Ionicons name="sync-circle" size={28} color="#A259FF" style={{ marginBottom: 2 }} />
            <Text style={[styles.leanValue, { color: "#A259FF" }]}>{Math.abs(angle)}°</Text>
            <Text style={styles.leanLabel}>Angle</Text>
          </View>
        </View>
        <View style={styles.limitsRow}>
          <View style={[styles.limitBadge, isOverLimit ? styles.limitBadgeOver : {}]}>
            <Text style={[styles.limitBadgeText, isOverLimit ? styles.limitBadgeTextOver : {}, { color: "#A259FF" }]}>{speedLimit !== null ? speedLimit : "—"}</Text>
          </View>
          <Text style={styles.limitLabel}>Limite de vitesse</Text>
        </View>
        {/* Alerte radar */}
        <View style={[styles.radarAlertBox, { backgroundColor: "#A259FF" }]}> 
          <View style={styles.radarAlertIcon}><Ionicons name="alert-circle" size={20} color="#fff" /></View>
          <Text style={[styles.radarAlertText, { color: "#fff" }]}>Une Auto est à proximité</Text>
          <Text style={[styles.radarAlertDist, { color: "#fff" }]}>50 m</Text>
        </View>
      </View>
      {/* Bas : Carte GPS (50%) */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView />
      </View>
      {/* Affichage adresse actuelle en bas */}
      {address ? (
        <View style={{ padding: 12, alignItems: "center" }}>
          <Text style={{ color: "#aaa", fontSize: 14, textAlign: "center", maxWidth: "95%" }} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ModernSpeedometer({ speed, speedLimit, isOverLimit }: { speed: number, speedLimit: number, isOverLimit: boolean }) {
  const maxSpeed = 180;
  const radius = 85;
  const strokeWidth = 18; // plus épais pour effet 3D
  const circumference = 2 * Math.PI * radius;
  const speedPercentage = Math.min(speed / maxSpeed, 1);
  const arcLength = circumference * 0.75;
  const dashoffset = arcLength - (speedPercentage * arcLength);

  // Animation effet rebond
  const animated = useSharedValue(speedPercentage);
  useEffect(() => {
    animated.value = withTiming(speedPercentage, { duration: 800, easing: Easing.bounce });
  }, [speedPercentage]);

  // Dégradé SVG pour l'arc actif
  const gradientId = "speedometer-gradient";

  // Drop shadow web only
  const webFilter = Platform.OS === "web" ? { filter: `drop-shadow(0px 0px 12px ${isOverLimit ? '#EF4444' : '#A259FF'})` } : {};

  return (
    <View style={{ width: 220, height: 140, alignItems: "center", justifyContent: "center", shadowColor: isOverLimit ? "#EF4444" : "#A259FF", shadowOpacity: 0.25, shadowRadius: 16 }}>
      <Svg width={220} height={220} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={isOverLimit ? "#EF4444" : "#A259FF"} stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
          </LinearGradient>
          <RadialGradient id="glass" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0.01" />
          </RadialGradient>
        </Defs>
        {/* Fond effet verre */}
        <Circle
          cx={110}
          cy={110}
          r={radius + 8}
          fill="url(#glass)"
        />
        {/* Cercle de fond (ombre) */}
        <Path
          d="M110,25 a85,85 0 1,1 0,170"
          fill="none"
          stroke="#23242A"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Cercle de fond (gris) */}
        <Path
          d="M110,25 a85,85 0 1,1 0,170"
          fill="none"
          stroke="rgba(55,65,81,0.25)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={circumference * 0.125}
        />
        {/* Cercle de progression (effet 3D + glow) */}
        <Path
          d="M110,25 a85,85 0 1,1 0,170"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          {...webFilter}
        />
      </Svg>
      {/* Vitesse au centre */}
      <View style={[styles.speedCenter, { shadowColor: isOverLimit ? "#EF4444" : "#A259FF", shadowOpacity: 0.18, shadowRadius: 8 }]}> 
        <Text style={styles.speedText}>{speed}</Text>
        <Text style={[styles.speedUnit, { color: "#A259FF" }]}>KM/H</Text>
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
  speedAngleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 12,
    zIndex: 2
  },
  modeBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181A20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 18,
    minWidth: 54,
  },
  modeLabel: {
    color: "#A259FF",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 2,
  },
  speedoWrap: {},
  leanBox: {
    marginLeft: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181A20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#A259FF",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minWidth: 54,
  },
  leanValue: {
    color: "#A259FF",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 0,
  },
  leanLabel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: -2,
    textAlign: "center"
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
    color: "#A259FF",
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
    color: "#A259FF", fontWeight: "bold", fontSize: 16
  },
  radarAlertDist: {
    color: "#A259FF", fontSize: 18, fontWeight: "bold", marginLeft: 10
  }
});
