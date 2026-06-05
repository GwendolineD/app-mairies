"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AssetPlaceholder } from "@/components/ui/asset-placeholder";
import { Modal } from "@/components/ui/modal";

const DynamicMap = dynamic(
  () => import("@/components/features/map-view").then((m) => m.MapViewCommune),
  {
    loading: () => (
      <AssetPlaceholder description="Chargement de la carte…" aspectRatio="4/3" />
    ),
    ssr: false,
  },
);

type Props = {
  latitude: number;
  longitude: number;
  /** Human-readable place shown in the marker popup. */
  label: string;
};

const PREVIEW_CLASS =
  "h-56 rounded-2xl overflow-hidden shadow-card border border-border/70";
const MODAL_CLASS =
  "h-[min(70vh,40rem)] rounded-2xl overflow-hidden border border-border/70";

/**
 * Inline, zoomable initiative location map with an "expand" action that opens a
 * larger map inside a modal. Leaflet loads only in the browser (`ssr: false`).
 */
export function InitiativeLocationMap({ latitude, longitude, label }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <DynamicMap
        latitude={latitude}
        longitude={longitude}
        communeName={label}
        zoom={14}
        className={PREVIEW_CLASS}
      />
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="absolute right-3 top-3 z-[1000] inline-flex cursor-pointer items-center gap-1 rounded-sm border border-border bg-surface/95 px-3 py-1.5 text-xs font-semibold text-text shadow-card transition hover:bg-warm"
      >
        <ExpandIcon />
        Agrandir
      </button>

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title="Où ça se passe ?"
        className="max-w-3xl"
      >
        <div className="space-y-3">
          {expanded ? (
            <DynamicMap
              latitude={latitude}
              longitude={longitude}
              communeName={label}
              zoom={15}
              className={MODAL_CLASS}
            />
          ) : null}
          <p className="text-sm font-medium text-muted">{label}</p>
        </div>
      </Modal>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}
