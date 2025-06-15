// MapView.tsx : version mobile (Expo/React Native)
import React, { useRef, useState, useEffect } from "react";
import sanitizeHtml from "sanitize-html";
import { View, TouchableOpacity, Platform, StatusBar, Text, Pressable, Animated as RNAnimated, FlatList, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useLocation } from "../../hooks/useLocation";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Circle } from 'react-native-maps';
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
import { toLatLng } from '../../utils/latLng';
import { formatDistance } from '../../utils/formatDistance';
import { TraceRecorder } from '../../utils/traceRecorder';
import { decodePolyline } from '../../utils/map/polyline';
import { geocodeAddress } from '../../utils/map/geocode';
import { fetchRoute } from '../../utils/map/directions';
import { debounce } from '../../utils/map/debounce';
import { createFetchAutocomplete } from '../../utils/map/autocomplete';
import MapMuteButton from './MapMuteButton';
import { useAuth } from '../../hooks/useAuth';
import { getItem, setItem } from '../../services/storage';
import { useUserId } from '../../hooks/useUserId';

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

// Ajout d'un traceur global (hors React)
const traceRecorder = new TraceRecorder();

export default function CustomMapView({ color = "#A259FF", mode = 'moto', nearbyUsers = [], userId, addressVisible = true, trafficAlertActive = false }: { color?: string, mode?: MapMode, nearbyUsers?: Array<{ id: string, name: string, lat: number, lng: number, mode?: string }>, userId: string, addressVisible?: boolean, trafficAlertActive?: boolean }) {
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
  // Ajout des états pour le choix d'itinéraire
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [routeOptions, setRouteOptions] = useState({ tolls: true, highways: true });
  const [lastRouteQuery, setLastRouteQuery] = useState<{ start?: { latitude: number, longitude: number }, end?: { latitude: number, longitude: number } } | null>(null);
  const [muted, setMuted] = useState(false);
  const { user } = useAuth();
  const myId = useUserId();

  // Sauvegarde de l'itinéraire recherché (pour user logué)
  async function saveRecentItinerary(address: string) {
    if (!user) return;
    try {
      const userId = myId;
      const key = `recent_itineraries_${userId}`;
      const existing = await getItem(key);
      let list = [];
      if (existing) {
        list = JSON.parse(existing);
      }
      // Ajoute en tête, évite les doublons, limite à 5
      list = [address, ...list.filter((a: string) => a !== address)].slice(0, 5);
      await setItem(key, JSON.stringify(list));
      setRecentItineraries(list);
    } catch {}
  }

  // Récupération des itinéraires récents (pour user logué)
  const [recentItineraries, setRecentItineraries] = useState<string[]>([]);
  useEffect(() => {
    async function fetchRecents() {
      if (!user) return setRecentItineraries([]);
      const userId = myId;
      const key = `recent_itineraries_${userId}`;
      const existing = await getItem(key);
      if (existing) setRecentItineraries(JSON.parse(existing));
      else setRecentItineraries([]);
    }
    fetchRecents();
  }, [user, destinationModalVisible]);

  // DEBUG : log user object et clé utilisée
  useEffect(() => {
    if (user) {
      const userId = myId;
      console.log('[DEBUG][MapView] user:', user);
      console.log('[DEBUG][MapView] userId utilisé pour stockage:', userId);
    }
  }, [user]);

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

  // Mémoïsation du calcul de la caméra
  const camera = React.useMemo(() => lat && lon ? {
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
  } : undefined, [lat, lon, location?.coords?.speed, location?.coords?.heading, headingSensor]);

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

  // Marker de l'utilisateur courant (toujours affiché, mode et couleur selon l'écran)
  const MyMarker = () => lat && lon ? (
    <>
      {/* Cercle de précision GPS */}
      {location?.coords?.accuracy && (
        <Circle
          center={{ latitude: lat, longitude: lon }}
          radius={location.coords.accuracy}
          strokeColor={accentColor}
          fillColor={accentColor + '33'} // Opacité 20%
          zIndex={998}
        />
      )}
      <Marker
        coordinate={{ latitude: lat, longitude: lon }}
        title={user?.name || 'Moi'}
        description={mode === 'auto' ? 'auto' : 'moto'}
        pinColor={accentColor}
        tracksViewChanges={true}
        zIndex={999}
      >
        <Ionicons
          name={mode === 'auto' ? 'car' : 'bicycle'}
          size={32}
          color={accentColor}
        />
      </Marker>
    </>
  ) : null;

  // Mémoïsation des markers des utilisateurs proches (hors moi, tous modes)
  const filteredNearbyUsers = React.useMemo(() =>
    nearbyUsers.filter(user => user.id !== userId),
    [nearbyUsers, userId]
  );
  const nearbyUserMarkers = React.useMemo(
    () => filteredNearbyUsers.map(user => <NearbyUserMarker key={user.id + '-' + user.mode} user={user} />),
    [filteredNearbyUsers]
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

  // Ajout pour gestion du recentrage auto après 10s sans interaction
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  // Handler appelé à chaque interaction utilisateur sur la carte
  const handleUserInteraction = () => {
    setManualRecenter(true);
    setLastInteraction(Date.now());
  };

  // Timer pour recentrer auto après 10s sans interaction
  useEffect(() => {
    if (!manualRecenter) return;
    const interval = setInterval(() => {
      if (manualRecenter && Date.now() - lastInteraction > 10000) {
        setManualRecenter(false); // Recentrage auto
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [manualRecenter, lastInteraction]);

  // Zoom dynamique lors du croisement d'un autre utilisateur
  useEffect(() => {
    if (!mapRef.current || !nearbyUsers || !userId || !location?.coords) return;
    if (trafficAlertActive) return; // NE PAS ZOOMER si notif trafic affichée
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
      mapRef.current.animateCamera({ zoom: 4 }, { duration: 800 }); // Zoom out continent
    }
  }, [nearbyUsers, userId, location, trafficAlertActive]);

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

  // Appel à l'API Google Directions avec options
  const fetchRoute = async (start: { latitude: number, longitude: number }, end: { latitude: number, longitude: number }, onFail?: () => void, opts = routeOptions, forceIdle = true) => {
    setIsLoadingRoute(true);
    setRouteError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
      let avoid = [];
      if (!opts.tolls) avoid.push('tolls');
      if (!opts.highways) avoid.push('highways');
      const avoidParam = avoid.length > 0 ? `&avoid=${avoid.join('|')}` : '';
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=driving&traffic_model=best_guess&departure_time=now${avoidParam}&key=${apiKey}`;
      console.log('Directions API URL:', url); // LOG URL
      const response = await fetch(url);
      const data = await response.json();
      console.log('Directions API response:', JSON.stringify(data)); // LOG REPONSE
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRoutePolyline(points);
        setRouteInfo(data.routes[0]);
        // Ne forcer le mode idle que si demandé ET si on n'est pas déjà en navigation
        if (forceIdle && routeMode !== 'navigating') {
          setRouteMode('idle');
          setShowRouteOptions(true);
        }
        setLastRouteQuery({ start, end });
        // Garder la modale ouverte pour montrer les options seulement si pas en navigation
        if (forceIdle && routeMode !== 'navigating') {
          setDestinationModalVisible(true);
        }
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

  // Handler pour sélectionner un point sur la carte (point de départ = position GPS)
  const handleMapPress = React.useCallback((e: any) => {
    if (routeMode === 'selecting') {
      const end = e.nativeEvent.coordinate;
      const start = lat && lon ? { latitude: lat, longitude: lon } : null;
      setRoutePoints({ start, end });
      if (start && end) fetchRoute(start, end);
    }
  }, [routeMode, lat, lon, fetchRoute]);

  // Lancement du calcul d'itinéraire après saisie ou dictée (utilise utilitaire)
  const handleDestinationSubmit = async () => {
    if (!destinationInput) return;
    setIsLoadingRoute(true);
    setRouteError(null);
    const start = lat && lon ? { latitude: lat, longitude: lon } : null;
    const dest = await geocodeAddress(destinationInput, setIsLoadingRoute);
    if (dest && start) {
      setRoutePoints({ start, end: dest });
      fetchRoute(
        start,
        dest,
        () => setDestinationModalVisible(true),
        routeOptions,
        true
      );
      // Sauvegarde de l'itinéraire récent
      saveRecentItinerary(destinationInput);
    } else {
      setRouteError('Impossible de trouver la destination ou la position de départ.');
      setDestinationModalVisible(true);
    }
    setIsLoadingRoute(false);
  };

  // Recherche d'adresses avec Google Places Autocomplete (debounced, utilitaire)
  const fetchAutocomplete = React.useCallback(
    createFetchAutocomplete(setAutocompleteLoading, setAutocompleteError, setAutocompleteResults),
    []
  );

  // Sur changement de texte, lancer l'autocomplete (debounced)
  useEffect(() => {
    if (destinationInput.length > 2 && destinationModalVisible) {
      fetchAutocomplete(destinationInput);
    } else {
      setAutocompleteResults([]);
    }
  }, [destinationInput, destinationModalVisible, fetchAutocomplete]);

  // Sélection d'une suggestion
  const handleSelectSuggestion = React.useCallback(async (item: any) => {
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
      const end = loc ? toLatLng(loc) : null;
      if (end && start) {
        setRoutePoints({ start, end });
        fetchRoute(start, end, () => setDestinationModalVisible(true));
      } else {
        setRouteError('Position de départ inconnue.');
        setDestinationModalVisible(true);
      }
    } catch (e) {
      setRouteError('Erreur lors de la récupération de la destination.');
      setDestinationModalVisible(true);
    }
    setIsLoadingRoute(false);
  }, [lat, lon, fetchRoute]);

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
    if (
      routeMode === 'navigating' &&
      routeInfo &&
      routeInfo.legs &&
      routeInfo.legs[0].steps &&
      routeInfo.legs[0].steps[currentStepIndex]
    ) {
      const step = routeInfo.legs[0].steps[currentStepIndex];
      const instruction = sanitizeHtml(step.html_instructions, { allowedTags: [], allowedAttributes: {} });
      if (!muted) {
        Speech.speak(instruction, { language: 'fr-FR' });
      }
    }
  }, [currentStepIndex, routeMode, routeInfo, muted]);

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
      // Stoppe toute session précédente avant de démarrer
      await Voice.stop();
      await Voice.start('fr-FR');
    } catch (e) {
      setIsListening(false);
      if (e && e.message && e.message.includes('permission')) {
        setVoiceError("Permission micro refusée. Activez le micro dans les réglages de l'app.");
      } else {
        setVoiceError("Impossible de démarrer la reconnaissance vocale.");
      }
    }
  };

  // Fonction pour valider le trajet et démarrer la navigation
  const handleValidateRoute = (options = routeOptions) => {
    console.log('[MapView] ✅ Démarrage navigation avec options:', options);
    console.log('[MapView] ✅ routeInfo avant navigation:', !!routeInfo);
    console.log('[MapView] ✅ showRouteOptions avant:', showRouteOptions);
    traceRecorder.start();
    setRouteMode('navigating');
    setDestinationModalVisible(false);
    setShowRouteOptions(false);
    console.log('[MapView] ✅ Navigation lancée - mode devrait être navigating');
  };

  // Debug pour vérifier l'état de la navigation
  useEffect(() => {
    console.log('[MapView] 🔄 routeMode changed to:', routeMode);
    console.log('[MapView] 🔄 routeInfo exists:', !!routeInfo);
    console.log('[MapView] 🔄 showRouteOptions:', showRouteOptions);
    console.log('[MapView] 🔄 Should show nav bar:', routeMode === 'navigating' && !!routeInfo);
  }, [routeMode, routeInfo, showRouteOptions]);

  // Gestion des useEffect pour les options d'itinéraire
  useEffect(() => {
    console.log('[MapView] 🔄 destinationModalVisible changed to:', destinationModalVisible);
    if (!destinationModalVisible) {
      console.log('[MapView] 🔄 Modal fermée - remise à zéro showRouteOptions');
      setShowRouteOptions(false);
    }
  }, [destinationModalVisible]);

  // Recalcul de l'itinéraire quand les options changent (seulement si pas en navigation)
  useEffect(() => {
    console.log('[MapView] 🔁 Recalcul useEffect triggered:', {
      showRouteOptions,
      routeMode,
      hasQuery: !!(lastRouteQuery?.start && lastRouteQuery?.end),
      isLoading: isLoadingRoute
    });

    if (showRouteOptions && routeMode !== 'navigating' && lastRouteQuery?.start && lastRouteQuery?.end && !isLoadingRoute) {
      console.log('[MapView] 🔁 Lancement recalcul itinéraire...');
      const timer = setTimeout(() => {
        fetchRoute(lastRouteQuery.start, lastRouteQuery.end, undefined, routeOptions, true);
      }, 500); // debounce pour éviter trop d'appels
      return () => clearTimeout(timer);
    }
  }, [routeOptions.tolls, routeOptions.highways, showRouteOptions, routeMode]);

  // Ajout d'un Animated.Value pour la position Y de la barre navigation
  const [navBoxY] = useState(new RNAnimated.Value(0));

  // Animation de la barre navigation selon la prop addressVisible
  useEffect(() => {
    RNAnimated.timing(navBoxY, {
      toValue: addressVisible ? 0 : 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [addressVisible]);

  useEffect(() => {
    if (muted) {
      Speech.stop(); // Stoppe immédiatement toute lecture vocale si mute activé
    }
  }, [muted]);

  // Log détaillé pour debug : vérifier la liste des users proches et leur mode
  useEffect(() => {
    console.log('[MapView][Debug] nearbyUsers:', nearbyUsers.map(u => ({id: u.id, mode: u.mode, name: u.name})));
  }, [nearbyUsers]);

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#181A20' : '#f6f7fa' }}>
      <MapView
        // key supprimé pour éviter le remount lors du changement de mode
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
        onPanDrag={handleUserInteraction}
        onRegionChange={handleUserInteraction}
        camera={manualRecenter ? undefined : camera}
        onPress={handleMapPress}
      >
        {/* Marker de l'utilisateur courant */}
        {MyMarker()}
        {/* Markers des utilisateurs proches */}
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
        <RNAnimated.View
          style={{
            position: 'absolute',
            bottom: 80,
            right: 24,
            backgroundColor: accentColor,
            borderRadius: 32,
            padding: 16,
            shadowColor: accentColor,
            shadowOpacity: 0.18,
            shadowRadius: 8,
            zIndex: 100,
            transform: [
              {
                translateY: navBoxY.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 50], // 50px plus bas quand address non visible
                })
              }
            ],
            opacity: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => { setDestinationModalVisible(true); setRouteMode('selecting'); setRoutePoints({}); setRoutePolyline([]); }}
          >
            <Ionicons name="navigate" size={28} color="#fff" />
          </TouchableOpacity>
        </RNAnimated.View>
      )}
      {/* Modal de destination en bas de page */}
      <Modal
        visible={destinationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setDestinationModalVisible(false); setRouteMode('idle'); }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* Overlay clickable pour fermer */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => { setDestinationModalVisible(false); setRouteMode('idle'); }}
          />
          {/* Contenu du modal en bas */}
          <View style={{ 
            backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#fff',
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            padding: 24,
            paddingBottom: 40,
            maxHeight: '85%',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8
          }}>
            <TouchableOpacity
              onPress={() => { setDestinationModalVisible(false); setRouteMode('idle'); }}
              style={{ 
                position: 'absolute', 
                top: 16, 
                right: 16, 
                backgroundColor: accentColorLight, 
                borderRadius: 18, 
                padding: 8, 
                zIndex: 10 
              }}
            >
              <Ionicons name="close" size={20} color={accentColor} />
            </TouchableOpacity>
            <Text style={{ 
              fontWeight: 'bold', 
              fontSize: 22, 
              color: accentColor, 
              marginBottom: 20, 
              letterSpacing: 0.5,
              textAlign: 'center' 
            }}>Où veux-tu aller ?</Text>
            <TextInput
              style={{ 
                borderWidth: 1.5, 
                borderColor: accentColorLight, 
                borderRadius: 12, 
                padding: 16, 
                fontSize: 17, 
                backgroundColor: colorScheme === 'dark' ? '#374151' : '#fff', 
                color: colorScheme === 'dark' ? '#fff' : '#222',
                marginBottom: 12
              }}
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
            {/* Affichage du résumé itinéraire et options toujours visibles si routeInfo existe et la modale est ouverte */}
            {(routePolyline.length > 0 && routeInfo && destinationModalVisible) && (
              <View style={{ 
                marginTop: 18, 
                backgroundColor: colorScheme === 'dark' ? '#374151' : '#fff', 
                borderRadius: 12, 
                padding: 16,
                borderWidth: 1, 
                borderColor: accentColorLight 
              }}>
                <Text style={{ fontWeight: 'bold', color: accentColor, fontSize: 16, marginBottom: 8 }}>Itinéraire trouvé</Text>
                <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#d1d5db' : '#666', marginBottom: 2 }}>
                  Arrivée : {routeInfo.legs[0].end_address}
                </Text>
                <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#d1d5db' : '#666', marginBottom: 16 }}>
                  Durée : {routeInfo.legs[0].duration.text.replace('hours', 'h').replace('hour', 'h').replace('mins', 'min')} | Distance : {formatDistance(routeInfo.legs[0].distance.text)}
                </Text>
                {/* Options d'itinéraire */}
                <Text style={{ fontWeight: 'bold', color: accentColor, fontSize: 15, marginBottom: 12 }}>Options d'itinéraire</Text>
                <TouchableOpacity 
                  onPress={() => setRouteOptions(o => ({ ...o, tolls: !o.tolls }))} 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                >
                  <Ionicons 
                    name={routeOptions.tolls ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={accentColor} 
                    style={{ marginRight: 10 }} 
                  />
                  <Text style={{ color: colorScheme === 'dark' ? '#d1d5db' : '#444', fontSize: 15 }}>Autoriser les péages</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setRouteOptions(o => ({ ...o, highways: !o.highways }))} 
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                >
                  <Ionicons 
                    name={routeOptions.highways ? 'checkbox' : 'square-outline'} 
                    size={22} 
                    color={accentColor} 
                    style={{ marginRight: 10 }} 
                  />
                  <Text style={{ color: colorScheme === 'dark' ? '#d1d5db' : '#444', fontSize: 15 }}>Autoriser les autoroutes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    console.log('[MapView] 🚀 Bouton Démarrer la navigation cliqué');
                    handleValidateRoute();
                  }}
                  style={{ 
                    backgroundColor: accentColor, 
                    borderRadius: 12, 
                    paddingVertical: 14, 
                    paddingHorizontal: 32, 
                    alignSelf: 'center',
                    shadowColor: accentColor, 
                    shadowOpacity: 0.20, 
                    shadowRadius: 6 
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Démarrer la navigation</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Affichage incitatif ou liste des itinéraires */}
            {user ? (
              recentItineraries.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#888', fontSize: 14, marginBottom: 4, textAlign: 'center' }}>Derniers itinéraires recherchés :</Text>
                  {recentItineraries.map((it, idx) => (
                    <TouchableOpacity key={it+idx} onPress={() => setDestinationInput(it)} style={{ paddingVertical: 6 }}>
                      <Text style={{ color: accentColor, fontSize: 15, textAlign: 'center' }}>{it}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              <Text style={{ color: '#888', fontSize: 14, marginTop: 10, textAlign: 'center' }}>
                Connectez-vous pour retrouver vos derniers itinéraires récents et suggestions personnalisées.
              </Text>
            )}
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* Affichage d'infos et bouton stop navigation */}
      {routeMode === 'navigating' && routeInfo && (
        <RNAnimated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 101,
            bottom: 40,
            transform: [
              {
                translateY: navBoxY.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-32, 0], // -32 = juste au-dessus de la div adresse, 0 = tout en bas
                })
              }
            ],
            opacity: 1,
          }}
        >
          <View style={{
            backgroundColor: colorScheme === 'dark' ? '#23242A' : '#fff',
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 26,
            shadowColor: colorScheme === 'dark' ? '#000' : accentColor,
            shadowOpacity: 0.13,
            shadowRadius: 8,
            minWidth: 180,
            maxWidth: 320,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colorScheme === 'dark' ? '#333' : '#ececec',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12
          }}>
            <Ionicons name="navigate" size={22} color={accentColor} style={{ marginRight: 8 }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: accentColor, marginBottom: 2 }}>Navigation</Text>
              <Text style={{ fontSize: 14, color: colorScheme === 'dark' ? '#f3f4f6' : '#444', marginBottom: 2 }}>
                {formatDistance(routeInfo.legs[0].distance.text)}
                {'  '}|  {routeInfo.legs[0].duration.text.replace('hours', 'h').replace('hour', 'h').replace('mins', 'min')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setRouteMode('idle'); setRoutePolyline([]); setRouteInfo(null); setRoutePoints({}); setCurrentStepIndex(0); Speech.stop(); }} style={{ marginLeft: 8, backgroundColor: accentColor, borderRadius: 10, padding: 7, alignSelf: 'flex-start' }}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </RNAnimated.View>
      )}
      {/* Boutons overlays en haut à gauche */}
      {routeMode === 'navigating' && (
        <View style={{ position: 'absolute', top: 12, left: 62, flexDirection: 'row', alignItems: 'center', zIndex: 30 }}>
          <MapMuteButton muted={muted} onToggle={() => setMuted(m => !m)} />
        </View>
      )}
    </View>
  );
}