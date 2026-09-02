const CARTO_RASTER_BASE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export function buildMapTileUrl(apiKey?: string): string {
  const key = apiKey?.trim();
  if (!key) return CARTO_RASTER_BASE;
  return `${CARTO_RASTER_BASE}?key=${encodeURIComponent(key)}`;
}

export const MAP_TILE_URL = buildMapTileUrl(
  process.env.NEXT_PUBLIC_CARTO_API_KEY,
);

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
