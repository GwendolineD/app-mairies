"use client";

import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number;
  longitude: number;
  communeName?: string;
  zoom?: number;
  /** CSS height eg 320px or 40vh */
  className?: string;
};

/** Dynamic import this component from server pages (`ssr: false`) — Leaflet requiert le navigateur. */
export function MapViewCommune({
  latitude,
  longitude,
  communeName = "Centre communal",
  zoom = 13,
  className = "h-80 rounded-3xl overflow-hidden shadow-card border border-border/70",
}: Props) {
  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const position: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      className={className}
      center={position}
      zoom={zoom}
      scrollWheelZoom
      style={{ minHeight: 280 }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <Marker position={position}>
        <Popup>{communeName}</Popup>
      </Marker>
    </MapContainer>
  );
}
