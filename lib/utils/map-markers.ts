export type MapMarker = {
  id: string;
  title: string;
  categorySlug: string;
  lat: number;
  lng: number;
  /** Pin image URL from category (DB). Falls back to colored circle if null. */
  mapPinUrl: string | null;
  /** Hex color from category (DB). Used for fallback circle. */
  colorHex: string;
};
