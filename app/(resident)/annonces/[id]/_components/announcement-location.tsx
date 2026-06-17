import { getAnnouncement } from "@/lib/data/announcements";
import { Card } from "@/components/ui/card";
import { AnnouncementLocationMap } from "@/components/features/announcement-location-map";
import { formatAddressLines } from "@/lib/utils/format-address";

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
        announcementTitle={ann.title}
        addressLines={formatAddressLines(ann.address_street, ann.address_postcode, ann.address_city)}
        categorySlug={ann.category_slug}
      />
    </Card>
  );
}
