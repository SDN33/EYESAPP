// MapView.web.tsx : version web (Google Maps JS API)
import React, { useEffect, useRef } from "react";
import { useLocation } from "../../hooks/useLocation";

const GOOGLE_API_KEY = "AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0";

export default function MapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Helper pour charger Google Maps JS API dynamiquement
  function loadGoogleMapsScript(cb: () => void) {
    if (typeof window !== "undefined" && !(window as any).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}`;
      script.async = true;
      script.onload = cb;
      document.body.appendChild(script);
    } else if ((window as any).google) {
      cb();
    }
  }

  // Initialisation de la carte Google Maps
  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (!mapRef.current) return;
      const lat = location?.coords?.latitude ?? 48.8584;
      const lon = location?.coords?.longitude ?? 2.2945;
      googleMap.current = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat, lng: lon },
        zoom: 16,
        mapTypeId: "roadmap",
        disableDefaultUI: false,
        streetViewControl: false,
        fullscreenControl: false
      });
      // Ajout de la couche trafic
      const trafficLayer = new (window as any).google.maps.TrafficLayer();
      trafficLayer.setMap(googleMap.current);
      // Ajout du marker utilisateur
      markerRef.current = new (window as any).google.maps.Marker({
        position: { lat, lng: lon },
        map: googleMap.current,
        icon: {
          path: "M12 2L19 21L12 17L5 21L12 2Z",
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 1.2,
          anchor: new (window as any).google.maps.Point(12, 12)
        }
      });
    });
    // Cleanup
    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (googleMap.current) googleMap.current = null;
    };
  }, []);

  // Mise à jour position utilisateur et recentrage
  useEffect(() => {
    if (!googleMap.current || !markerRef.current || !location?.coords) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    markerRef.current.setPosition({ lat, lng: lon });
    googleMap.current.setCenter({ lat, lng: lon });
  }, [location?.coords?.latitude, location?.coords?.longitude]);

  // Recentrage sur demande (écoute l'event 'recenter-map')
  useEffect(() => {
    const recenterListener = () => {
      if (!googleMap.current || !location?.coords) return;
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      googleMap.current.setCenter({ lat, lng: lon });
    };
    window.addEventListener('recenter-map', recenterListener);
    return () => window.removeEventListener('recenter-map', recenterListener);
  }, [location?.coords]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden", position: 'relative' }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
