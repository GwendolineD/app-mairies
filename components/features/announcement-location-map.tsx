"use client";

import { Suspense, useState } from "react";
import { Maximize2 } from "lucide-react";
import { TypePastille } from "@/components/features/announcement-card";
import { AnnouncementAddressLines } from "@/components/features/announcement-address-lines";
import { CarteAnnoncesMap } from "@/components/features/carte-preview-map";
import { Modal } from "@/components/ui/modal";
import { CategoryTag } from "@/components/ui/category-tag";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategoryColorHex,
  getCategoryLabel,
} from "@/lib/constants/announcement-categories";
import type { AddressLines } from "@/lib/utils/format-address";
import { cn } from "@/lib/utils/cn";

type Props = {
  latitude: number;
  longitude: number;
  announcementTitle: string;
  announcementType: string;
  addressLines: AddressLines;
  categorySlug: string;
  mapClassName?: string;
};

const MAP_PREVIEW_CLASS =
  "h-48 overflow-hidden rounded-lg border border-border/70";

const MODAL_TAG_CLASS = "rounded-sm px-2.5 py-0.5 text-xs";

export function AnnouncementLocationMap({
  latitude,
  longitude,
  announcementTitle,
  announcementType,
  addressLines,
  categorySlug,
  mapClassName = MAP_PREVIEW_CLASS,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const modalHeaderPrefix = (
    <div className="flex flex-wrap items-center gap-2">
      <TypePastille type={announcementType} className="shadow-none" />
      <CategoryTag
        label={getCategoryLabel(categorySlug)}
        colorHex={getCategoryColorHex(categorySlug)}
        className={MODAL_TAG_CLASS}
      />
    </div>
  );

  return (
    <div className="space-y-2">
      <AnnouncementAddressLines {...addressLines} />

      <div className="relative z-0">
        <Suspense fallback={<Skeleton className={cn(mapClassName, "h-48")} />}>
          <CarteAnnoncesMap
            latitude={latitude}
            longitude={longitude}
            communeName={announcementTitle}
            categorySlug={categorySlug}
            className={mapClassName}
          />
        </Suspense>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Agrandir la carte"
          className="absolute right-2 top-2 z-1000 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-border/60 bg-surface text-muted shadow-card transition hover:bg-warm hover:text-text"
        >
          <Maximize2 className="size-4" aria-hidden />
        </button>
      </div>

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title={announcementTitle}
        headerPrefix={modalHeaderPrefix}
        size="xl"
        showCloseButton
      >
        <Suspense fallback={<Skeleton className="h-[min(60vh,480px)] rounded-lg" />}>
          <CarteAnnoncesMap
            latitude={latitude}
            longitude={longitude}
            communeName={announcementTitle}
            categorySlug={categorySlug}
            pinSize="large"
            className="h-[min(60vh,480px)] overflow-hidden rounded-lg border border-border/70"
          />
        </Suspense>
      </Modal>
    </div>
  );
}
