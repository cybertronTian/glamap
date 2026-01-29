import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "wouter";
import { Profile, Service } from "@shared/schema";
import L from "leaflet";
import { Star, MapPin } from "lucide-react";
import { Button } from "./ui/button";

// Custom pink marker icon matching the primary button color
const PinkIcon = L.divIcon({
  className: 'custom-pink-marker',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#e07a9e"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

// Highlighted marker icon (larger, with glow effect)
const HighlightedPinkIcon = L.divIcon({
  className: 'custom-pink-marker highlighted',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="38" height="56" style="filter: drop-shadow(0 0 8px #e07a9e) drop-shadow(0 0 16px #e07a9e);">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#e07a9e"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `,
  iconSize: [38, 56],
  iconAnchor: [19, 56],
  popupAnchor: [0, -56],
});

// Helper to update map center when props change
function MapController({ center, zoom, isVisible }: { center: [number, number]; zoom: number; isVisible?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        console.error("Map invalidate error:", err);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    if (!isVisible) return;
    const timeout = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (err) {
        console.error("Map invalidate error:", err);
      }
    }, 120);
    return () => clearTimeout(timeout);
  }, [isVisible, map]);

  useEffect(() => {
    try {
      if (center && Array.isArray(center) && center.length === 2 && 
          typeof center[0] === 'number' && typeof center[1] === 'number' &&
          !isNaN(center[0]) && !isNaN(center[1])) {
        map.flyTo(center as L.LatLngExpression, zoom, { duration: 2 });
        map.invalidateSize();
      }
    } catch (err) {
      console.error("Map flyTo error:", err);
    }
  }, [center, zoom, map]);
  return null;
}

interface MapProps {
  profiles: (Profile & { services: Service[] })[];
  selectedId?: number;
  hoveredProfileId?: number | null;
  center?: [number, number];
  zoom?: number;
  isVisible?: boolean;
}

export default function Map({ profiles, selectedId, hoveredProfileId, center = [-33.8688, 151.2093], zoom = 12, isVisible = true }: MapProps) {
  // Filter out mobile providers and profiles with invalid coordinates
  // Only show providers who have a fixed location on the map
  const validProfiles = profiles.filter((p) => {
    const lat = typeof p.latitude === "number" ? p.latitude : Number(p.latitude);
    const lng = typeof p.longitude === "number" ? p.longitude : Number(p.longitude);
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      p.locationType !== "mobile"
    );
  });
  
  const validCenter: [number, number] =
    center &&
    Array.isArray(center) &&
    center.length === 2 &&
    typeof center[0] === "number" &&
    typeof center[1] === "number" &&
    Number.isFinite(center[0]) &&
    Number.isFinite(center[1])
      ? center
      : [-33.8688, 151.2093];

  return (
    <div className="w-full h-full rounded-none md:rounded-3xl overflow-hidden shadow-inner border border-border/50 relative z-0">
      <MapContainer 
        center={validCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={validCenter} zoom={zoom} isVisible={isVisible} />
        
        {validProfiles.map((profile) => {
          const lat = typeof profile.latitude === "number" ? profile.latitude : Number(profile.latitude);
          const lng = typeof profile.longitude === "number" ? profile.longitude : Number(profile.longitude);
          return (
          <Marker 
            key={profile.id} 
            position={[lat, lng]}
            icon={hoveredProfileId === profile.id ? HighlightedPinkIcon : PinkIcon}
            zIndexOffset={hoveredProfileId === profile.id ? 1000 : 0}
          />
          
        );
        })}
      </MapContainer>
    </div>
  );
}
