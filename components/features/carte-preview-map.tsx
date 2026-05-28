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

type Props = {
  latitude: number;
  longitude: number;
  communeName: string;
};

export function CarteAnnoncesMap({ latitude, longitude, communeName }: Props) {
  return (
    <DynamicMap communeName={communeName} latitude={latitude} longitude={longitude} zoom={14} />
  );
}
