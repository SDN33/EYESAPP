// utils/roadInfo.ts

import Constants from 'expo-constants';

// API gratuite pour l'adresse : Nominatim (OpenStreetMap)
export async function getAddressFromCoords(lat: number, lon: number) {
  let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  // Utilise un proxy CORS uniquement sur web
  if (typeof window !== "undefined") {
    url = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  let headers: Record<string, string> = { 'Accept-Language': 'fr' };
  if (typeof window !== "undefined") {
    headers['User-Agent'] = 'MotoAngles/1.0';
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Erreur Nominatim');
    const data = await res.json();
    return data.address;
  } catch {
    return null;
  }
}

// Récupère la clé API Google depuis .env (Expo ou Node)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || (Constants?.expoConfig?.extra?.GOOGLE_API_KEY) || 'INSERER_VOTRE_CLE_API_ICI';

// API Google Roads pour la limitation de vitesse
const speedLimitCache: Record<string, { value: string | null, ts: number }> = {};

export async function getSpeedLimitFromCoords(lat: number, lon: number) {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (speedLimitCache[key] && Date.now() - speedLimitCache[key].ts < 10 * 60 * 1000) {
    return speedLimitCache[key].value;
  }
  // Google Roads API : nearestRoads puis speedLimits
  try {
    // 1. Trouver le point sur la route le plus proche
    const nearestUrl = `https://roads.googleapis.com/v1/nearestRoads?points=${lat},${lon}&key=${GOOGLE_API_KEY}`;
    const nearestRes = await fetch(nearestUrl);
    if (!nearestRes.ok) throw new Error('Erreur Google Roads nearestRoads');
    const nearestData = await nearestRes.json();
    if (!nearestData.snappedPoints || nearestData.snappedPoints.length === 0) {
      speedLimitCache[key] = { value: null, ts: Date.now() };
      return null;
    }
    const placeId = nearestData.snappedPoints[0].placeId;
    // 2. Récupérer la limitation de vitesse
    const speedUrl = `https://roads.googleapis.com/v1/speedLimits?placeId=${placeId}&key=${GOOGLE_API_KEY}`;
    const speedRes = await fetch(speedUrl);
    if (!speedRes.ok) throw new Error('Erreur Google Roads speedLimits');
    const speedData = await speedRes.json();
    let value = null;
    if (speedData.speedLimits && speedData.speedLimits.length > 0) {
      value = speedData.speedLimits[0].speedLimit;
    }
    speedLimitCache[key] = { value, ts: Date.now() };
    return value;
  } catch {
    if (speedLimitCache[key]) return speedLimitCache[key].value;
    return null;
  }
}
