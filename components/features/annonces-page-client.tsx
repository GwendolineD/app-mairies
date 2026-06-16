"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { AnnouncementCard } from "@/components/features/announcement-card";
import {
  AnnouncementListToolbar,
  AnnouncementPagination,
} from "@/components/features/announcement-list-toolbar";
import { AnnouncementsInfiniteList } from "@/components/features/infinite-list";
import { useCreationModals } from "@/components/features/creation-modal-context";
import type { AnnouncementListParams } from "@/lib/utils/search-params";
import type {
  AnnouncementMapItem,
  AnnouncementWithAuthor,
} from "@/lib/queries/announcements";
import { ANNOUNCEMENTS_PAGE_SIZE } from "@/lib/queries/announcements";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MapContentView = dynamic(
  () =>
    import("@/components/features/map-content-view").then(
      (m) => m.MapContentView,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-[420px] w-full rounded-3xl md:h-[520px]" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-64 shrink-0 rounded-3xl md:w-72" />
          ))}
        </div>
      </div>
    ),
  },
);

type Props = {
  params: AnnouncementListParams;
  items: AnnouncementWithAuthor[];
  nextCursor: string | null;
  totalCount: number;
  mapItems: AnnouncementMapItem[];
  userPosition: [number, number];
  hasUserAddress: boolean;
};

export function AnnoncesPageClient({
  params,
  items,
  nextCursor,
  totalCount,
  mapItems,
  userPosition,
  hasUserAddress,
}: Props) {
  const { openAnnouncementModal } = useCreationModals();
  const filters = {
    type: params.type,
    categories: params.categories,
    date: params.date,
    dateValue: params.dateValue,
  };

  const mapMarkers = useMemo(
    () =>
      mapItems.map((it) => ({
        id: it.id,
        title: it.title,
        categorySlug: it.category_slug,
        lat: it.address_lat,
        lng: it.address_lng,
        mapPinUrl: it.announcement_categories?.map_pin_url ?? null,
        colorHex: it.announcement_categories?.color_hex ?? "#A8A8A8",
      })),
    [mapItems],
  );

  return (
    <PageStack>
      <AnnouncementListToolbar
        params={params}
        totalCount={totalCount}
        onCreateClick={() => openAnnouncementModal()}
      />

      {params.vue === "carte" ? (
        <MapContentView
          markers={mapMarkers}
          items={mapItems}
          center={userPosition}
          showUserPin={hasUserAddress}
        />
      ) : items.length === 0 ? (
        <Card className="p-5 text-center text-sm font-medium text-muted">
          Soyez les premiers voisin·es à publier un besoin ou une petite aide.
        </Card>
      ) : (
        <>
          <ListGrid className="hidden md:grid">
            {items.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} layout="vertical" />
            ))}
          </ListGrid>
          <AnnouncementsInfiniteList
            initialItems={items}
            initialCursor={nextCursor}
            filters={filters}
          />
          <AnnouncementPagination
            params={params}
            totalCount={totalCount}
            pageSize={ANNOUNCEMENTS_PAGE_SIZE}
          />
        </>
      )}
    </PageStack>
  );
}
