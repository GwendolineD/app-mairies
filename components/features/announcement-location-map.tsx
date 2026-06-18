"use client";

import { Suspense } from "react";
import { AnnouncementAddressLines } from "@/components/features/announcement-address-lines";
import { CarteAnnoncesMap } from "@/components/features/carte-preview-map";
import { Skeleton } from "@/components/ui/skeleton";
import type { AddressLines } from "@/lib/utils/format-address";
import { cn } from "@/lib/utils/cn";

type Props = {
  latitude: number;
  longitude: number;
  announcementTitle: string;
  addressLines: AddressLines;
  categorySlug: string;
  mapPinUrl?: string | null;
  colorHex?: string;
  mapClassName?: string;
  addressSize?: "sm" | "md";
  hideAddressIcon?: boolean;
};

const MAP_PREVIEW_CLASS =
  "h-48 overflow-hidden rounded-lg border border-border/70";

export function AnnouncementLocationMap({
  latitude,
  longitude,
  announcementTitle,
  addressLines,
  categorySlug,
  mapPinUrl,
  colorHex,
  mapClassName = MAP_PREVIEW_CLASS,
  addressSize = "sm",
  hideAddressIcon = false,
}: Props) {
  return (
    <div className="space-y-2">
      <AnnouncementAddressLines
        {...addressLines}
        size={addressSize}
        hideIcon={hideAddressIcon}
      />

      <div className="relative z-0">
        <Suspense fallback={<Skeleton className={cn(mapClassName, "h-48")} />}>
          <CarteAnnoncesMap
            latitude={latitude}
            longitude={longitude}
            communeName={announcementTitle}
            categorySlug={categorySlug}
            mapPinUrl={mapPinUrl}
            colorHex={colorHex}
            className={mapClassName}
          />
        </Suspense>
      </div>
    </div>
  );
}
