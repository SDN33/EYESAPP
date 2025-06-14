// utils/latLng.ts
// Utilitaire pour convertir {lat, lng} en {latitude, longitude}

export function toLatLng(obj: { lat: number; lng: number }): { latitude: number; longitude: number } {
  return {
    latitude: obj.lat,
    longitude: obj.lng,
  };
}
