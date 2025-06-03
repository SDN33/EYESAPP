import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Easing } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useLocation } from "../../hooks/useLocation";
import { useLeanAngle } from "../../hooks/useLeanAngle";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";
import MapView from "../../components/common/MapView";
import { Ionicons } from '@expo/vector-icons';

export default function ExploreMotoScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const { location } = useLocation();
  const angle = useLeanAngle();
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

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      {/* Haut : Compteur moderne + indicateur angle */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGlow} />
        <View style={styles.speedAngleRow}>
          <View style={styles.speedoWrap}>
            <ModernSpeedometer speed={speed} speedLimit={speedLimit} isOverLimit={isOverLimit} />
          </View>
          <View style={styles.leanBox}>
            <Ionicons name="sync-circle" size={28} color="#10B981" style={{ marginBottom: 2 }} />
            <Text style={styles.leanValue}>{Math.abs(angle)}°</Text>
            <Text style={styles.leanLabel}>Angle</Text>
          </View>
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
          <Text style={styles.radarAlertText}>Une Auto est à proximité</Text>
          <Text style={styles.radarAlertDist}>50 m</Text>
        </View>
      </View>
      {/* Bas : Carte GPS (50%) */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView />
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
  speedAngleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 12,
    zIndex: 2
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
    shadowColor: "#10B981",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    minWidth: 54,
  },
  leanValue: {
    color: "#10B981",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 0,
  },
  leanLabel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: -2,
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
