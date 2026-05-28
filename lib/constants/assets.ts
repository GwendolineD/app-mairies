/**
 * Local asset paths and fixed third-party URLs (logos, map tiles, etc.).
 * UI illustrations → lib/constants/illustrations.ts
 */

export const ASSETS = {
  logoVertical: "/logo-vertical.png",
  icon: "/icons/icon.svg",
} as const;

/** Leaflet default marker icons (CDN). */
export const LEAFLET_MARKER_ICONS = {
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
} as const;

/** Carto basemap tiles for commune preview maps. */
export const MAP_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
