// utils/geoHelpers.ts

/**
 * Transforme un objet Google {lat, lng} en {latitude, longitude} pour react-native-maps
 */
export function toLatLng(obj: { lat: number, lng: number }) {
  return { latitude: obj.lat, longitude: obj.lng };
}
