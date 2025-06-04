// MapView.web.tsx : version web (MapLibre GL JS)
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocation } from "../../hooks/useLocation";
// Style dark open source CartoBasemap, compatible MapLibre, sans clé ni sprite
import type { StyleSpecification } from "maplibre-gl";

const DARK_STYLE: StyleSpecification = {
  version: 8,
  name: "Dark Minimal (No Sprite)",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#181A20" } },
    { id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }
  ]
};

export default function MapView({ color = "#A259FF" }: { color?: string }) {
  const { location } = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [centered, setCentered] = useState(true);
  const lat = location?.coords?.latitude ?? 48.8584;
  const lon = location?.coords?.longitude ?? 2.2945;

  // Gestion du heading boussole (rotor) sur le web
  const [compassHeading, setCompassHeading] = React.useState<number | null>(null);
  React.useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent) {
      // event.alpha = 0 (nord), 90 (est), 180 (sud), 270 (ouest)
      if (typeof event.alpha === 'number') {
        setCompassHeading(360 - event.alpha); // Inverse pour correspondre au GPS
      }
    }
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
      };
    }
  }, []);

  // Recentrage
  const handleRecenter = () => {
    setCentered(true);
    if (mapRef.current && location?.coords) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 16, speed: 1.2 });
    }
  };

  useEffect(() => {
    if (!mapRef.current && mapContainer.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: DARK_STYLE,
        center: [lon, lat],
        zoom: 16,
        bearing: location?.coords?.heading ?? 0, // Ajout du cap initial
        attributionControl: false,
        minZoom: 10,
        maxZoom: 19,
      });
      mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapRef.current.on('dragstart', () => setCentered(false));
      mapRef.current.on('zoomstart', () => setCentered(false));
    }
    if (mapRef.current && location?.coords && centered) {
      // Mode conduite : recentre avec offset vertical et rotation selon heading, zoom dynamique
      const offset = 200; // px, plus loin devant
      const center = mapRef.current.project([lon, lat]);
      center.y += offset;
      const newCenter = mapRef.current.unproject(center);
      // Zoom dynamique selon la vitesse (plus rapide = plus loin)
      const speed = location?.coords?.speed || 0;
      // Choix du heading : GPS si vitesse > 2 km/h, sinon boussole
      let heading = location?.coords?.heading;
      if (!heading || speed * 3.6 < 2) heading = compassHeading ?? heading ?? 0;
      let zoom = 17 - (speed / 60);
      if (zoom < 15) zoom = 15;
      if (zoom > 17) zoom = 17;
      mapRef.current.flyTo({
        center: [newCenter.lng, newCenter.lat],
        zoom,
        bearing: heading,
        pitch: 65, // Effet 3D plus marqué
        speed: 1.2,
        essential: true
      });
    }
    // Cleanup: remove marker first, then map
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, centered, location?.coords?.heading]);

  useEffect(() => {
    // Nettoyage robuste du marker à chaque update ou unmount
    // Correction : ce useEffect ne doit dépendre de rien (array vide) pour éviter tout effet de bord React
    return () => {
      if (markerRef.current) {
        try {
          const el = markerRef.current.getElement();
          if (el && el.parentNode && el.parentNode.contains(el)) {
            markerRef.current.remove();
          }
        } catch (e) {
          // Ignore si déjà supprimé
        }
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !location?.coords) return;
    // Ajout ou update du marker animé
    if (!markerRef.current) {
      const el = document.createElement('div');
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.background = 'rgba(30,30,40,0.95)';
      el.style.borderRadius = '50%';
      // Couleur du marker selon le mode
      const markerColor = color === '#A259FF' ? '#A259FF' : '#2979FF';
      const markerShadow = color === '#A259FF' ? '#A259FF99' : '#2979FF99';
      el.style.boxShadow = `0 2px 12px ${markerShadow}, 0 0 0 4px #23242A`;
      el.style.border = `2px solid ${markerColor}`;
      el.innerHTML = `
        <svg width="28" height="28" style="transform:rotate(${location?.coords?.heading ?? 0}deg)" viewBox="0 0 24 24" fill="${markerColor}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 19 21 12 17 5 21 12 2"/>
        </svg>
      `;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat([lon, lat]);
      // Update heading et couleur
      const markerColor = color === '#A259FF' ? '#A259FF' : '#2979FF';
      const markerShadow = color === '#A259FF' ? '#A259FF99' : '#2979FF99';
      const el = markerRef.current.getElement();
      el.innerHTML = `
        <svg width="28" height="28" style="transform:rotate(${location?.coords?.heading ?? 0}deg)" viewBox="0 0 24 24" fill="${markerColor}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 19 21 12 17 5 21 12 2"/>
        </svg>
      `;
      el.style.background = 'rgba(30,30,40,0.95)';
      el.style.borderRadius = '50%';
      el.style.boxShadow = `0 2px 12px ${markerShadow}, 0 0 0 4px #23242A`;
      el.style.border = `2px solid ${markerColor}`;
    }
  }, [lat, lon, location?.coords?.heading, color]);

  useEffect(() => {
    const recenterListener = () => handleRecenter();
    window.addEventListener('recenter-map', recenterListener);
    return () => window.removeEventListener('recenter-map', recenterListener);
  }, [lat, lon, location?.coords]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden", position: 'relative' }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
