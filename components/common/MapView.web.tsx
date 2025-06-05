// MapView.web.tsx : version web (Google Maps JS API) identique à la version mobile
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "../../hooks/useLocation";

const GOOGLE_API_KEY = "AIzaSyBmVBiIzMDvK9U6Xf3mHCo33KGLXeC8FK0";

export default function MapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [initDone, setInitDone] = useState(false);

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
      googleMap.current = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat, lng: lon },
        zoom: 17,
        mapTypeId: "roadmap",
        disableDefaultUI: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#181A20' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#181A20' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#888' }] },
          { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
          { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3A3D4D' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#5A5D6D' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#bbb' }] },
          { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#23242A' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#181A20' }] },
          { featureType: 'water', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
        ]
      });
      // Ajout de la couche trafic
      const trafficLayer = new (window as any).google.maps.TrafficLayer();
      trafficLayer.setMap(googleMap.current);
      // Ajout du marker utilisateur (triangle SVG)
      markerRef.current = new (window as any).google.maps.Marker({
        position: { lat, lng: lon },
        map: googleMap.current,
        icon: {
          url: getTriangleSVG(color),
          scaledSize: new (window as any).google.maps.Size(36, 36),
          anchor: new (window as any).google.maps.Point(18, 18)
        }
      });
      setInitDone(true);
      // Recentrage immersif 1s après le chargement initial
      setTimeout(() => {
        googleMap.current.setCenter({ lat, lng: lon });
        googleMap.current.setZoom(17);
        setIsFollowing(true);
      }, 1000);
    });
    // Cleanup
    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (googleMap.current) googleMap.current = null;
    };
  }, []);

  // Mise à jour position utilisateur et recentrage auto/manuel
  useEffect(() => {
    if (!googleMap.current || !markerRef.current || !location?.coords) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    markerRef.current.setPosition({ lat, lng: lon });
    if (isFollowing) {
      googleMap.current.setCenter({ lat, lng: lon });
    }
  }, [location?.coords?.latitude, location?.coords?.longitude, isFollowing]);

  // Recentrage immédiat si la position devient disponible après le premier rendu
  useEffect(() => {
    if (!googleMap.current || !location?.coords) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    googleMap.current.setCenter({ lat, lng: lon });
    googleMap.current.setZoom(17);
    setIsFollowing(true);
  }, [location?.coords?.latitude, location?.coords?.longitude]);

  // Fonction pour recentrer la carte (bouton)
  const handleRecenter = () => {
    if (!googleMap.current || !location?.coords) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;
    googleMap.current.setCenter({ lat, lng: lon });
    googleMap.current.setZoom(17);
    setIsFollowing(true);
  };

  // Désactive le suivi si l'utilisateur déplace la carte
  useEffect(() => {
    if (!googleMap.current) return;
    const listener = googleMap.current.addListener('dragstart', () => setIsFollowing(false));
    return () => listener && listener.remove();
  }, [initDone]);

  // Génère le SVG du triangle directionnel (identique mobile)
  function getTriangleSVG(color: string) {
    return `data:image/svg+xml;utf8,<svg width='36' height='36' viewBox='0 0 36 36' fill='none' xmlns='http://www.w3.org/2000/svg'><g><polygon points='18,4 32,32 18,24 4,32' fill='${encodeURIComponent(color)}'/><circle cx='18' cy='18' r='14' fill='none' stroke='white' stroke-width='2.5'/></g></svg>`;
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden", position: 'relative', paddingBottom: 80 }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {/* Bouton unique de recentrage, en haut à droite */}
      <button
        onClick={handleRecenter}
        style={{
          position: 'absolute',
          top: 7,
          right: 24,
          background: isFollowing ? color : '#23242A',
          borderRadius: 24,
          padding: 12,
          border: 'none',
          boxShadow: '0 2px 12px 0 #0003',
          zIndex: 100,
          cursor: 'pointer',
        }}
        aria-label="Recentrer la carte"
      >
        <svg width="28" height="28" viewBox="0 0 24 24">
          <polygon points="12,2 22,7 12,12 2,7" fill={isFollowing ? color : '#888'} />
          <polygon points="12,12 22,7 22,17 12,22" fill={isFollowing ? (color === '#A259FF' ? '#7C3AED' : '#3B82F6') : '#444'} />
          <polygon points="12,12 2,7 2,17 12,22" fill={isFollowing ? (color === '#A259FF' ? '#6D28D9' : '#2563EB') : '#222'} />
        </svg>
      </button>
    </div>
  );
}
