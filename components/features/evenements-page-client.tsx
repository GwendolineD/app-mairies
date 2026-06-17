"use client";

import dynamic from "next/dynamic";
import { getEventPinHex, getInitiativePinHex } from "@/lib/constants/map-pins";
import { getInitiativeCategoryMapPinUrl } from "@/lib/constants/initiative-categories";
import type { AgendaEventRecord } from "@/lib/types";
import type { EventListParams } from "@/lib/utils/search-params";
import { Card } from "@/components/ui/card";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { useCreationModals } from "@/components/features/creation-modal-context";
import { EventListToolbar, EventPagination } from "@/components/features/event-list-toolbar";
import { EventCard, EventMapCard } from "@/components/features/event-card";
import { EVENTS_PAGE_SIZE } from "@/lib/queries/events";

const MapContentView = dynamic(
  () =>
    import("@/components/features/map-content-view").then((m) => m.MapContentView),
  { ssr: false, loading: () => <Card className="h-[420px] animate-pulse bg-warm" /> },
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
};

export function EvenementsPageClient({
  params,
  items,
  totalCount,
  mapCenter,
  mapItems,
  mapMarkers,
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
          center={mapCenter}
          renderPopup={(markerId) => {
            const event = mapItems.find((e) => e.id === markerId);
            if (!event) return null;
            return <EventMapCard event={event} />;
          }}
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
