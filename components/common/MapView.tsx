// MapView.tsx : version mobile (Expo/React Native)
import React, { useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, Platform, StatusBar, Text, Pressable, Animated as RNAnimated, FlatList, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useLocation } from "../../hooks/useLocation";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Svg, { Polygon } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../hooks/ThemeContext';
import AnimatedBike from "./AnimatedBike";
import { useLeanAngle } from "../../hooks/useLeanAngle";
import { useHeading } from "../../hooks/useHeading";
import { useTrafficLayer } from '../../hooks/useTrafficLayer';
import { Modal, TextInput, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#181A20' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#181A20' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#f3f4f6' }] }, // gris très clair pour tous les labels
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ color: '#f3f4f6' }] }, // gris très clair pour POI
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3A3D4D' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#5A5D6D' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#f3f4f6' }] }, // gris très clair pour les noms de rues
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#181A20' }] },
  { featureType: 'water', elementType: 'labels.text', stylers: [{ color: '#f3f4f6' }] }, // gris très clair pour labels sur l'eau
];

export type MapMode = 'moto' | 'auto';

function getLightMapStyle(mode: MapMode = 'moto') {
  // Couleurs plus douces, routes principales en violet (moto) ou bleu (auto)
  const mainRoadColor = mode === 'moto' ? '#a78bfa' : '#60a5fa'; // violet doux ou bleu doux
  const mainRoadStroke = mode === 'moto' ? '#c4b5fd' : '#93c5fd';
  return [
    { elementType: 'geometry', stylers: [{ color: '#f6f7fa' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#fff' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#888' }] }, // gris moyen pour tous les labels
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
    { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: mainRoadColor }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: mainRoadStroke }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#888' }] }, // gris moyen pour les noms de rues
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e7ef' }] },
    { featureType: 'water', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  ];
}

export default function CustomMapView({ color = "#A259FF", mode = 'moto', nearbyUsers = [], userId }: { color?: string, mode?: MapMode, nearbyUsers?: Array<{ id: string, name: string, lat: number, lng: number, mode?: string }>, userId: string }) {
  const { location } = useLocation();
  const lat = location?.coords?.latitude;
  const lon = location?.coords?.longitude;
  const mapRef = useRef<MapView>(null);
  const { colorScheme } = useThemeMode();
  const [hasCentered, setHasCentered] = useState(false);
  const leanAngle = useLeanAngle();
  const headingSensor = useHeading(400); // 400ms update
  const [showTraffic] = useTrafficLayer();
  const [manualRecenter, setManualRecenter] = useState(false);
  const [routeMode, setRouteMode] = useState<'idle' | 'selecting' | 'navigating'>('idle');
  const [routePoints, setRoutePoints] = useState<{ start?: { latitude: number, longitude: number }, end?: { latitude: number, longitude: number } }>({});
  const [routePolyline, setRoutePolyline] = useState<Array<{ latitude: number, longitude: number }>>([]);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  // Affichage d'une erreur d'itinéraire
  const [routeError, setRouteError] = useState<string | null>(null);
  // Ajout d'un état pour l'étape courante
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Reconnaissance vocale pour la destination
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Définition des couleurs selon le mode
  const accentColor = mode === 'auto' ? '#2979FF' : '#A259FF';
  const accentColorLight = mode === 'auto' ? '#60A5FA' : '#C4B5FD';
  const accentColorBg = mode === 'auto' ? '#E3F0FF' : '#F3E8FF';

  // Recentrage automatique une seule fois à l'ouverture quand la position est connue
  useEffect(() => {
    if (!hasCentered && lat && lon && mapRef.current) {
      try {
        mapRef.current.animateCamera({
          center: { latitude: lat, longitude: lon },
          zoom: 19, // Zoom plus proche
          pitch: 65,
          heading: location?.coords?.heading || 0,
        }, { duration: 500 });
        setHasCentered(true);
      } catch (e) {
        console.log('[MapView] animateCamera (auto) ERROR', e);
      }
    }
  }, [lat, lon, hasCentered]);

  // Animation fluide de la caméra à chaque update de position (GPS-following classique)
  useEffect(() => {
    const heading = headingSensor ?? location?.coords?.heading ?? 0;
    console.log('[MapView] useEffect follow (boussole)', { manualRecenter, hasCentered, lat, lon, headingSensor, headingGps: location?.coords?.heading, headingUsed: heading });
    if (manualRecenter) return;
    if (hasCentered && lat && lon && mapRef.current) {
      try {
        mapRef.current.animateCamera({
          center: { latitude: lat, longitude: lon },
          zoom: 19,
          pitch: 70,
          heading,
        }, { duration: 200 });
      } catch (e) {
        console.log('[MapView] animateCamera (follow) ERROR', e);
      }
    }
  }, [lat, lon, hasCentered, headingSensor, manualRecenter]);

  // Suivi dynamique du cap en mode navigation : la route devant soi
  useEffect(() => {
    if (routeMode !== 'navigating' || !lat || !lon || !mapRef.current) return;
    const heading = headingSensor ?? location?.coords?.heading ?? 0;
    try {
      mapRef.current.animateCamera({
        center: { latitude: lat, longitude: lon },
        zoom: 19,
        pitch: 70,
        heading,
      }, { duration: 200 });
    } catch (e) {
      // ignore
    }
  }, [lat, lon, headingSensor, routeMode]);

  // Ajoute une caméra contrôlée pour garder le marker toujours centré et la vue dynamique
  const camera = lat && lon ? {
    center: { latitude: lat, longitude: lon },
    zoom: 19, // Zoom plus proche
    pitch: 70,
    heading: (() => {
      const speed = location?.coords?.speed ? location.coords.speed * 3.6 : 0;
      return (speed > 2)
        ? (headingSensor ?? location?.coords?.heading ?? 0)
        : (location?.coords?.heading ?? 0);
    })(),
    altitude: 0,
  } : undefined;

  // Optimisation des Markers : React.memo pour NearbyUserMarker
  const NearbyUserMarker = React.memo(function NearbyUserMarker({ user }: { user: { id: string, name: string, lat: number, lng: number, mode?: string } }) {
    return (
      <Marker
        coordinate={{ latitude: user.lat, longitude: user.lng }}
        title={user.name}
        description={user.mode}
        tracksViewChanges={true}
      >
        <Ionicons
          name={user.mode === 'auto' ? 'car' : 'bicycle'}
          size={28}
          color={user.mode === 'auto' ? '#60A5FA' : '#A259FF'}
        />
      </Marker>
    );
  });

  // Mémoïsation des markers des utilisateurs proches
  const nearbyUserMarkers = React.useMemo(
    () => nearbyUsers.map(user => <NearbyUserMarker key={user.id} user={user} />),
    [nearbyUsers]
  );

  // Bouton de recentrage manuel
  const recenter = React.useCallback(() => {
    if (mapRef.current && lat && lon) {
      try {
        mapRef.current.animateCamera({
          center: { latitude: lat, longitude: lon },
          zoom: 20, // Zoom encore plus proche
          pitch: 65,
          heading: headingSensor ?? location?.coords?.heading ?? 0,
        }, { duration: 500 });
        setManualRecenter(false); // Réactive le suivi automatique immédiatement
      } catch (e) {
        console.log('[MapView] animateCamera (button) ERROR', e);
      }
    }
  }, [mapRef, lat, lon, headingSensor, location?.coords?.heading]);

  // Timer pour réactiver le recentrage auto après 5s d'inactivité manuelle
  useEffect(() => {
    if (!manualRecenter) return;
    const timeout = setTimeout(() => {
      setManualRecenter(false);
    }, 8000); // 8  secondes
    return () => clearTimeout(timeout);
  }, [manualRecenter]);

  // Zoom dynamique lors du croisement d'un autre utilisateur
  useEffect(() => {
    if (!mapRef.current || !nearbyUsers || !userId || !location?.coords) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    let crossing = false;
    for (const user of nearbyUsers) {
      if (user.id === userId) continue;
      const dist = Math.sqrt((user.lat - lat) ** 2 + (user.lng - lon) ** 2) * 111139;
      if (dist < 30) {
        crossing = true;
        break;
      }
    }
    if (crossing) {
      mapRef.current.animateCamera({ zoom: 18 }, { duration: 400 });
    } else {
      mapRef.current.animateCamera({ zoom: 16 }, { duration: 800 });
    }
  }, [nearbyUsers, userId, location]);

  // Mémoïsation des boutons de zoom
  const zoomButtons = React.useMemo(() => [
    {icon: "add" as const, action: async () => {
      if (mapRef.current) {
        const camera = await mapRef.current.getCamera();
        mapRef.current.animateCamera({ ...camera, zoom: (camera.zoom ?? 15) + 1 });
      }
    }},
    {icon: "remove" as const, action: async () => {
      if (mapRef.current) {
        const camera = await mapRef.current.getCamera();
        mapRef.current.animateCamera({ ...camera, zoom: (camera.zoom ?? 15) - 1 });
      }
    }}
  ], [mapRef]);

  // Appel à l'API Google Directions
  const fetchRoute = async (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }, onFail?: () => void) => {
    setIsLoadingRoute(true);
    setRouteError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=driving&traffic_model=best_guess&departure_time=now&key=${apiKey}`;
      console.log('Directions API URL:', url); // LOG URL
      const response = await fetch(url);
      const data = await response.json();
      console.log('Directions API response:', JSON.stringify(data)); // LOG REPONSE
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRoutePolyline(points);
        setRouteInfo(data.routes[0]);
        setRouteMode('navigating');
        setDestinationModalVisible(false);
      } else {
        setRouteError('Aucun itinéraire trouvé pour cette adresse.');
        if (onFail) onFail();
      }
    } catch (e) {
      setRouteError('Erreur lors du calcul de l\'itinéraire.');
      if (onFail) onFail();
    }
    setIsLoadingRoute(false);
  };

  // Handler pour sélectionner un point sur la carte
  const handleMapPress = React.useCallback((e: any) => {
    if (routeMode === 'selecting') {
      if (!routePoints.start) {
        setRoutePoints({ start: e.nativeEvent.coordinate });
      } else if (!routePoints.end) {
        const end = e.nativeEvent.coordinate;
        setRoutePoints(points => ({ ...points, end }));
        fetchRoute(routePoints.start, end);
      }
    }
  }, [routeMode, routePoints, fetchRoute]);

  // Décodage polyline Google
  function decodePolyline(encoded: string) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  // Recherche coordonnées via Google Geocoding
  const geocodeAddress = async (address: string) => {
    setIsLoadingRoute(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].geometry.location;
      }
    } catch (e) {}
    setIsLoadingRoute(false);
    return null;
  };

  // Lancement du calcul d'itinéraire après saisie ou dictée
  const handleDestinationSubmit = async () => {
    if (!destinationInput) return;
    setIsLoadingRoute(true);
    setRouteError(null);
    const start = lat && lon ? { latitude: lat, longitude: lon } : null;
    const dest = await geocodeAddress(destinationInput);
    if (dest && start) {
      setRoutePoints({ start, end: dest });
      fetchRoute(start, dest, () => setDestinationModalVisible(true));
    } else {
      setRouteError('Impossible de trouver la destination ou la position de départ.');
      setDestinationModalVisible(true);
    }
    setIsLoadingRoute(false);
  };

  // Debounce utilitaire simple
  function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // Recherche d'adresses avec Google Places Autocomplete (debounced)
  const fetchAutocomplete = React.useCallback(debounce(async (input: string) => {
    setAutocompleteLoading(true);
    setAutocompleteError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&language=fr&components=country:fr&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== 'OK') {
        setAutocompleteError(data.error_message || data.status || 'Erreur API');
        setAutocompleteResults([]);
      } else if (data.predictions) setAutocompleteResults(data.predictions);
      else setAutocompleteResults([]);
    } catch (e) {
      setAutocompleteError('Erreur réseau ou API');
      setAutocompleteResults([]);
    }
    setAutocompleteLoading(false);
  }, 350), []);

  // Sur changement de texte, lancer l'autocomplete (debounced)
  useEffect(() => {
    if (destinationInput.length > 2 && destinationModalVisible) {
      fetchAutocomplete(destinationInput);
    } else {
      setAutocompleteResults([]);
    }
  }, [destinationInput, destinationModalVisible, fetchAutocomplete]);

  // Sélection d'une suggestion
  const handleSelectSuggestion = async (item: any) => {
    setDestinationInput(item.description);
    setAutocompleteResults([]);
    Keyboard.dismiss();
    setIsLoadingRoute(true);
    setRouteError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      const loc = data.result.geometry.location;
      const start = lat && lon ? { latitude: lat, longitude: lon } : null;
      if (loc && start) {
        setRoutePoints({ start, end: loc });
        fetchRoute(start, loc, () => setDestinationModalVisible(true));
      } else {
        setRouteError('Position de départ inconnue.');
        setDestinationModalVisible(true);
      }
    } catch (e) {
      setRouteError('Erreur lors de la récupération de la destination.');
      setDestinationModalVisible(true);
    }
    setIsLoadingRoute(false);
  };

  // Met à jour l'étape courante selon la position GPS
  useEffect(() => {
    if (!routeInfo || !routeInfo.legs || !routeInfo.legs[0].steps) return;
    if (!location?.coords) return;
    const steps = routeInfo.legs[0].steps;
    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;
    // Trouve l'étape la plus proche
    let minDist = Infinity;
    let minIdx = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const lat = step.start_location.lat;
      const lon = step.start_location.lng;
      const dist = Math.sqrt((lat - userLat) ** 2 + (lon - userLon) ** 2);
      if (dist < minDist) {
        minDist = dist;
        minIdx = i;
      }
    }
    setCurrentStepIndex(minIdx);
  }, [location, routeInfo]);

  // Parle l'instruction courante à chaque changement d'étape
  useEffect(() => {
    if (routeMode === 'navigating' && routeInfo && routeInfo.legs && routeInfo.legs[0].steps && routeInfo.legs[0].steps[currentStepIndex]) {
      const step = routeInfo.legs[0].steps[currentStepIndex];
      const instruction = step.html_instructions.replace(/<[^>]+>/g, '');
      Speech.speak(instruction, { language: 'fr-FR' });
    }
  }, [currentStepIndex, routeMode, routeInfo]);

  // Recalcul automatique d'itinéraire si l'utilisateur s'écarte trop
  // Throttling du recalcul automatique d'itinéraire
  const lastRecalcRef = useRef(0);
  useEffect(() => {
    if (routeMode !== 'navigating' || !routeInfo || !routeInfo.legs || !routeInfo.legs[0].steps || !location?.coords) return;
    const now = Date.now();
    if (now - lastRecalcRef.current < 5000) return; // 5s entre deux recalculs
    const steps = routeInfo.legs[0].steps;
    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;
    // On prend tous les points de l'itinéraire
    const poly = routePolyline;
    if (!poly || poly.length === 0) return;
    // Calcul de la distance minimale à l'itinéraire
    let minDist = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const d = Math.sqrt((poly[i].latitude - userLat) ** 2 + (poly[i].longitude - userLon) ** 2);
      if (d < minDist) minDist = d;
    }
    // Si l'utilisateur s'éloigne de plus de 60 mètres, on recalcule
    if (minDist * 111139 > 60 && routePoints.end) {
      lastRecalcRef.current = now;
      const start = { latitude: userLat, longitude: userLon };
      setRoutePoints({ start, end: routePoints.end });
      fetchRoute(start, routePoints.end);
    }
  }, [location, routeMode, routeInfo, routePolyline, routePoints.end]);

  // Gestion de la reconnaissance vocale améliorée
  useEffect(() => {
    const onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setDestinationInput(e.value[0]);
        setIsListening(false);
        setVoiceError(null);
      }
    };
    const onSpeechEnd = () => setIsListening(false);
    const onSpeechError = (e) => {
      setIsListening(false);
      setVoiceError('Erreur de reconnaissance vocale. Réessaie.');
    };
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    setIsListening(true);
    setVoiceError(null);
    try {
      await Voice.start('fr-FR');
    } catch (e) {
      setIsListening(false);
      setVoiceError("Impossible de démarrer la reconnaissance vocale.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f6f7fa' }}>
      <MapView
        key={colorScheme}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1, borderRadius: 0, overflow: 'hidden', paddingTop: 0, marginTop: 0 }}
        initialRegion={{
          latitude: lat || 48.8584,
          longitude: lon || 2.2945,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        customMapStyle={colorScheme === 'dark' ? DARK_MAP_STYLE : undefined}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
        zoomControlEnabled={false} // Désactive les boutons natifs
        showsCompass={true}
        showsBuildings={false}
        toolbarEnabled={true}
        minZoomLevel={6}
        maxZoomLevel={19}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        showsTraffic={showTraffic}
        onPanDrag={() => setManualRecenter(true)}
        onRegionChange={() => setManualRecenter(true)}
        camera={manualRecenter ? undefined : camera}
        onPress={handleMapPress}
      >
        {/* Affiche uniquement un rond coloré pour la position utilisateur en mode auto */}
        {lat && lon && mode === 'auto' && (
          <Marker.Animated
            coordinate={{ latitude: lat, longitude: lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            tracksViewChanges={false}
          >
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 19,
              backgroundColor: color || '#2979FF',
              borderWidth: 6,
              borderColor: '#fff',
              shadowColor: color || '#2979FF',
              shadowOpacity: 0.32,
              shadowRadius: 12,
              elevation: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Carré directionnel */}
              <View style={{
                width: 18,
                height: 18,
                backgroundColor: '#fff',
                borderRadius: 4,
                transform: [{ rotate: `${headingSensor ?? location?.coords?.heading ?? 0}deg` }],
                borderWidth: 2,
                borderColor: color || '#2979FF',
              }} />
            </View>
          </Marker.Animated>
        )}
        {/* Markers des utilisateurs proches (affiche tout le monde, y compris soi-même, pour le testing) */}
        {nearbyUserMarkers}
        {/* Affichage de l'itinéraire */}
        {routePolyline.length > 0 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor="#2979FF"
            strokeWidth={6}
          />
        )}
      </MapView>
      {/* Boutons de zoom personnalisés */}
      <View style={{ position: 'absolute', top: 80, right: 34, zIndex: 200, flexDirection: 'column', gap: 12 }}>
        {zoomButtons.map(({icon, action}, idx) => {
          const scale = useRef(new RNAnimated.Value(1)).current;
          const onPressIn = () => RNAnimated.spring(scale, { toValue: 0.85, useNativeDriver: true }).start();
          const onPressOut = () => RNAnimated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
          return (
            <Pressable
              key={icon}
              onPress={action}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={{ marginBottom: idx === 0 ? 8 : 0 }}
            >
              <RNAnimated.View style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 16,
                padding: 6,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.10,
                shadowRadius: 3,
                transform: [{ scale }],
              }}>
                <Ionicons name={icon} size={20} color="#222" />
              </RNAnimated.View>
            </Pressable>
          );
        })}
      </View>
      {/* Bouton de recentrage, visible uniquement en mode manuel */}
      {manualRecenter && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 12,
            right: 24,
            backgroundColor: color,
            borderRadius: 24,
            padding: 12,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 6,
            zIndex: 100
          }}
          onPress={recenter}
        >
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* Icône 3D dédiée pour la vue immersive */}
            <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={24} height={32} viewBox="0 0 24 24">
                <Polygon points="12,2 22,7 12,12 2,7" fill={color} />
                <Polygon points="12,12 22,7 22,17 12,22" fill={color === '#A259FF' ? '#7C3AED' : '#3B82F6'} />
                <Polygon points="12,12 2,7 2,17 12,22" fill={color === '#A259FF' ? '#6D28D9' : '#2563EB'} />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>
      )}
      {/* Bouton flottant signalement, discret en haut à gauche sous la boussole */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 58, left: 12, backgroundColor: '#23242A', borderRadius: 18, padding: 8, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, zIndex: 30, opacity: 0.85 }}
        onPress={() => {}} // plus d'action
      >
        <Ionicons name="alert" size={20} color="#A259FF" />
      </TouchableOpacity>
      {/* Bouton flottant pour lancer la création d'itinéraire */}
      {routeMode === 'idle' && (
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 80, right: 24, backgroundColor: accentColor, borderRadius: 32, padding: 16, shadowColor: accentColor, shadowOpacity: 0.18, shadowRadius: 8, zIndex: 100 }}
          onPress={() => { setDestinationModalVisible(true); setRouteMode('selecting'); setRoutePoints({}); setRoutePolyline([]); }}
        >
          <Ionicons name="navigate" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Modal de destination sans micro */}
      <Modal
        visible={destinationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDestinationModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: accentColorBg, borderRadius: 22, padding: 28, width: '88%', alignItems: 'center', shadowColor: accentColor, shadowOpacity: 0.10, shadowRadius: 12 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, color: accentColor, marginBottom: 14, letterSpacing: 0.5 }}>Où veux-tu aller ?</Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: accentColorLight, borderRadius: 12, padding: 12, width: '100%', marginBottom: 8, fontSize: 17, backgroundColor: '#fff', color: '#222', shadowColor: accentColor, shadowOpacity: 0.04, shadowRadius: 2 }}
              placeholder="Destination..."
              placeholderTextColor={accentColorLight}
              value={destinationInput}
              onChangeText={setDestinationInput}
              autoFocus
            />
            {/* Suggestions d'autocomplete */}
            {autocompleteError && (
              <Text style={{ color: 'red', marginBottom: 8 }}>{autocompleteError}</Text>
            )}
            {routeError && (
              <Text style={{ color: 'red', marginBottom: 8 }}>{routeError}</Text>
            )}
            {autocompleteResults.length > 0 && (
              <FlatList
                data={autocompleteResults}
                keyExtractor={item => item.place_id}
                style={{ maxHeight: 160, width: '100%', backgroundColor: '#fafaff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: accentColorLight, shadowColor: accentColor, shadowOpacity: 0.03, shadowRadius: 2 }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSelectSuggestion(item)} style={{ padding: 13, borderBottomWidth: 1, borderBottomColor: accentColorBg }}>
                    <Text style={{ color: accentColor, fontWeight: '500' }}>{item.description}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 }}>
              <TouchableOpacity onPress={startListening} style={{ backgroundColor: isListening ? accentColor : accentColorBg, borderRadius: 22, padding: 12, borderWidth: 1, borderColor: accentColorLight }}>
                <Ionicons name="mic" size={24} color={isListening ? '#fff' : accentColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDestinationSubmit} style={{ backgroundColor: accentColor, borderRadius: 22, padding: 12, borderWidth: 1, borderColor: accentColorLight }}>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {isListening && <Text style={{ marginTop: 12, color: accentColor, fontWeight: '500' }}>Parle maintenant…</Text>}
            {voiceError && <Text style={{ marginTop: 12, color: 'red', fontWeight: '500' }}>{voiceError}</Text>}
            {(isLoadingRoute || autocompleteLoading) && <ActivityIndicator style={{ marginTop: 12 }} color={accentColor} />}
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Affichage d'infos et bouton stop navigation */}
      {routeMode === 'navigating' && routeInfo && (
        <View style={{ position: 'absolute', bottom: 40, left: 24, right: 24, backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 4, zIndex: 100, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: accentColor }}>Navigation</Text>
          <Text>Durée estimée : {routeInfo.legs[0].duration.text} | Distance : {routeInfo.legs[0].distance.text}</Text>
          {/* Affichage de l'instruction courante avec icône */}
          {routeInfo.legs[0].steps && routeInfo.legs[0].steps[currentStepIndex] && (
            <View style={{ marginTop: 10, marginBottom: 6, alignItems: 'center' }}>
              <Ionicons name="navigate" size={32} color={accentColor} style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 16, color: accentColor, fontWeight: '700', textAlign: 'center' }}>
                {routeInfo.legs[0].steps[currentStepIndex].html_instructions.replace(/<[^>]+>/g, '')}
              </Text>
              <Text style={{ fontSize: 14, color: '#444', marginTop: 2, textAlign: 'center' }}>
                {routeInfo.legs[0].steps[currentStepIndex].distance.text} | {routeInfo.legs[0].steps[currentStepIndex].duration.text}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => { setRouteMode('idle'); setRoutePolyline([]); setRouteInfo(null); setRoutePoints({}); setCurrentStepIndex(0); Speech.stop(); }} style={{ marginTop: 8, alignSelf: 'flex-end', backgroundColor: accentColor, borderRadius: 12, padding: 8 }}>
            <Text style={{ color: '#fff' }}>Arrêter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
