import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Easing, Platform, Dimensions, TouchableOpacity, FlatList, Modal } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { useLocation } from "../../hooks/useLocation";
import { useLeanAngle } from "../../hooks/useLeanAngle";
import ConsentModal from "../../components/common/ConsentModal";
import { useConsent } from "../../hooks/useConsent";
import MapView from "./MapView";
// If you want to use react-native-maps, use:
// import MapView, { Marker } from "react-native-maps";
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

  // Mock d'alertes communautaires (à remplacer par backend plus tard)
  const [alerts, setAlerts] = useState([]); // plus d'alertes sur la carte
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Ajout d'une alerte (mock, à remplacer par API)
  const handleAddAlert = (type: string) => {
    // Désactivé : on ne stocke plus les alertes
    setShowAlertModal(false);
  };

  // Affichage d'une notification si une alerte communautaire (danger/bouchon) est proche (< 300m)
  const nearbyAlert = undefined; // plus de notif communautaire

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
          <View style={[
            styles.limitBadge,
            isOverLimit ? styles.limitBadgeOver : {},
            isSmallScreen && { width: 32, height: 32, borderRadius: 16, borderWidth: 2 }
          ]}>
            <Text style={[
              styles.limitBadgeText,
              isOverLimit ? styles.limitBadgeTextOver : {},
              { color: isOverLimit ? '#EF4444' : '#A259FF' },
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
            shadowColor: leftDetected || rightDetected ? '#A259FF' : '#23242A',
            shadowOpacity: 0.18,
            shadowRadius: 12,
            borderWidth: 1.5,
            borderColor: leftDetected ? '#EF4444' : rightDetected ? '#EF4444' : '#A259FF',
            gap: isSmallScreen ? 8 : 16,
            minWidth: isSmallScreen ? 180 : 240,
            justifyContent: 'center',
            elevation: 2,
            opacity: 0.97
          }}>
            <Ionicons name={leftDetected ? 'bicycle' : 'car-sport'} size={isSmallScreen ? 20 : 28} color={leftDetected ? '#EF4444' : '#A259FF'} style={{ marginRight: 8 }} />
            <Text style={{
              color: leftDetected ? '#EF4444' : '#A259FF',
              fontWeight: 'bold',
              fontSize: isSmallScreen ? 14 : 18,
              marginRight: 8,
              letterSpacing: 0.5
            }}>
              {leftDetected ? 'Moto à proximité' : 'Auto à proximité'}
            </Text>
            <View style={{
              backgroundColor: leftDetected ? '#EF4444' : '#A259FF',
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
              backgroundColor: leftDetected ? '#EF4444' : '#A259FF',
              opacity: 0.7,
              transform: [{ scale: leftDetected || rightDetected ? 1.2 : 1 }],
              shadowColor: leftDetected ? '#EF4444' : '#A259FF',
              shadowOpacity: 0.5,
              shadowRadius: 8
            }} />
          </View>
        ) : null}
      </View>
      {/* Bas : Carte GPS immersive (plein écran sous le header) */}
      <View style={{ flex: 1, overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
        <MapView
          key={recenterKey}
          color="#A259FF"
        />
        {/* Bouton recentrer cross-platform */}
        <View style={{ position: 'absolute', top: 18, right: 64, zIndex: 20 }}>
          <View style={{ backgroundColor: '#23242A', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6 }}>
            <Ionicons name="locate" size={28} color="#A259FF" onPress={() => {
              setRecenterKey(k => k + 1);
            }} />
          </View>
        </View>
        {/* Bouton flottant signalement, discret en haut à gauche */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 58, left: 18, backgroundColor: '#23242A', borderRadius: 18, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, zIndex: 30, opacity: 0.85 }}
          onPress={() => setShowAlertModal(true)}
        >
          <Ionicons name="alert" size={20} color="#A259FF" />
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
                <Ionicons name="car" size={22} color="#60A5FA" style={{ marginRight:8 }} />
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
                <Ionicons name={item.type==='danger' ? 'warning' : 'car'} size={18} color={item.type==='danger' ? '#F59E42' : '#60A5FA'} style={{ marginRight:6 }} />
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