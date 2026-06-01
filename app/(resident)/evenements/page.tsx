import { requireActiveMembership } from "@/lib/auth/session";
import { listEventMarkers, listEventsPage, EVENTS_PAGE_SIZE } from "@/lib/queries/events";
import { createClient } from "@/lib/supabase/server";
import { parseEventListParams } from "@/lib/utils/search-params";
import { EvenementsPageClient } from "@/components/features/evenements-page-client";

export default async function EvenementsListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const params = parseEventListParams(sp);
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const supabase = await createClient();

  const offset = (params.page - 1) * EVENTS_PAGE_SIZE;
  const { items, totalCount } = await listEventsPage(
    supabase,
    { communeId },
    { offset, limit: EVENTS_PAGE_SIZE },
  );

  const rawMarkers = await listEventMarkers(supabase, { communeId });
  const mapMarkers = rawMarkers
    .filter((m) => m.address_lat != null && m.address_lng != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      lat: m.address_lat,
      lng: m.address_lng,
    }));

  const lat =
    ctx.activeMembership!.address_lat ??
    ctx.activeMembership!.commune?.centroid_lat ??
    48.8566;
  const lng =
    ctx.activeMembership!.address_lng ??
    ctx.activeMembership!.commune?.centroid_lng ??
    2.3522;

  return (
    <EvenementsPageClient
      params={params}
      items={items}
      totalCount={totalCount}
      mapCenter={[lat, lng]}
      mapMarkers={mapMarkers}
    />
  );
}
