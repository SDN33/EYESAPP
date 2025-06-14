// utils/map/directions.ts
import { decodePolyline } from './polyline';

/**
 * Appel à l'API Google Directions avec options
 */
export async function fetchRoute({
  start,
  end,
  setIsLoadingRoute,
  setRouteError,
  setRoutePolyline,
  setRouteInfo,
  setRouteMode,
  setShowRouteOptions,
  setLastRouteQuery,
  routeMode,
  routeOptions,
  onFail,
  forceIdle = true
}: {
  start: { latitude: number, longitude: number },
  end: { latitude: number, longitude: number },
  setIsLoadingRoute: (b: boolean) => void,
  setRouteError: (msg: string | null) => void,
  setRoutePolyline: (pts: any[]) => void,
  setRouteInfo: (info: any) => void,
  setRouteMode: (mode: string) => void,
  setShowRouteOptions: (b: boolean) => void,
  setLastRouteQuery: (q: any) => void,
  routeMode: string,
  routeOptions: { tolls: boolean, highways: boolean },
  onFail?: () => void,
  forceIdle?: boolean
}) {
  setIsLoadingRoute(true);
  setRouteError(null);
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0';
    let avoid = [];
    if (!routeOptions.tolls) avoid.push('tolls');
    if (!routeOptions.highways) avoid.push('highways');
    const avoidParam = avoid.length > 0 ? `&avoid=${avoid.join('|')}` : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=driving&traffic_model=best_guess&departure_time=now${avoidParam}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const points = decodePolyline(data.routes[0].overview_polyline.points);
      setRoutePolyline(points);
      setRouteInfo(data.routes[0]);
      if (forceIdle && routeMode !== 'navigating') {
        setRouteMode('idle');
        setShowRouteOptions(true);
      }
      setLastRouteQuery({ start, end });
      if (forceIdle && routeMode !== 'navigating') {
        setShowRouteOptions(true);
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
}
