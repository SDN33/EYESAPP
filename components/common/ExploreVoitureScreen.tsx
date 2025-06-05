import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, Modal } from "react-native";
import Animated, { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient } from "react-native-svg";
import { useLocation } from "../../hooks/useLocation";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";
import MapView from "./MapView";
import { Ionicons } from '@expo/vector-icons';
import { getAddressFromCoords, getSpeedLimitFromCoords } from "../../utils/roadInfo";
import { getWeatherFromCoords } from "../../services/api";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLeanAngle } from "../../hooks/useLeanAngle";
import { Platform } from "react-native";

// Clé Google API pour le trafic (web ou mobile)
const GOOGLE_API_KEY = Platform.OS === "web"
  ? "AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0"
  : (process.env.GOOGLE_API_KEY || "");

export default function ExploreVoitureScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const { location } = useLocation();
  const angle = useLeanAngle();
  const speed = location?.coords?.speed ? Math.max(0, Math.round(location.coords.speed * 3.6)) : 0;
  const [speedLimit, setSpeedLimit] = useState<number|null>(null);
  const [address, setAddress] = useState<string>("");
  const [weather, setWeather] = useState<{ temperature: number, icon: string, description: string } | null>(null);
  // Mock d'alertes communautaires (à remplacer par backend plus tard)
  const [alerts, setAlerts] = useState([]); // plus d'alertes sur la carte
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [trafficAlert, setTrafficAlert] = useState<string | null>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenWidth < 370 || screenHeight < 700;

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
      // Météo locale
      getWeatherFromCoords(location.coords.latitude, location.coords.longitude)
        .then(setWeather)
        .catch(() => setWeather(null));
    }
  }, [location?.coords]);
  // Calcul sécurisé du dépassement de la limite
  const isOverLimit = typeof speedLimit === 'number' && !isNaN(speedLimit) && speed > speedLimit;

  // Animation compteur (aiguille)
  const animatedSpeed = useSharedValue(speed);
  useEffect(() => {
    animatedSpeed.value = withTiming(speed, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [speed]);

  // Pour recentrer la carte depuis le bouton custom
  const mapViewRef = React.useRef<any>(null);
  const handleRecenter = () => {
    if (mapViewRef.current && mapViewRef.current.recenter) {
      mapViewRef.current.recenter();
    }
  };

  // TODO: Replace these with real detection logic or props
  const leftDetected = true; // Forcé pour la démo
  const rightDetected = false;

  // Ajout d'une alerte (mock, à remplacer par API)
  const handleAddAlert = (type: string) => {
    // Désactivé : on ne stocke plus les alertes
    setShowAlertModal(false);
  };

  // Affichage d'une notification si une alerte communautaire (danger/bouchon) est proche (< 300m)
  const nearbyAlert = undefined; // plus de notif communautaire

  // Détection trafic en temps réel (web uniquement, mock sur mobile)
  useEffect(() => {
    if (!location?.coords) return;
    let interval: any;
    async function checkTraffic() {
      if (!location?.coords) return;
      try {
        const { latitude, longitude } = location.coords;
        // On simule un trajet de 1km vers le nord
        const destLat = latitude + 0.009;
        const destLon = longitude;
        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${destLat},${destLon}&departure_time=now&key=${GOOGLE_API_KEY}`;
        if (typeof window !== 'undefined') {
          url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0] && data.routes[0].legs && data.routes[0].legs[0]) {
          const leg = data.routes[0].legs[0];
          const duration = leg.duration.value; // en secondes
          const durationInTraffic = leg.duration_in_traffic?.value || duration;
          // Si le temps en trafic est 50% plus long que le temps normal, on notifie
          if (durationInTraffic > duration * 1.5) {
            setTrafficAlert("Trafic dense détecté à proximité");
          } else {
            setTrafficAlert(null);
          }
        }
      } catch {
        setTrafficAlert(null);
      }
    }
    checkTraffic();
    interval = setInterval(checkTraffic, 30000); // toutes les 30s
    return () => clearInterval(interval);
  }, [location?.coords]);

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#111216" }}>
      {/* Haut : Compteur moderne + indicateur météo (même layout que moto) */}
      <View style={[styles.headerContainer, { flex: 1.25 }, isSmallScreen && { minHeight: 180, paddingTop: 8, paddingBottom: 8 }]}> 
        <View style={styles.headerGlow} />
        <View style={[styles.speedCarRow, isSmallScreen && { marginTop: 12, marginBottom: 4 }] } key="auto-header-row">
          {/* Rappel du mode actuel (icône voiture + label) */}
          <View style={[styles.modeBox, isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40, marginRight: 8 }] }>
            <Ionicons name="car-sport" size={isSmallScreen ? 20 : 28} color="#60A5FA" style={{ marginBottom: 2 }} />
            <Text style={[styles.modeLabel, isSmallScreen && { fontSize: 12, marginTop: 0 }]}>Auto</Text>
          </View>
          <View style={styles.speedoWrap}>
            {/* Suppression AngleMortUI */}
            <ModernSpeedometer speed={speed} speedLimit={speedLimit ?? 0} isOverLimit={isOverLimit} color="#60A5FA" />
          </View>
          <View style={[styles.weatherBox, isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40, marginLeft: 8 }] }>
            {weather ? (
              <>
                <MaterialIcons name={weather.icon as any} size={isSmallScreen ? 20 : 28} color="#60A5FA" style={{ marginBottom: 2 }} />
                <Text style={[styles.weatherValue, isSmallScreen && { fontSize: 13 }]}>{Math.round(weather.temperature)}°C</Text>
              </>
            ) : (
              <Text style={[styles.weatherLabel, isSmallScreen && { fontSize: 10, marginTop: -2 }]}>Météo…</Text>
            )}
          </View>
        </View>
        <View style={[styles.limitsRow, isSmallScreen && { marginBottom: 2, gap: 6 }] }>
          <View style={[
            styles.limitBadge,
            isOverLimit ? styles.limitBadgeOver : {},
            isSmallScreen && { width: 32, height: 32, borderRadius: 16, borderWidth: 2 }
          ]}>
            <Text style={[
              styles.limitBadgeText,
              isOverLimit ? styles.limitBadgeTextOver : {},
              { color: isOverLimit ? '#EF4444' : '#60A5FA' },
              isSmallScreen && { fontSize: 12 }
            ]}>
              {typeof speedLimit === 'number' && !isNaN(speedLimit) ? speedLimit : '—'}
            </Text>
          </View>
          <Text style={[styles.limitLabel, isSmallScreen && { fontSize: 11 }]}>Limite de vitesse</Text>
        </View>
        {/* Alerte radar moderne et dynamique (véhicule à proximité uniquement) */}
        {(leftDetected || rightDetected) ? (
          <View style={{
            marginTop: isSmallScreen ? 6 : 16,
            alignSelf: 'center',
            backgroundColor: '#23242A',
            borderRadius: 18,
            paddingHorizontal: isSmallScreen ? 18 : 32,
            paddingVertical: isSmallScreen ? 8 : 14,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: leftDetected || rightDetected ? '#60A5FA' : '#23242A',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            borderWidth: 1.5,
            borderColor: leftDetected ? '#EF4444' : rightDetected ? '#EF4444' : '#60A5FA',
            gap: isSmallScreen ? 8 : 16,
            minWidth: isSmallScreen ? 180 : 240,
            justifyContent: 'center',
            elevation: 2,
            opacity: 0.97
          }}>
            <Ionicons name={leftDetected ? 'bicycle' : 'car-sport'} size={isSmallScreen ? 20 : 28} color={leftDetected ? '#EF4444' : '#60A5FA'} style={{ marginRight: 8 }} />
            <Text style={{
              color: leftDetected ? '#EF4444' : '#60A5FA',
              fontWeight: 'bold',
              fontSize: isSmallScreen ? 14 : 18,
              marginRight: 8,
              letterSpacing: 0.5
            }}>
              {leftDetected ? 'Moto à proximité' : 'Auto à proximité'}
            </Text>
            <View style={{
              backgroundColor: leftDetected ? '#EF4444' : '#60A5FA',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginLeft: 4
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: isSmallScreen ? 12 : 14 }}>50 m</Text>
            </View>
            <Animated.View style={{
              marginLeft: 8,
              width: isSmallScreen ? 10 : 16,
              height: isSmallScreen ? 10 : 16,
              borderRadius: 99,
              backgroundColor: leftDetected ? '#EF4444' : '#60A5FA',
              opacity: 0.7,
              transform: [{ scale: leftDetected || rightDetected ? 1.2 : 1 }],
              shadowColor: leftDetected ? '#EF4444' : '#60A5FA',
              shadowOpacity: 0.5,
              shadowRadius: 8
            }} />
          </View>
        ) : null}
      </View>
      {/* Bas : Carte GPS (50%) */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView
          key={recenterKey}
          color="#2979FF"
          // Thème sombre ajusté : routes plus claires pour meilleure visibilité
        />
        {/* Bouton flottant signalement, discret en haut à gauche (descendu pour éviter le chevauchement avec la notif trafic) */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 58, left: 18, backgroundColor: '#23242A', borderRadius: 18, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, zIndex: 30, opacity: 0.85 }}
          onPress={() => setShowAlertModal(true)}
        >
          <Ionicons name="alert" size={20} color="#60A5FA" />
        </TouchableOpacity>
        {/* Modal choix type d'alerte */}
        <Modal visible={showAlertModal} transparent animationType="fade">
          <View style={{ flex:1, backgroundColor:'#0008', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor:'#181A20', borderRadius:18, padding:24, minWidth:220 }}>
              <Text style={{ color:'#fff', fontWeight:'bold', fontSize:18, marginBottom:12 }}>Signaler…</Text>
              {/* On retire le signalement radar */}
              <TouchableOpacity onPress={() => handleAddAlert('danger')} style={{ flexDirection:'row', alignItems:'center', marginBottom:14 }}>
                <Ionicons name="warning" size={22} color="#F59E42" style={{ marginRight:8 }} />
                <Text style={{ color:'#fff', fontSize:16 }}>Danger</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleAddAlert('bouchon')} style={{ flexDirection:'row', alignItems:'center', marginBottom:6 }}>
                <Ionicons name="car" size={22} color="#A259FF" style={{ marginRight:8 }} />
                <Text style={{ color:'#fff', fontSize:16 }}>Bouchon</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAlertModal(false)} style={{ marginTop:10, alignSelf:'flex-end' }}>
                <Text style={{ color:'#aaa', fontSize:15 }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Liste des alertes à proximité (danger/bouchon uniquement) */}
        {/* <View style={{ position:'absolute', left:0, right:0, bottom:90, alignItems:'center', zIndex:25 }}>
          <FlatList
            data={alerts.filter(a => a.type !== 'radar')}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <View style={{ backgroundColor:'#23242A', borderRadius:12, padding:10, marginHorizontal:6, flexDirection:'row', alignItems:'center', minWidth:90 }}>
                <Ionicons name={item.type==='danger' ? 'warning' : 'car'} size={18} color={item.type==='danger' ? '#F59E42' : '#A259FF'} style={{ marginRight:6 }} />
                <Text style={{ color:'#fff', fontSize:14 }}>{item.type.charAt(0).toUpperCase()+item.type.slice(1)}</Text>
                <Text style={{ color:'#aaa', fontSize:13, marginLeft:8 }}>{item.distance} m</Text>
              </View>
            )}
          />
        </View> */}
      </View>
      {/* Affichage adresse actuelle en bas, en overlay absolu pour ne pas crop la map */}
      {address ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, alignItems: "center", backgroundColor: "#181A20EE", zIndex: 20 }}>
          <Text style={{ color: "#aaa", fontSize: 14, textAlign: "center", maxWidth: "95%" }} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        </View>
      ) : null}
      {/* Notification trafic en temps réel */}
      {trafficAlert && (
        <View style={{ position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
          <View style={{ backgroundColor: '#F59E42', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 }}>
            <Ionicons name="car" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{trafficAlert}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Export du compteur voiture pour réutilisation côté moto
export function ModernSpeedometer({ speed, speedLimit, isOverLimit, color = "#60A5FA" }: { speed: number, speedLimit: number, isOverLimit: boolean, color?: string }) {
  const maxSpeed = 220;
  const radius = 85;
  const strokeWidth = 18;
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
  const webFilter = Platform.OS === "web" ? { filter: `drop-shadow(0px 0px 12px ${isOverLimit ? '#EF4444' : color})` } : {};

  return (
    <View style={{ width: 220, height: 140, alignItems: "center", justifyContent: "center", shadowColor: isOverLimit ? "#EF4444" : color, shadowOpacity: 0.25, shadowRadius: 16 }}>
      <Svg width={220} height={220} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={isOverLimit ? "#EF4444" : color} stopOpacity="0.7" />
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
      <View style={[styles.speedCenter, Platform.OS !== "web" && { shadowColor: isOverLimit ? "#EF4444" : color, shadowOpacity: 0.18, shadowRadius: 8 }]}> 
        <Text style={styles.speedText}>{speed}</Text>
        <Text style={[styles.speedUnit, { color } ]}>KM/H</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1.5, // Augmente la hauteur de la partie haute
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
    backgroundColor: "#60A5FA10",
    zIndex: 0
  },
  speedCarRow: {
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
    color: "#60A5FA",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 2,
  },
  speedoWrap: {},
  carBox: {
    marginLeft: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181A20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 12px 0 #60A5FA1F",
      },
      default: {
        shadowColor: "#60A5FA",
        shadowOpacity: 0.12,
        shadowRadius: 6,
      }
    }),
    minWidth: 54,
  },
  carLabel: {
    color: "#60A5FA",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 2,
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
    color: "#60A5FA",
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
    backgroundColor: "#60A5FA",
    borderRadius: 18,
    paddingHorizontal: 28, // plus large
    paddingVertical: 16, // plus haut
    marginTop: 18, // plus espacé
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 16px 0 #60A5FA33",
      },
      default: {
        shadowColor: "#60A5FA",
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }
    })
  },
  radarAlertIcon: {
    backgroundColor: "#60A5FA",
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
        boxShadow: "0 2px 12px 0 #60A5FA1F",
      },
      default: {
        shadowColor: "#60A5FA",
        shadowOpacity: 0.12,
        shadowRadius: 6,
      }
    }),
    minWidth: 54,
  },
  weatherValue: {
    color: "#60A5FA",
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
