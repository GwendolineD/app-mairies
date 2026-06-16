"use client";

import dynamic from "next/dynamic";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";

const DynamicMap = dynamic(
  () => import("@/components/features/map-view").then((m) => m.MapViewCommune),
  {
    loading: () => (
      <AssetPlaceholder description="Chargement de la carte communautaire…" aspectRatio="4/3" />
    ),
    ssr: false,
  },
);

import type { AnnouncementPinSize } from "@/lib/utils/announcement-map-pin";

type Props = {
  latitude: number;
  longitude: number;
  communeName: string;
  categorySlug?: string;
  pinSize?: AnnouncementPinSize;
  className?: string;
};

export function CarteAnnoncesMap({
  latitude,
  longitude,
  communeName,
  categorySlug,
  pinSize = "default",
  className = "h-80 rounded-3xl overflow-hidden shadow-card border border-border/70 lg:h-[min(32rem,70vh)] lg:min-h-96",
}: Props) {
  return (
    <DynamicMap
      communeName={communeName}
      latitude={latitude}
      longitude={longitude}
      categorySlug={categorySlug}
      pinSize={pinSize}
      zoom={14}
      className={className}
    />
  );
}
