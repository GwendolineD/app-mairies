"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  LEAFLET_MARKER_ICONS,
  MAP_TILE_URL,
} from "@/lib/constants/assets";
import {
  createAnnouncementPinIcon,
  type AnnouncementPinSize,
} from "@/lib/utils/announcement-map-pin";
import {
  getCategoryColorHex,
  getCategoryMapPinUrl,
} from "@/lib/constants/announcement-categories";

/**
 * Recomputes the map size after mount and whenever the container resizes.
 * Prevents missing tiles when the map mounts inside an element whose size
 * settles late (eg a modal that animates open).
 */
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => map.invalidateSize();

    const raf = requestAnimationFrame(invalidate);
    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

type Props = {
  latitude: number;
  longitude: number;
  communeName?: string;
  categorySlug?: string;
  mapPinUrl?: string | null;
  colorHex?: string;
  pinSize?: AnnouncementPinSize;
  zoom?: number;
  /** CSS height eg 320px or 40vh */
  className?: string;
};

/** Dynamic import this component from server pages (`ssr: false`) — Leaflet requires the browser. */
export function MapViewCommune({
  latitude,
  longitude,
  communeName = "Centre communal",
  categorySlug,
  mapPinUrl,
  colorHex,
  pinSize = "default",
  zoom = 13,
  className = "h-80 rounded-3xl overflow-hidden shadow-card border border-border/70",
}: Props) {
  useEffect(() => {
    const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICONS);
  }, []);

  const position: [number, number] = [latitude, longitude];
  const markerIcon = useMemo(() => {
    const resolvedMapPinUrl =
      mapPinUrl ?? (categorySlug ? getCategoryMapPinUrl(categorySlug) : null);
    const resolvedColorHex =
      colorHex ?? (categorySlug ? getCategoryColorHex(categorySlug) : "#A8A8A8");

    if (!categorySlug && mapPinUrl == null && colorHex == null) {
      return undefined;
    }

    return createAnnouncementPinIcon(
      {
        mapPinUrl: resolvedMapPinUrl,
        colorHex: resolvedColorHex,
      },
      false,
      pinSize,
    );
  }, [categorySlug, colorHex, mapPinUrl, pinSize]);

  return (
    <MapContainer
      className={className}
      center={position}
      zoom={zoom}
      scrollWheelZoom
      style={{ minHeight: 280 }}
    >
      <TileLayer url={MAP_TILE_URL} />
      <Marker position={position} icon={markerIcon}>
        <Popup>{communeName}</Popup>
      </Marker>
      <MapResizeHandler />
    </MapContainer>
  );
}
