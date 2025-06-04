// MapView.web.tsx : version web (MapLibre GL JS)
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocation } from "../../hooks/useLocation";
// Style dark open source CartoBasemap, compatible MapLibre, sans clé ni sprite
const OSM_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [centered, setCentered] = useState(true);
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;

  // Recentrage
  const handleRecenter = () => {
    setCentered(true);
    if (mapRef.current && location?.coords) {
      mapRef.current.setCenter([lon, lat]);
      mapRef.current.setZoom(16);
    }
  };

  useEffect(() => {
    if (!mapRef.current && mapContainer.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: OSM_STYLE,
        center: [lon, lat],
        zoom: 16,
        attributionControl: false,
      });
      mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current.on('dragstart', () => setCentered(false));
      mapRef.current.on('zoomstart', () => setCentered(false));
    }
    if (mapRef.current && location?.coords && centered) {
      mapRef.current.setCenter([lon, lat]);
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lon, centered]);

  useEffect(() => {
    if (mapRef.current && location?.coords) {
      // Ajout ou update du marker
      let marker = (mapRef.current as any)._userMarker;
      if (!marker) {
        const el = document.createElement('div');
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.innerHTML = `<svg width="28" height="28" style="transform:rotate(${location?.coords?.heading ?? 0}deg)" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`;
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(mapRef.current);
        (mapRef.current as any)._userMarker = marker;
      } else {
        marker.setLngLat([lon, lat]);
        // Update heading
        const el = marker.getElement();
        el.innerHTML = `<svg width="28" height="28" style="transform:rotate(${location?.coords?.heading ?? 0}deg)" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`;
        // Toujours réajouter le marker si jamais il a été détaché
        if (!(marker as any)._map) {
          marker.addTo(mapRef.current);
        }
      }
    }
  }, [lat, lon, location?.coords?.heading, mapRef.current, color]);

  useEffect(() => {
    const recenterListener = () => handleRecenter();
    window.addEventListener('recenter-map', recenterListener);
    return () => window.removeEventListener('recenter-map', recenterListener);
  }, [lat, lon, location?.coords]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden", position: 'relative' }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {/* Bouton recentrer intégré supprimé, seul le bouton custom parent reste */}
    </div>
  );
}
