// MapView.web.tsx : version web (MapLibre GL JS)
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocation } from "../../hooks/useLocation";

const OSM_STYLE = "https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"; // Style sombre, minimaliste, open source

export default function MapView() {
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
        el.innerHTML = `<svg width="28" height="28" style="transform:rotate(${location?.coords?.heading ?? 0}deg)" viewBox="0 0 24 24" fill="none" stroke="#A259FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`;
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(mapRef.current);
        (mapRef.current as any)._userMarker = marker;
      } else {
        marker.setLngLat([lon, lat]);
        // Update heading
        const el = marker.getElement();
        el.innerHTML = `<svg width="28" height="28" style="transform:rotate(${location?.coords?.heading ?? 0}deg)" viewBox="0 0 24 24" fill="none" stroke="#A259FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`;
      }
    }
  }, [lat, lon, location?.coords?.heading]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden", position: 'relative' }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {/* Bouton recentrer */}
      <button
        onClick={handleRecenter}
        style={{ position: 'absolute', bottom: 24, right: 18, zIndex: 10, background: '#23242A', borderRadius: 24, padding: 8, border: 'none', boxShadow: '0 2px 8px #0003', cursor: 'pointer' }}
        aria-label="Recentrer"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A259FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
      </button>
    </div>
  );
}
