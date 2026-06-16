import type { AnnouncementMarker } from "@/lib/queries/announcements";

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

const DEFAULT_COLOR_HEX = "#A8A8A8";

export function announcementMarkersToMap(
  markers: AnnouncementMarker[],
): MapMarker[] {
  return markers
    .filter((m) => m.address_lat != null && m.address_lng != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      categorySlug: m.category_slug,
      lat: m.address_lat,
      lng: m.address_lng,
      mapPinUrl: m.announcement_categories?.map_pin_url ?? null,
      colorHex: m.announcement_categories?.color_hex ?? DEFAULT_COLOR_HEX,
    }));
}
