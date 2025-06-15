import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, Modal, Linking } from "react-native";
import Animated, { useSharedValue, withTiming, Easing } from "react-native-reanimated";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient } from "react-native-svg";
import { useLocation } from "../../hooks/useLocation";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";
import MapView from "./MapView";
import { Ionicons } from '@expo/vector-icons';
import { getAddressFromCoords, getSpeedLimitFromCoords, getSpeedLimitFromCoordsOSM } from "../../utils/roadInfo";
import { getWeatherFromCoords } from "../../services/api";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLeanAngle } from "../../hooks/useLeanAngle";
import { Platform } from "react-native";
import Constants from 'expo-constants';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode } from '../../hooks/ThemeContext';
import { Colors } from '../../constants/Colors';
import { useNearbyUsers } from '../../hooks/useNearbyUsers';
import { Marker } from 'react-native-maps';
import { Alert as AlertType } from '../../types/alert';
import { haversine } from '../../utils/haversine';
import { MotoSpeedometer } from "./MotoSpeedometer";
import { Animated as RNAnimated, Easing as RNEasing } from "react-native";
import MuteButton from '../ui/MuteButton';

// Clé Google API pour le trafic (web ou mobile)
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY || "";

// Suppression complète de l'encoche, PanResponder, Animated.Value, etc.
// Ratio fixe : 0.45 pour le haut
const HEADER_RATIO = 0.45;
// MAP_RATIO dynamique : s'agrandit si aucune notif véhicule n'est affichée
let MAP_RATIO = 0.55;

export default function ExploreVoitureScreen() {
  const { hasConsent, acceptConsent } = useConsent();
  const { location } = useLocation('auto');
  const angle = useLeanAngle();
  const speed = location?.coords?.speed ? Math.max(0, Math.round(location.coords.speed * 3.6)) : 0;
  const [speedLimit, setSpeedLimit] = useState<number|null>(null);
  const [speedLimitDebug, setSpeedLimitDebug] = useState<string | null>(null);
  const [address, setAddress] = useState<string>("");
  const [weather, setWeather] = useState<{ temperature: number, icon: string, description: string } | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);
  const [trafficAlert, setTrafficAlert] = useState<string | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const { user } = useAuth();
  const { colorScheme } = useThemeMode();
  const mode = 'auto';
  const { users: nearbyUsers, loading: loadingNearby } = useNearbyUsers(60, mode);
  // MAP_RATIO dynamique (doit être dans le composant pour accéder aux hooks)
  MAP_RATIO = (nearbyUsers.length > 0 && location && location.coords) ? 0.55 : 0.85;

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const isSmallScreen = screenWidth < 370 || screenHeight < 700;

  // Mémorisation de la dernière position météo pour éviter les reloads inutiles
  const lastWeatherPos = React.useRef<{ lat: number, lon: number } | null>(null);

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
              mode: location.mode, // Correction : toujours utiliser le mode courant
            }).eq('id', user.id);
          }
        })
        .catch(() => setAddress(""));
      // Limite de vitesse dynamique (Google Roads prioritaire, fallback OSM)
      getSpeedLimitFromCoords(location.coords.latitude, location.coords.longitude)
        .then(limit => {
          console.log('[ExploreVoitureScreen] Google Roads speedLimit:', limit, 'coords:', location.coords.latitude, location.coords.longitude);
          setSpeedLimitDebug(`[Google] ${limit}`);
          if (limit === null || limit === undefined) {
            getSpeedLimitFromCoordsOSM(location.coords.latitude, location.coords.longitude)
              .then(limitOSM => {
                console.log('[ExploreVoitureScreen] OSM speedLimit:', limitOSM, 'coords:', location.coords.latitude, location.coords.longitude);
                setSpeedLimitDebug(`[OSM] ${limitOSM}`);
                if (limitOSM === null || limitOSM === undefined) {
                  setSpeedLimit(null);
                } else if (!isNaN(Number(limitOSM))) {
                  setSpeedLimit(Number(limitOSM));
                } else {
                  setSpeedLimit(null);
                }
              })
              .catch((e) => { console.log('[ExploreVoitureScreen] OSM speedLimit ERROR', e, 'coords:', location.coords.latitude, location.coords.longitude); setSpeedLimit(null); });
          } else if (!isNaN(Number(limit))) {
            setSpeedLimit(Number(limit));
          } else {
            setSpeedLimit(null);
          }
        })
        .catch((e) => { console.log('[ExploreVoitureScreen] Google Roads speedLimit ERROR', e, 'coords:', location.coords.latitude, location.coords.longitude); setSpeedLimit(null); });
      // Météo locale (ne recharge que si la position a changé)
      const lat = Number(location.coords.latitude.toFixed(3));
      const lon = Number(location.coords.longitude.toFixed(3));
      if (!lastWeatherPos.current || lastWeatherPos.current.lat !== lat || lastWeatherPos.current.lon !== lon) {
        getWeatherFromCoords(location.coords.latitude, location.coords.longitude)
          .then(setWeather)
          .catch(() => setWeather(null));
        lastWeatherPos.current = { lat, lon };
      }
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

  // Affichage d'une notification si une alerte communautaire (danger/bouchon) est proche (< 300m)
  const nearbyAlert = undefined; // plus de notif communautaire

  // Détection trafic en temps réel (web et mobile)
  useEffect(() => {
    if (!location?.coords) return;
    let interval: any;
    async function checkTraffic() {
      if (!location?.coords) return;
      try {
        const { latitude, longitude } = location.coords;
        // Trajet de 1km vers le nord
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

  // Affiche les utilisateurs proches dans la console pour debug
  useEffect(() => {
    if (!loadingNearby) {
      console.log('[NearbyUsers][Voiture]', nearbyUsers);
    }
  }, [nearbyUsers, loadingNearby]);

  // Animation fluide du ratio de la map
  const animatedMapRatio = useRef(new RNAnimated.Value((nearbyUsers.length > 0 && location && location.coords) ? 0.55 : 0.85)).current;
  useEffect(() => {
    const target = (nearbyUsers.length > 0 && location && location.coords) ? 0.55 : 0.85;
    RNAnimated.timing(animatedMapRatio, {
      toValue: target,
      duration: 500,
      easing: RNEasing.inOut(RNEasing.cubic),
      useNativeDriver: false
    }).start();
  }, [nearbyUsers.length, location?.coords]);

  // Filtrage des utilisateurs proches par mode courant
  const sameModeNearby = nearbyUsers.filter(u => u.mode === mode);
  const totalNearby = nearbyUsers.length;

  if (hasConsent === false) {
    return <ConsentModal visible onAccept={acceptConsent} />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#111216' }}
      edges={['left', 'right']}
    >
      {/* Haut : Compteur moderne + météo */}
      <View
        style={[
          styles.headerContainer,
          { flex: HEADER_RATIO, minHeight: 0, paddingTop: 0, marginTop: 0 },
          isSmallScreen && { minHeight: 0, paddingTop: 0, marginTop: 0, paddingBottom: 8 }
        ]}
      >
        <View style={styles.headerGlow} />
        <View style={[
          styles.speedCarRow,
          { marginTop: 0, marginBottom: 0 },
          isSmallScreen && { marginTop: 0, marginBottom: 0 }
        ]} key="auto-header-row">
          {/* Rappel du mode actuel (icône voiture + label) */}
          <View style={[
            styles.modeBox,
            { marginRight: 8, paddingVertical: 8, paddingHorizontal: 12, minWidth: 54 },
            isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40 }
          ]}>
            <Ionicons name="car-sport" size={isSmallScreen ? 20 : 28} color="#60A5FA" style={{ marginBottom: 2 }} />
            <Text style={[
              styles.modeLabel,
              { color: "#60A5FA", fontWeight: "bold", fontSize: 16, marginTop: 2 },
              isSmallScreen && { fontSize: 12, marginTop: 0 }
            ]}>Auto</Text>
          </View>
          <View style={styles.speedoWrap}>
            <MotoSpeedometer speed={speed} speedLimit={speedLimit ?? 0} isOverLimit={isOverLimit} color="#60A5FA" />
          </View>
          <View style={[
            styles.weatherBox,
            { minWidth: 54, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, marginTop: 0 },
            isSmallScreen && { paddingVertical: 4, paddingHorizontal: 8, minWidth: 40, marginTop: 0, marginLeft: 8, paddingBottom: 4, paddingTop: 4, borderRadius: 10, shadowColor: "#60A5FA", shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 }
          ]}>
            {weather ? (
              <>
                <MaterialIcons name={weather.icon as any} size={isSmallScreen ? 20 : 28} color="#60A5FA" style={{ marginBottom: 2 }} />
                <Text style={[styles.weatherValue, isSmallScreen && { fontSize: 13 }]}>{Math.round(weather.temperature)}°C</Text>
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', justifyContent: 'center', width: isSmallScreen ? 28 : 32, height: isSmallScreen ? 28 : 32 }}>
                  <MaterialIcons name="wb-cloudy" size={isSmallScreen ? 20 : 28} color="#60A5FA55" style={{ marginBottom: 2 }} />
                </View>
                <Text style={[styles.weatherLabel, isSmallScreen && { fontSize: 10, marginTop: -2 }]}>Météo…</Text>
              </>
            )}
          </View>
        </View>
        <View style={[
          styles.limitsRow,
          { marginBottom: 8, gap: 12 },
          isSmallScreen && { marginBottom: 2, gap: 6 }
        ]}>
          {/* Badge limite de vitesse */}
          <View style={[
            styles.limitBadge,
            isOverLimit ? styles.limitBadgeOver : {},
            { width: 48, height: 48, borderRadius: 24, borderWidth: 3 },
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
          <Text style={[styles.limitLabel, { fontSize: 16 }, isSmallScreen && { fontSize: 11 }]}>Limite de vitesse</Text>
        </View>
        {/* Notification dynamique véhicule à proximité (infos réelles) */}
        {(totalNearby > 0 && location && location.coords) && (
          <View style={{
            marginTop: isSmallScreen ? 6 : 16,
            alignSelf: 'center',
            backgroundColor: '#23242A',
            borderRadius: 18,
            paddingHorizontal: isSmallScreen ? 18 : 32,
            paddingVertical: isSmallScreen ? 8 : 14,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#60A5FA',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            borderWidth: 1.5,
            borderColor: '#60A5FA',
            gap: isSmallScreen ? 8 : 16,
            minWidth: isSmallScreen ? 180 : 240,
            justifyContent: 'center',
            elevation: 2,
            opacity: 0.97
          }}>
            <Ionicons name={'car'} size={isSmallScreen ? 20 : 28} color={'#60A5FA'} style={{ marginRight: 8 }} />
            <Text style={{
              color: '#60A5FA',
              fontWeight: 'bold',
              fontSize: isSmallScreen ? 14 : 18,
              marginRight: 8,
              letterSpacing: 0.5
            }}>
              {sameModeNearby.length === 0
                ? 'Aucune voiture à proximité'
                : sameModeNearby.length === 1
                  ? '1 voiture à proximité'
                  : `${sameModeNearby.length} voitures à proximité`}
              {totalNearby > sameModeNearby.length &&
                <Text style={{ color: '#aaa', fontWeight: 'normal', fontSize: isSmallScreen ? 12 : 14 }}>  |  {totalNearby} au total</Text>}
            </Text>
            {sameModeNearby[0] && (
              <View style={{
                backgroundColor: '#60A5FA',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginLeft: 4
              }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: isSmallScreen ? 12 : 14 }}>
                  {Math.round(haversine(location.coords.latitude, location.coords.longitude, sameModeNearby[0].lat, sameModeNearby[0].lng))} m
                </Text>
              </View>
            )}
            <Animated.View style={{
              marginLeft: 8,
              width: isSmallScreen ? 10 : 16,
              height: isSmallScreen ? 10 : 16,
              borderRadius: 99,
              backgroundColor: '#60A5FA',
              opacity: 0.7,
              transform: [{ scale: 1.2 }],
              shadowColor: '#60A5FA',
              shadowOpacity: 0.5,
              shadowRadius: 8
            }} />
          </View>
        )}
      </View>
      {/* Bas : Carte GPS immersive (flex dynamique non animé) */}
      <RNAnimated.View style={{ flex: animatedMapRatio, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView
          color="#60A5FA"
          mode="auto"
          nearbyUsers={nearbyUsers}
          userId={user?.id ?? ""}
          addressVisible={!!(address && address.trim() !== '')}
          trafficAlertActive={!!trafficAlert}
        />
        {/* Bouton flottant signalement, discret en haut à gauche (même position que moto) */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 58, left: 12, backgroundColor: '#23242A', borderRadius: 18, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, zIndex: 30, opacity: 0.85 }}
          onPress={() => setShowSosModal(true)}
        >
          <Ionicons name="alert" size={20} color="#60A5FA" />
        </TouchableOpacity>
        {/* Modal choix type d'alerte */}
        <Modal visible={showSosModal} transparent animationType="fade">
          <View style={{ flex:1, backgroundColor:'#0008', justifyContent:'center', alignItems:'center' }}>
            <View style={{ backgroundColor:'#181A20', borderRadius:18, padding:24, minWidth:220 }}>
              <Text style={{ color:'#fff', fontWeight:'bold', fontSize:18, marginBottom:12 }}>Signaler…</Text>
              {/* On retire le signalement radar */}
              <TouchableOpacity onPress={() => {}} style={{ flexDirection:'row', alignItems:'center', marginBottom:14 }}>
                <Ionicons name="warning" size={22} color="#F59E42" style={{ marginRight:8 }} />
                <Text style={{ color:'#fff', fontSize:16 }}>Danger</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} style={{ flexDirection:'row', alignItems:'center', marginBottom:6 }}>
                <Ionicons name="car" size={22} color="#A259FF" style={{ marginRight:8 }} />
                <Text style={{ color:'#fff', fontSize:16 }}>Bouchon</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowSosModal(false)} style={{ marginTop:10, alignSelf:'flex-end' }}>
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
      </RNAnimated.View>
      {/* Overlay adresse actuelle en bas, en overlay absolu pour ne pas crop la map */}
      {/* Affichage unique de l'adresse, sans doublon ni version colorée */}
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
      <View style={[styles.speedCenter, Platform.OS !== "web" && { shadowColor: isOverLimit ? "#EF4444" : color, shadowOpacity: 0.18, shadowRadius: 8, top: 28 }]}> 
        <Text style={styles.speedText}>{speed}</Text>
        <Text style={[styles.speedUnit, { color } ]}>KM/H</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1.5,
    backgroundColor: "#181A20",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginTop: 0, // Suppression de la marge haute
    paddingTop: 0, // Suppression du padding haut
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
    paddingBottom: 8,
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
    top: 28,
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
    marginTop: 4,
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
