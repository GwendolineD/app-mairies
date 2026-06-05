"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

const DynamicMap = dynamic(
  () => import("@/components/features/map-view").then((m) => m.MapViewCommune),
  {
    loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
    ssr: false,
  },
);

type Props = {
  latitude: number;
  longitude: number;
  label: string;
  /** True when coordinates fall back to the commune centroid (approximate location). */
  approximate?: boolean;
};

/**
 * Inline announcement map: pan + zoom stay on the page (scroll-wheel and +/- controls),
 * with an "Agrandir" action that opens the same map larger inside a modal.
 * `isolate` keeps Leaflet's internal z-index contained below the sticky header.
 */
export function AnnouncementLocationMap({
  latitude,
  longitude,
  label,
  approximate = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="relative isolate">
        <DynamicMap
          latitude={latitude}
          longitude={longitude}
          communeName={label}
          zoom={15}
          className="h-44 w-full overflow-hidden rounded-2xl border border-border"
        />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Agrandir la carte"
          className="absolute right-3 top-3 z-[500] inline-flex cursor-pointer items-center gap-1.5 rounded-sm bg-surface/95 px-3 py-1.5 text-xs font-semibold text-text shadow-card backdrop-blur transition hover:bg-surface"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          Agrandir
        </button>
      </div>
      {approximate ? (
        <p className="text-xs font-medium text-subtle">
          Localisation approximative pour préserver la vie privée.
        </p>
      ) : null}

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title="Localisation de l'annonce"
        className="max-w-3xl"
      >
        <div className="relative isolate">
          <DynamicMap
            latitude={latitude}
            longitude={longitude}
            communeName={label}
            zoom={15}
            className="h-[60vh] w-full overflow-hidden rounded-2xl border border-border"
          />
        </div>
        {approximate ? (
          <p className="mt-3 text-xs font-medium text-subtle">
            Localisation approximative pour préserver la vie privée.
          </p>
        ) : null}
      </Modal>
    </>
  );
}
