import { requireActiveMembership } from "@/lib/auth/session";
import {
  enrichEventsWithVolunteerCounts,
  listEventMapItems,
  listEventMarkers,
  listEventsPage,
  EVENTS_PAGE_SIZE,
} from "@/lib/queries/events";
import { createClient } from "@/lib/supabase/server";
import { parseEventListParams } from "@/lib/utils/search-params";
import { EvenementsPageClient } from "@/components/features/evenements-page-client";

function buildEventMapMarkers(
  markers: Awaited<ReturnType<typeof listEventMarkers>>,
) {
  return markers
    .filter((m) => m.address_lat != null && m.address_lng != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      categorySlug: m.category_slug,
      lat: m.address_lat,
      lng: m.address_lng,
    }));
}

export default async function EvenementsListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const params = parseEventListParams(sp);
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const supabase = await createClient();

  const filters = { communeId, categorie: params.categorie };

  const userLat =
    ctx.activeMembership!.address_lat ??
    ctx.activeMembership!.commune?.centroid_lat ??
    48.8566;
  const userLng =
    ctx.activeMembership!.address_lng ??
    ctx.activeMembership!.commune?.centroid_lng ??
    2.3522;

  const hasUserAddress =
    ctx.activeMembership!.address_lat != null &&
    ctx.activeMembership!.address_lng != null;

  if (params.vue === "carte") {
    const [mapItems, rawMarkers, { totalCount }] = await Promise.all([
      listEventMapItems(supabase, filters),
      listEventMarkers(supabase, filters),
      listEventsPage(supabase, filters, { limit: 1, sortMode: params.tri }),
    ]);
    const mapMarkers = buildEventMapMarkers(rawMarkers);
    const enrichedMapItems = await enrichEventsWithVolunteerCounts(supabase, mapItems);

    return (
      <EvenementsPageClient
        params={params}
        items={[]}
        totalCount={totalCount}
        mapCenter={[userLat, userLng]}
        mapItems={enrichedMapItems}
        mapMarkers={mapMarkers}
        hasUserAddress={hasUserAddress}
      />
    );
  }

  const offset = (params.page - 1) * EVENTS_PAGE_SIZE;
  const { items, totalCount } = await listEventsPage(
    supabase,
    filters,
    { offset, limit: EVENTS_PAGE_SIZE, sortMode: params.tri },
  );
  const enrichedItems = await enrichEventsWithVolunteerCounts(supabase, items);

  return (
    <EvenementsPageClient
      params={params}
      items={enrichedItems}
      totalCount={totalCount}
      mapCenter={[userLat, userLng]}
      mapItems={[]}
      mapMarkers={[]}
      hasUserAddress={hasUserAddress}
    />
  );
}
