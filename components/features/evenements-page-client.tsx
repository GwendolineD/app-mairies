"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ROUTES } from "@/lib/constants/routes";
import { getEventPinHex } from "@/lib/constants/map-pins";
import type { AgendaEventRecord } from "@/lib/types";
import {
  buildEventListQuery,
  type EventListParams,
} from "@/lib/utils/search-params";
import { Card } from "@/components/ui/card";
import { ContentTypeTag } from "@/components/ui/content-type-tag";
import { ListGrid, PageStack } from "@/components/ui/page-stack";
import { PageHeading } from "@/components/ui/page-heading";
import { formatEventRange } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

const MapContentView = dynamic(
  () =>
    import("@/components/features/map-content-view").then((m) => m.MapContentView),
  { ssr: false, loading: () => <Card className="h-[420px] animate-pulse bg-warm" /> },
);

type Props = {
  params: EventListParams;
  items: AgendaEventRecord[];
  totalCount: number;
  mapCenter: [number, number];
  mapMarkers: { id: string; title: string; lat: number; lng: number }[];
};

export function EvenementsPageClient({
  params,
  items,
  totalCount,
  mapCenter,
  mapMarkers,
}: Props) {
  const router = useRouter();
  const pathname = ROUTES.evenements.list;

  function navigate(partial: Partial<EventListParams>) {
    router.push(`${pathname}${buildEventListQuery({ ...params, ...partial, page: 1 })}`);
  }

  const markers = mapMarkers.map((m) => ({
    id: m.id,
    title: m.title,
    categorySlug: "event",
    lat: m.lat,
    lng: m.lng,
    mapPinUrl: null as string | null,
    colorHex: getEventPinHex(),
  }));

  return (
    <PageStack gap="5">
      <PageHeading
        title="Événements"
        subtitle="Les moments où l'on se retrouve — créés par votre mairie."
      />
      <div className="flex flex-wrap gap-2">
        <ViewToggle active={params.vue === "liste"} onClick={() => navigate({ vue: "liste" })} label="Liste" />
        <ViewToggle active={params.vue === "carte"} onClick={() => navigate({ vue: "carte" })} label="Carte" />
        <span className="self-center text-sm text-muted">
          {totalCount} événement{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {params.vue === "carte" ? (
        <MapContentView markers={markers} center={mapCenter} />
      ) : items.length === 0 ? (
        <Card className="p-5 text-center text-sm text-muted">
          Aucun événement à venir.
        </Card>
      ) : (
        <ListGrid>
          {items.map((event) => (
            <Link href={ROUTES.evenements.detail(event.id)} key={event.id} className="h-full">
              <Card className="flex h-full flex-col space-y-2 p-4 transition hover:border-purple/35">
                <ContentTypeTag type="event" />
                <h3 className="text-xl font-semibold text-text">{event.title}</h3>
                <p className="text-xs text-subtle">
                  {formatEventRange(event.starts_at, event.ends_at)}
                </p>
                {event.address_label ? (
                  <p className="text-xs text-muted">{event.address_label}</p>
                ) : null}
              </Card>
            </Link>
          ))}
        </ListGrid>
      )}
    </PageStack>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-sm px-3 py-1.5 text-xs font-semibold",
        active ? "bg-soft-pink text-purple" : "border border-border text-muted",
      )}
    >
      {label}
    </button>
  );
}
