import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, FlatList, Modal, Linking } from "react-native";
import Animated, { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { useLocation } from "../../hooks/useLocation";
import { useLeanAngle } from "../../hooks/useLeanAngle";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";
import MapView from "./MapView";
// If you want to use react-native-maps, use:
// import MapView, { Marker } from "react-native-maps";
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { getAddressFromCoords, getSpeedLimitFromCoordsOSM } from "../../utils/roadInfo";
import { IconSymbol } from "../ui/IconSymbol";
import { ModernSpeedometer } from "./ExploreVoitureScreen";
import Constants from 'expo-constants';
import AnimatedBike from "./AnimatedBike";
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNearbyUsers } from '../../hooks/useNearbyUsers';
import { Marker } from 'react-native-maps';
import { Alert as AlertType } from '../../types/alert';
import { haversine } from '../../utils/haversine';
import { Animated as RNAnimated } from "react-native";

// Clé Google API pour le trafic (web ou mobile)
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY || "";

export default function ExploreMotoScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const { location } = useLocation();
  const angle = useLeanAngle();
  const speed = location?.coords?.speed ? Math.max(0, Math.round(location.coords.speed * 3.6)) : 0;
  const [speedLimit, setSpeedLimit] = useState<number|null>(null);
  const [address, setAddress] = useState<string>("");
  const [mapRegion, setMapRegion] = useState({
    latitude: location?.coords?.latitude || 44.7586,
    longitude: location?.coords?.longitude || -0.4182,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [recenterKey, setRecenterKey] = useState(0);

  // Animation compteur (aiguille)
  const animatedSpeed = useSharedValue(speed);
  useEffect(() => {
    animatedSpeed.value = withTiming(speed, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [speed]);

  const [speedLimitDebug, setSpeedLimitDebug] = useState<string | null>(null);

  const { user } = useAuth();
  // Rayon réduit à 60 mètres pour la détection des utilisateurs proches
  const { users: nearbyUsers, loading: loadingNearby } = useNearbyUsers(60, true);

  useEffect(() => {
    if (location?.coords) {
      setSpeedLimit(null); // Reset à chaque changement de position
      setSpeedLimitDebug(null); // Reset debug
      // Adresse (ville, rue...)
      getAddressFromCoords(location.coords.latitude, location.coords.longitude)
        .then(async addr => {
          const { road, house_number, postcode, suburb, city, town, village, state, country } = addr || {};
          const addressString = [house_number, road, postcode, suburb, city, town, village, state, country].filter(Boolean).join(", ");
          setAddress(addressString);
          // Envoi à Supabase : adresse + position précise
          if (user?.id && addressString) {
            await supabase.from('users').update({
              address: addressString,
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              last_seen_at: new Date().toISOString(),
              mode: 'moto', // Ajout du mode de tracking
            }).eq('id', user.id);
          }
        })
        .catch(() => setAddress(""));
      // Limite de vitesse dynamique
      getSpeedLimitFromCoordsOSM(location.coords.latitude, location.coords.longitude)
        .then(limit => {
          if (limit === null || limit === undefined) {
            setSpeedLimit(null);
          } else if (!isNaN(Number(limit))) {
            setSpeedLimit(Number(limit));
          } else {
            setSpeedLimit(null);
          }
        })
        .catch(e => {
          setSpeedLimit(null);
        });
    }
  }, [location?.coords]);

  useEffect(() => {
    if (location?.coords) {
      setMapRegion(region => ({
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    }
  }, [location?.coords]);

  // Calcul sécurisé du dépassement de la limite
  const isOverLimit = typeof speedLimit === 'number' && !isNaN(speedLimit) && speed > speedLimit;

  // TODO: Replace these with real detection logic or props
  const leftDetected = true;
  const rightDetected = false;

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenWidth < 370 || screenHeight < 700;

  const [trafficAlert, setTrafficAlert] = useState<string | null>(null);

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

  const [showSosModal, setShowSosModal] = useState(false);

  // Suppression du système d'encoche et du PanResponder
  // Ratio fixe : 0.45 pour le haut, 0.55 pour le bas (identique voiture/moto)
  const HEADER_RATIO = 0.45;
  const MAP_RATIO = 0.55;

  // Animation shake du badge limite de vitesse
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    if (isOverLimit) {
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [isOverLimit]);

  // Couleur dynamique du badge selon le dépassement
  let badgeColor = "#A259FF";
  if (typeof speedLimit === 'number' && !isNaN(speedLimit) && speedLimit > 0) {
    const ratio = Math.max(0, Math.min(1, (speed - speedLimit) / speedLimit));
    // Interpolation du violet au rouge
    const r = Math.round(162 + (239 - 162) * ratio); // R: 162 -> 239
    const g = Math.round(89 + (68 - 89) * ratio);   // G: 89 -> 68
    const b = Math.round(255 + (68 - 255) * ratio); // B: 255 -> 68
    badgeColor = `rgb(${r},${g},${b})`;
  }

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#111216" }}
      edges={['left', 'right']}
    >
      {/* Haut : Compteur moderne + indicateur angle */}
      <View
        style={[
          styles.headerContainer,
          { flex: HEADER_RATIO, minHeight: 0, paddingTop: 0, marginTop: 0 },
          isSmallScreen && { minHeight: 0, paddingTop: 0, marginTop: 0, paddingBottom: 8 }
        ]}
      >
        <View style={styles.headerGlow} />
        <View style={[
          styles.speedAngleRow,
          { marginTop: 0, marginBottom: 0 },
          isSmallScreen && { marginTop: 0, marginBottom: 0 }
        ]} key="moto-header-row">
          {/* Rappel du mode actuel (icône moto + label) */}
          <View style={[
            styles.modeBox,
            { marginRight: 8, paddingVertical: 8, paddingHorizontal: 12, minWidth: 54 },
            isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40 }
          ]}>
            <IconSymbol name="motorcycle" size={isSmallScreen ? 20 : 28} color="#A259FF" style={{ marginBottom: 2 }} />
            <Text style={[
              styles.modeLabel,
              { color: "#A259FF", fontWeight: "bold", fontSize: 16, marginTop: 2 },
              isSmallScreen && { fontSize: 12, marginTop: 0 }
            ]}>Moto</Text>
          </View>
          <View style={styles.speedoWrap}>
            {/* Utilise le compteur voiture mais en violet */}
            <ModernSpeedometer speed={speed} speedLimit={speedLimit ?? 0} isOverLimit={isOverLimit} color="#A259FF" />
          </View>
          <View style={[
            styles.leanBox,
            { minWidth: 54, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, marginTop: 0 },
            isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40, marginTop: 0, marginLeft: 8, paddingBottom: 4, paddingTop: 4, borderRadius: 10, shadowColor: "#A259FF", shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 }
          ]}>
            {/* Icône interactive inclinée selon l'angle (SVG custom) */}
            <View style={{ width: isSmallScreen ? 32 : 40, height: isSmallScreen ? 32 : 40, alignItems: 'center', justifyContent: 'center' }}>
              <AnimatedBike lean={-angle} />
            </View>
            <Text style={[styles.leanValue, isSmallScreen && { fontSize: 13 }]}>{Math.abs(angle)}°</Text>
            <Text style={[styles.leanLabel, isSmallScreen && { fontSize: 10, marginTop: -2 }]}>Inclinaison</Text>
          </View>
        </View>
        <View style={[
          styles.limitsRow,
          { marginBottom: 8, gap: 12 },
          isSmallScreen && { marginBottom: 2, gap: 6 }
        ]}>
          {/* Badge limite de vitesse */}
          <RNAnimated.View style={[
            styles.limitBadge,
            isOverLimit ? styles.limitBadgeOver : {},
            { width: 48, height: 48, borderRadius: 24, borderWidth: 3, backgroundColor: '#181A20', borderColor: badgeColor, transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] },
            isSmallScreen && { width: 32, height: 32, borderRadius: 16, borderWidth: 2 }
          ]}>
            <Text style={[
              styles.limitBadgeText,
              isOverLimit ? styles.limitBadgeTextOver : {},
              { color: badgeColor },
              isSmallScreen && { fontSize: 12 }
            ]}>
              {typeof speedLimit === 'number' && !isNaN(speedLimit) ? speedLimit : '—'}
            </Text>
          </RNAnimated.View>
          <Text style={[styles.limitLabel, { fontSize: 16 }, isSmallScreen && { fontSize: 11 }]}>Limite de vitesse</Text>
        </View>
        {/* Notification dynamique véhicule à proximité (infos réelles) */}
        {(nearbyUsers.length > 0 && location && location.coords) && (
          <View style={{
            marginTop: isSmallScreen ? 6 : 16,
            alignSelf: 'center',
            backgroundColor: '#23242A',
            borderRadius: 18,
            paddingHorizontal: isSmallScreen ? 18 : 32,
            paddingVertical: isSmallScreen ? 8 : 14,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#A259FF',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            borderWidth: 1.5,
            borderColor: '#A259FF',
            gap: isSmallScreen ? 8 : 16,
            minWidth: isSmallScreen ? 180 : 240,
            justifyContent: 'center',
            elevation: 2,
            opacity: 0.97
          }}>
            <Ionicons name={nearbyUsers[0].mode === 'auto' ? 'car' : 'bicycle'} size={isSmallScreen ? 20 : 28} color={nearbyUsers[0].mode === 'auto' ? '#60A5FA' : '#A259FF'} style={{ marginRight: 8 }} />
            <Text style={{
              color: nearbyUsers[0].mode === 'auto' ? '#60A5FA' : '#A259FF',
              fontWeight: 'bold',
              fontSize: isSmallScreen ? 14 : 18,
              marginRight: 8,
              letterSpacing: 0.5
            }}>
              {nearbyUsers.length === 1
                ? (nearbyUsers[0].mode === 'auto' ? 'Voiture à proximité' : 'Moto à proximité')
                : `${nearbyUsers.filter(u => u.mode === nearbyUsers[0].mode).length} ${nearbyUsers[0].mode === 'auto' ? 'voitures' : 'motos'} à proximité`}
            </Text>
            <View style={{
              backgroundColor: nearbyUsers[0].mode === 'auto' ? '#60A5FA' : '#A259FF',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginLeft: 4
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: isSmallScreen ? 12 : 14 }}>
                {Math.round(haversine(location.coords.latitude, location.coords.longitude, nearbyUsers[0].lat, nearbyUsers[0].lng))} m
              </Text>
            </View>
            <Animated.View style={{
              marginLeft: 8,
              width: isSmallScreen ? 10 : 16,
              height: isSmallScreen ? 10 : 16,
              borderRadius: 99,
              backgroundColor: nearbyUsers[0].mode === 'auto' ? '#60A5FA' : '#A259FF',
              opacity: 0.7,
              transform: [{ scale: 1.2 }],
              shadowColor: nearbyUsers[0].mode === 'auto' ? '#60A5FA' : '#A259FF',
              shadowOpacity: 0.5,
              shadowRadius: 8
            }} />
          </View>
        )}
      </View>
      {/* Bas : Carte GPS immersive (flex dynamique non animé) */}
      <View style={{ flex: MAP_RATIO, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView
          key={recenterKey}
          color="#A259FF"
          mode="moto"
          nearbyUsers={nearbyUsers}
          userId={user?.id || ""}
        />
        {/* Bouton flottant signalement, discret en haut à gauche */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 58, left: 12, backgroundColor: '#23242A', borderRadius: 18, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, zIndex: 30, opacity: 0.85 }}
          onPress={() => setShowSosModal(true)}
        >
          <Ionicons name="alert" size={20} color="#A259FF" />
        </TouchableOpacity>
        {/* Modal choix type d'alerte */}
        <Modal visible={showSosModal} transparent animationType="fade">
          <View style={{ flex:1, backgroundColor:'#000B', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor:'#181A20', borderRadius:16, padding:18, minWidth:160, alignItems:'center' }}>
        <Ionicons name="alert-circle" size={28} color="#EF4444" style={{ marginBottom: 8 }} />
        <Text style={{ color:'#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 6, textAlign: 'center' }}>
          Appel d'urgence
        </Text>
        <Text style={{ color:'#fff', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
          Vous allez appeler le numéro international d'urgence (112).
          Utilisez cette fonction uniquement en cas de danger réel.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor:'#EF4444', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, marginBottom: 6 }}
          onPress={() => {
            setShowSosModal(false);
            setTimeout(() => {
          // Compose le numéro d'urgence (112)
          Linking.openURL('tel:112');
            }, 400);
          }}
        >
          <Text style={{ color:'#fff', fontWeight: 'bold', fontSize: 14 }}>Appeler le 112</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSosModal(false)} style={{ marginTop: 4 }}>
          <Text style={{ color:'#aaa', fontSize: 12 }}>Annuler</Text>
        </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
      {/* Overlay adresse actuelle en bas, en overlay absolu pour ne pas crop la map */}
      {address && address.trim() !== '' ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, alignItems: "center", backgroundColor: "#181A20EE", opacity: 0.93, borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 20, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500', textAlign: 'center' }} numberOfLines={2}>
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
      {/* SOS Emergency Bubble */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          backgroundColor: '#EF4444',
          borderRadius: 32,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#EF4444',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 4,
          zIndex: 100
        }}
        onPress={() => setShowSosModal(true)}
        activeOpacity={0.85}
        accessibilityLabel="Appeler les secours"
      >
        <Ionicons name="call" size={16} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10, marginTop: 2 }}>SOS</Text>
      </TouchableOpacity>
      {/* SOS Alert Modal */}
      <Modal visible={showSosModal} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000B', justifyContent:'center', alignItems:'center' }}>
          <View style={{ backgroundColor:'#181A20', borderRadius:16, padding:18, minWidth:160, alignItems:'center' }}>
        <Ionicons name="alert-circle" size={28} color="#EF4444" style={{ marginBottom: 8 }} />
        <Text style={{ color:'#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 6, textAlign: 'center' }}>
          Appel d'urgence
        </Text>
        <Text style={{ color:'#fff', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
          Vous allez appeler le numéro international d'urgence (112).
          Utilisez cette fonction uniquement en cas de danger réel.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor:'#EF4444', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, marginBottom: 6 }}
          onPress={() => {
            setShowSosModal(false);
            setTimeout(() => {
          // Compose le numéro d'urgence (112)
          Linking.openURL('tel:112');
            }, 400);
          }}
        >
          <Text style={{ color:'#fff', fontWeight: 'bold', fontSize: 14 }}>Appeler le 112</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSosModal(false)} style={{ marginTop: 4 }}>
          <Text style={{ color:'#aaa', fontSize: 12 }}>Annuler</Text>
        </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1.5,
    backgroundColor: "#181A20",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginTop: -40,
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
    top: 28, // remonte la vitesse et le km/h de 10px
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
  weatherBox: {
    marginLeft: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181A20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,

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
  },
  modeBox: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181A20",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,

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
  modeLabel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: -2,
    textAlign: "center"
  }
});