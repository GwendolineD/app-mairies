"use client";

import dynamic from "next/dynamic";
import { AnnouncementCard } from "@/components/features/announcement-card";
import {
  AnnouncementListToolbar,
  AnnouncementPagination,
} from "@/components/features/announcement-list-toolbar";
import { AnnouncementsInfiniteList } from "@/components/features/infinite-list";
import type { MapMarker } from "@/lib/utils/map-markers";
import type { AnnouncementListParams } from "@/lib/utils/search-params";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import { ANNOUNCEMENTS_PAGE_SIZE } from "@/lib/queries/announcements";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { useCreationModals } from "@/components/features/creation-modal-context";

const MapContentView = dynamic(
  () =>
    import("@/components/features/map-content-view").then((m) => m.MapContentView),
  { ssr: false, loading: () => <Card className="h-[420px] animate-pulse bg-warm" /> },
);

type Props = {
  params: AnnouncementListParams;
  items: AnnouncementWithAuthor[];
  nextCursor: string | null;
  totalCount: number;
  mapMarkers: MapMarker[];
  mapCenter: [number, number];
};

export function AnnoncesPageClient({
  params,
  items,
  nextCursor,
  totalCount,
  mapMarkers,
  mapCenter,
}: Props) {
  const { openAnnouncementModal } = useCreationModals();
  const filters = { type: params.type, categorie: params.categorie };

  return (
    <PageStack>
      <header>
        <PageHeading
          title="Toutes les annonces"
          subtitle="Demandes et offres proches de votre adresse communautaire."
        />
      </header>

      <AnnouncementListToolbar
        params={params}
        totalCount={totalCount}
        onCreateClick={() => openAnnouncementModal()}
      />

      {params.vue === "carte" ? (
        <MapContentView
          markers={mapMarkers}
          center={mapCenter}
          carouselItems={items.slice(0, 8)}
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
