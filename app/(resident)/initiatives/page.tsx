import { requireActiveMembership } from "@/lib/auth/session";
import {
  listInitiativeMarkers,
  listInitiativesPage,
  INITIATIVES_PAGE_SIZE,
} from "@/lib/queries/initiatives";
import { createClient } from "@/lib/supabase/server";
import { parseInitiativeListParams } from "@/lib/utils/search-params";
import { InitiativesPageClient } from "@/components/features/initiatives-page-client";
import { getInitiativeCategoryMapPinUrl } from "@/lib/constants/initiative-categories";
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
    const rawMarkers = await listInitiativeMarkers(supabase, filters);
    const mapMarkers = rawMarkers
      .filter((m) => m.address_lat != null && m.address_lng != null)
      .map((m) => ({
        id: m.id,
        title: m.title,
        categorySlug: m.category_slug ?? "solidarite",
        lat: m.address_lat,
        lng: m.address_lng,
        mapPinUrl: getInitiativeCategoryMapPinUrl(m.category_slug ?? "solidarite"),
        pinColor: getInitiativePinHex(m.category_slug ?? "solidarite"),
        colorHex: getInitiativePinHex(m.category_slug ?? "solidarite"),
      }));

    const { totalCount } = await listInitiativesPage(supabase, filters, {
      limit: 1,
    });

    return (
      <InitiativesPageClient
        params={params}
        items={[]}
        nextCursor={null}
        totalCount={totalCount}
        mapCenter={[userLat, userLng]}
        mapMarkers={mapMarkers}
        hasUserAddress={hasUserAddress}
      />
    );
  }

  const offset = (params.page - 1) * INITIATIVES_PAGE_SIZE;
  const { items, nextCursor, totalCount } = await listInitiativesPage(
    supabase,
    filters,
    { offset, limit: INITIATIVES_PAGE_SIZE },
  );

  return (
    <InitiativesPageClient
      params={params}
      items={items}
      nextCursor={nextCursor}
      totalCount={totalCount}
      mapCenter={[userLat, userLng]}
      mapMarkers={[]}
      hasUserAddress={hasUserAddress}
    />
  );
}
