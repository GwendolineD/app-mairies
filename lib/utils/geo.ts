/**
 * Lightweight geo helpers used by the map / proximity features.
 * No external dependency — sufficient for sub-kilometric ranges where we
 * don't need geodesic precision.
 */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in meters between two coordinates (haversine). */
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Approximate Leaflet zoom level required to fit a circle of `radiusMeters` around `center`. */
export function zoomForRadiusMeters(
  centerLat: number,
  radiusMeters: number,
  viewportPx = 420,
): number {
  // Tile world width at zoom 0 ≈ 256 px ; 1 px ≈ 156543.03 * cos(lat) m at zoom 0.
  const metersPerPxAtZoom0 = 156543.03392 * Math.cos((centerLat * Math.PI) / 180);
  // We want the diameter (2 * radius) to fit in viewportPx.
  const targetMetersPerPx = (radiusMeters * 2) / viewportPx;
  if (targetMetersPerPx <= 0) return 18;
  const zoom = Math.log2(metersPerPxAtZoom0 / targetMetersPerPx);
  return Math.max(3, Math.min(18, Math.round(zoom)));
}
