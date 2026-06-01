import { requireActiveMembership } from "@/lib/auth/session";
import {
  listInitiativeMarkers,
  listInitiativesPage,
  INITIATIVES_PAGE_SIZE,
} from "@/lib/queries/initiatives";
import { createClient } from "@/lib/supabase/server";
import { parseInitiativeListParams } from "@/lib/utils/search-params";
import { InitiativesPageClient } from "@/components/features/initiatives-page-client";
import { getInitiativePinHex } from "@/lib/constants/map-pins";

export default async function InitiativesListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const params = parseInitiativeListParams(sp);
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const supabase = await createClient();

  const filters = { communeId, categorie: params.categorie };
  const offset = (params.page - 1) * INITIATIVES_PAGE_SIZE;
  const { items, totalCount } = await listInitiativesPage(supabase, filters, {
    offset,
    limit: INITIATIVES_PAGE_SIZE,
  });

  const rawMarkers = await listInitiativeMarkers(supabase, filters);
  const mapMarkers = rawMarkers
    .filter((m) => m.address_lat != null && m.address_lng != null)
    .map((m) => ({
      id: m.id,
      title: m.title,
      categorySlug: m.category_slug ?? "solidarite",
      lat: m.address_lat,
      lng: m.address_lng,
      pinColor: getInitiativePinHex(m.category_slug ?? "solidarite"),
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
    <InitiativesPageClient
      params={params}
      items={items}
      totalCount={totalCount}
      mapCenter={[lat, lng]}
      mapMarkers={mapMarkers}
    />
  );
}
