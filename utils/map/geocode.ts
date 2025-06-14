// utils/map/geocode.ts
import { toLatLng } from '../latLng';

/**
 * Recherche les coordonnées d'une adresse via Google Geocoding
 */
export async function geocodeAddress(address: string, setIsLoadingRoute: (b: boolean) => void) {
  setIsLoadingRoute(true);
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const loc = data.results[0].geometry.location;
      return toLatLng(loc);
    }
  } catch (e) {}
  setIsLoadingRoute(false);
  return null;
}
