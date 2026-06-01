import type { AnnouncementMarker } from "@/lib/queries/announcements";

export type MapMarker = {
  id: string;
  title: string;
  categorySlug: string;
  lat: number;
  lng: number;
  pinColor?: string;
};

export function announcementMarkersToMap(markers: AnnouncementMarker[]): MapMarker[] {
  return markers
    .filter((m) => m.address_lat != null && m.address_lng != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      categorySlug: m.category_slug,
      lat: m.address_lat,
      lng: m.address_lng,
    }));
}
