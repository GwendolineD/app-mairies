"use client";

import { Suspense, useState } from "react";
import { Maximize2, MapPin } from "lucide-react";
import { CarteAnnoncesMap } from "@/components/features/carte-preview-map";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type Props = {
  latitude: number;
  longitude: number;
  announcementTitle: string;
  addressLabel: string;
  mapClassName?: string;
};

const MAP_PREVIEW_CLASS =
  "h-48 overflow-hidden rounded-lg border border-border/70";

export function AnnouncementLocationMap({
  latitude,
  longitude,
  announcementTitle,
  addressLabel,
  mapClassName = MAP_PREVIEW_CLASS,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <p className="inline-flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="size-3.5 shrink-0 text-subtle" aria-hidden />
        {addressLabel}
      </p>

      <div className="relative">
        <Suspense fallback={<Skeleton className={cn(mapClassName, "h-48")} />}>
          <CarteAnnoncesMap
            latitude={latitude}
            longitude={longitude}
            communeName={announcementTitle}
            className={mapClassName}
          />
        </Suspense>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Agrandir la carte"
          className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-surface/95 text-muted shadow-card transition hover:bg-surface hover:text-text"
        >
          <Maximize2 className="size-4" aria-hidden />
        </button>
      </div>

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title={announcementTitle}
        size="xl"
      >
        <Suspense fallback={<Skeleton className="h-[min(60vh,480px)] rounded-lg" />}>
          <CarteAnnoncesMap
            latitude={latitude}
            longitude={longitude}
            communeName={announcementTitle}
            className="h-[min(60vh,480px)] overflow-hidden rounded-lg border border-border/70"
          />
        </Suspense>
      </Modal>
    </>
  );
}
