import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Easing, Platform, Dimensions } from "react-native";
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
import ExploreVoitureScreen, { ModernSpeedometer } from "./ExploreVoitureScreen";

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

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenWidth < 370 || screenHeight < 700;

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      {/* Haut : Compteur moderne + indicateur angle */}
      <View style={[styles.headerContainer, { flex: 1.25 }, isSmallScreen && { minHeight: 180, paddingTop: 8, paddingBottom: 8 }]}> 
        <View style={styles.headerGlow} />
        <View style={[styles.speedAngleRow, isSmallScreen && { marginTop: 12, marginBottom: 4 }] } key="moto-header-row">
          {/* Rappel du mode actuel (icône moto + label) */}
          <View style={[styles.modeBox, isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40, marginRight: 8 }] }>
            <IconSymbol name="motorcycle" size={isSmallScreen ? 20 : 28} color="#A259FF" style={{ marginBottom: 2 }} />
            <Text style={[styles.modeLabel, isSmallScreen && { fontSize: 12, marginTop: 0 }]}>Moto</Text>
          </View>
          <View style={styles.speedoWrap}>
            {/* Utilise le compteur voiture mais en violet */}
            <ModernSpeedometer speed={speed} speedLimit={speedLimit ?? 0} isOverLimit={isOverLimit} color="#A259FF" />
          </View>
          <View style={[styles.leanBox, isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40, marginLeft: 8 }] }>
            <Ionicons name="sync-circle" size={isSmallScreen ? 20 : 28} color="#A259FF" style={{ marginBottom: 2 }} />
            <Text style={[styles.leanValue, { color: "#A259FF" }, isSmallScreen && { fontSize: 13 }] }>{Math.abs(angle)}°</Text>
            <Text style={[styles.leanLabel, isSmallScreen && { fontSize: 10, marginTop: -2 }]}>Inclinaison</Text>
          </View>
        </View>
        <View style={[styles.limitsRow, isSmallScreen && { marginBottom: 2, gap: 6 }] }>
          <View style={[styles.limitBadge, isOverLimit ? styles.limitBadgeOver : {}, isSmallScreen && { width: 32, height: 32, borderRadius: 16, borderWidth: 2 }] }>
            <Text style={[styles.limitBadgeText, isOverLimit ? styles.limitBadgeTextOver : {}, { color: "#A259FF" }, isSmallScreen && { fontSize: 12 }] }>{speedLimit !== null ? speedLimit : "—"}</Text>
          </View>
          <Text style={[styles.limitLabel, isSmallScreen && { fontSize: 11 }]}>Limite de vitesse</Text>
        </View>
        {/* Alerte radar */}
        <View style={[styles.radarAlertBox, { backgroundColor: "#A259FF" }, isSmallScreen && { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, marginTop: 4 }]}> 
          <View style={[styles.radarAlertIcon, isSmallScreen && { padding: 3, marginRight: 3 }]}><Ionicons name="alert-circle" size={isSmallScreen ? 13 : 20} color="#fff" /></View>
          <Text style={[styles.radarAlertText, { color: "#fff" }, isSmallScreen && { fontSize: 11 }]}>Une Auto est à proximité</Text>
          <Text style={[styles.radarAlertDist, { color: "#fff" }, isSmallScreen && { fontSize: 12, marginLeft: 4 }]}>50 m</Text>
        </View>
      </View>
      {/* Bas : Carte GPS (50%) */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView color="#A259FF" />
        {/* Bouton recentrer en haut à droite, décalé à gauche, et fonctionnel (envoie un event custom) */}
        <View style={{ position: 'absolute', top: 18, right: 64, zIndex: 20 }}>
          <View style={{ backgroundColor: '#23242A', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6 }}>
            <Ionicons name="locate" size={28} color="#A259FF" onPress={() => {window.dispatchEvent(new CustomEvent('recenter-map'));}} />
          </View>
        </View>
      </View>
      {/* Affichage adresse actuelle en bas, en overlay absolu pour ne pas crop la map */}
      {address ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, alignItems: "center", backgroundColor: "#181A20EE", zIndex: 20 }}>
          <Text style={{ color: "#aaa", fontSize: 14, textAlign: "center", maxWidth: "95%" }} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1.5,
    backgroundColor: "#181A20",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 8,
      }
    }),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
  },
  headerGlow: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#A259FF10",
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
    ...Platform.select({
      web: {
        boxShadow: "0 2px 12px 0 #A259FF1F",
      },
      default: {
        shadowColor: "#A259FF",
        shadowOpacity: 0.12,
        shadowRadius: 6,
      }
    }),
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
    backgroundColor: "#A259FF",
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 16px 0 #A259FF33",
      },
      default: {
        shadowColor: "#A259FF",
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }
    })
  },
  radarAlertIcon: {
    backgroundColor: "#A259FF",
    borderRadius: 999,
    padding: 10,
    marginRight: 10
  },
  radarAlertText: {
    color: "#fff", fontWeight: "bold", fontSize: 18
  },
  radarAlertDist: {
    color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 14
  },
  weatherBox: {
    marginLeft: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181A20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 12px 0 #A259FF1F",
      },
      default: {
        shadowColor: "#A259FF",
        shadowOpacity: 0.12,
        shadowRadius: 6,
      }
    }),
    minWidth: 54,
  },
  weatherValue: {
    color: "#A259FF",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 0,
  },
  weatherLabel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: -2,
    textAlign: "center"
  }
});
