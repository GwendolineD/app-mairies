import { getAnnouncement } from "@/lib/data/announcements";
import { Card } from "@/components/ui/card";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";

type Props = {
  id: string;
  communeId: string;
  communeName: string;
  fallbackLat: number;
  fallbackLng: number;
};

export async function AnnouncementLocation({
  id,
  communeId,
  communeName,
  fallbackLat,
  fallbackLng,
}: Props) {
  const ann = await getAnnouncement(id, communeId);
  if (!ann) return null;

  const hasOwnCoords = ann.address_lat != null && ann.address_lng != null;
  const latitude = ann.address_lat ?? fallbackLat;
  const longitude = ann.address_lng ?? fallbackLng;

  return (
    <Card className="space-y-3 p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">
        Localisation
      </h2>
      <p className="text-sm font-medium text-text">{communeName}</p>
      <AnnouncementLocationMap
        latitude={latitude}
        longitude={longitude}
        announcementTitle={communeName}
        addressLines={{ streetLine: communeName, cityLine: null, fallback: null }}
        categorySlug="solidarite"
        mapPinUrl={null}
        colorHex="#9A52FF"
      />
    </Card>
  );
}
