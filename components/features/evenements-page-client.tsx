"use client";

import dynamic from "next/dynamic";
import { getEventPinHex, getInitiativePinHex } from "@/lib/constants/map-pins";
import { getInitiativeCategoryMapPinUrl } from "@/lib/constants/initiative-categories";
import type { AgendaEventRecord } from "@/lib/types";
import type { EventListParams } from "@/lib/utils/search-params";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { EventListToolbar, EventPagination } from "@/components/features/event-list-toolbar";
import { EventCard } from "@/components/features/event-card";
import { EVENTS_PAGE_SIZE } from "@/lib/queries/events";

const MapContentView = dynamic(
  () =>
    import("@/components/features/map-content-view").then((m) => m.MapContentView),
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

type MapMarker = {
  id: string;
  title: string;
  categorySlug: string | null;
  lat: number;
  lng: number;
};

type Props = {
  params: EventListParams;
  items: AgendaEventRecord[];
  totalCount: number;
  mapCenter: [number, number];
  mapItems: AgendaEventRecord[];
  mapMarkers: MapMarker[];
  hasUserAddress: boolean;
};

export function EvenementsPageClient({
  params,
  items,
  totalCount,
  mapCenter,
  mapItems,
  mapMarkers,
  hasUserAddress,
}: Props) {
  const { openEventModal } = useCreationModals();

  const markers = mapMarkers.map((m) => ({
    id: m.id,
    title: m.title,
    categorySlug: m.categorySlug ?? "event",
    lat: m.lat,
    lng: m.lng,
    mapPinUrl: m.categorySlug
      ? getInitiativeCategoryMapPinUrl(m.categorySlug)
      : null,
    pinColor: m.categorySlug
      ? getInitiativePinHex(m.categorySlug)
      : getEventPinHex(),
    colorHex: m.categorySlug
      ? getInitiativePinHex(m.categorySlug)
      : getEventPinHex(),
  }));

  return (
    <PageStack gap="5">
      <EventListToolbar
        params={params}
        totalCount={totalCount}
        onCreateClick={() => openEventModal()}
      />

      {params.vue === "carte" ? (
        <MapContentView
          markers={markers}
          eventItems={mapItems}
          center={mapCenter}
          showUserPin={hasUserAddress}
          carouselTitle="Événements autour de vous"
        />
      ) : items.length === 0 ? (
        <EventsEmptyState />
      ) : (
        <>
          <ListGrid className="hidden md:grid">
            {items.map((event) => (
              <EventCard key={event.id} event={event} layout="vertical" />
            ))}
          </ListGrid>
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((event) => (
              <EventCard key={event.id} event={event} layout="horizontal" />
            ))}
          </div>
          <EventPagination
            params={params}
            totalCount={totalCount}
            pageSize={EVENTS_PAGE_SIZE}
          />
        </>
      )}
    </PageStack>
  );
}

function EventsEmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium text-muted">
        Aucun événement à venir pour le moment.
      </p>
      <p className="text-xs text-subtle">
        Créez un événement pour rassembler vos voisin·es !
      </p>
    </Card>
  );
}
