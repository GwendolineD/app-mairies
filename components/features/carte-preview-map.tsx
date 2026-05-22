"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(
  () => import("@/components/features/map-view").then((m) => m.MapViewCommune),
  {
    loading: () => (
      <p className="text-xs text-muted">Chargement de la carte...</p>
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
