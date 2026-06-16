import type { MapMarker } from "@/lib/utils/map-markers";

export type MarkerGroup = {
  key: string;
  lat: number;
  lng: number;
  markers: MapMarker[];
  primaryMapPinUrl: string | null;
  primaryColorHex: string;
};

/**
 * Round a coordinate to `decimals` places.
 * 4 decimals ≈ 11m precision — good for grouping same-address markers.
 */
function roundCoord(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Group markers by rounded coordinates.
 * Markers within ~11m (4 decimals) are considered co-located.
 */
export function groupMarkersByLocation(
  markers: MapMarker[],
  precisionDecimals = 4,
): MarkerGroup[] {
  const groups = new Map<string, MarkerGroup>();

  for (const m of markers) {
    const roundedLat = roundCoord(m.lat, precisionDecimals);
    const roundedLng = roundCoord(m.lng, precisionDecimals);
    const key = `${roundedLat},${roundedLng}`;

    const existing = groups.get(key);
    if (existing) {
      existing.markers.push(m);
    } else {
      groups.set(key, {
        key,
        lat: roundedLat,
        lng: roundedLng,
        markers: [m],
        primaryMapPinUrl: m.mapPinUrl,
        primaryColorHex: m.colorHex,
      });
    }
  }

  return Array.from(groups.values());
}

/**
 * Find the group containing a specific marker ID.
 */
export function findGroupByMarkerId(
  groups: MarkerGroup[],
  markerId: string,
): MarkerGroup | undefined {
  return groups.find((g) => g.markers.some((m) => m.id === markerId));
}
