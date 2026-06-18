// @ts-nocheck
"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { InitiativeCard } from "@/components/features/initiative-card";
import {
  InitiativeListToolbar,
  InitiativePagination,
} from "@/components/features/initiative-list-toolbar";
import { InitiativesInfiniteList } from "@/components/features/initiatives-infinite-list";
import { InitiativesEmptyState } from "@/components/features/initiatives-empty-state";
import { useCreationModals } from "@/components/features/creation-modal-context";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import { INITIATIVES_PAGE_SIZE } from "@/lib/queries/initiatives";
import {
  buildInitiativeListQuery,
  hasActiveInitiativeFilters,
  type InitiativeListParams,
} from "@/lib/utils/search-params";
import type { MapMarker } from "@/lib/utils/map-markers";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
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
        <Skeleton className="h-[420px] w-full rounded-lg md:h-[520px]" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-52 shrink-0 rounded-xl md:w-56" />
          ))}
        </div>
      </div>
    ),
  },
);

type Props = {
  params: InitiativeListParams;
  items: InitiativeWithAuthor[];
  nextCursor: string | null;
  totalCount: number;
  mapCenter: [number, number];
  mapItems: InitiativeWithAuthor[];
  mapMarkers: MapMarker[];
  hasUserAddress: boolean;
};

export function InitiativesPageClient({
  params,
  items,
  nextCursor,
  totalCount,
  mapCenter,
  mapItems,
  mapMarkers,
  hasUserAddress,
}: Props) {
  const pathname = usePathname();
  const { openInitiativeModal } = useCreationModals();

  const filters = { categorie: params.categorie };
  const hasFilters = hasActiveInitiativeFilters(params);
  const clearFiltersHref = `${pathname}${buildInitiativeListQuery({
    vue: params.vue,
    page: 1,
  })}`;

  return (
    <PageStack>
      <InitiativeListToolbar
        params={params}
        totalCount={totalCount}
        onCreateClick={() => openInitiativeModal()}
      />

      {params.vue === "carte" ? (
        <MapContentView
          markers={mapMarkers}
          initiativeItems={mapItems}
          center={mapCenter}
          showUserPin={hasUserAddress}
          carouselTitle="Initiatives autour de vous"
        />
      ) : items.length === 0 ? (
        <InitiativesEmptyState
          hasFilters={hasFilters}
          clearFiltersHref={hasFilters ? clearFiltersHref : undefined}
        />
      ) : (
        <>
          <ListGrid className="hidden gap-2 md:grid lg:grid-cols-4">
            {items.map((item) => (
              <InitiativeCard key={item.id} initiative={item} layout="vertical" />
            ))}
          </ListGrid>
          <InitiativesInfiniteList
            initialItems={items}
            initialCursor={nextCursor}
            filters={filters}
          />
          <InitiativePagination
            params={params}
            totalCount={totalCount}
            pageSize={INITIATIVES_PAGE_SIZE}
          />
        </>
      )}
    </PageStack>
  );
}
