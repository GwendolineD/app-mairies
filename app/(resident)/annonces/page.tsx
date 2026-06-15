import { requireActiveMembership } from "@/lib/auth/session";
import {
  countAnnouncements,
  listAnnouncementMapItems,
  listAnnouncementsPage,
  ANNOUNCEMENTS_PAGE_SIZE,
} from "@/lib/queries/announcements";
import { createClient } from "@/lib/supabase/server";
import { parseAnnouncementListParams } from "@/lib/utils/search-params";
import { AnnoncesPageClient } from "@/components/features/annonces-page-client";

export default async function AnnoncesListePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};
  const params = parseAnnouncementListParams(sp);
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const supabase = await createClient();

  const filters = {
    communeId,
    type: params.type,
    categories: params.categories,
    date: params.date,
    dateValue: params.dateValue,
  };

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

  // Map view fetches ALL geo-located items at once (bounded per tenant);
  // list view fetches only the requested page + total count.
  if (params.vue === "carte") {
    const [mapItems, totalCount] = await Promise.all([
      listAnnouncementMapItems(supabase, filters),
      countAnnouncements(supabase, filters),
    ]);

    return (
      <AnnoncesPageClient
        params={params}
        items={[]}
        nextCursor={null}
        totalCount={totalCount}
        mapItems={mapItems}
        userPosition={[userLat, userLng]}
        hasUserAddress={hasUserAddress}
      />
    );
  }

  const offset = (params.page - 1) * ANNOUNCEMENTS_PAGE_SIZE;
  const { items, nextCursor, totalCount } = await listAnnouncementsPage(
    supabase,
    filters,
    { offset, limit: ANNOUNCEMENTS_PAGE_SIZE },
  );

  return (
    <AnnoncesPageClient
      params={params}
      items={items}
      nextCursor={nextCursor}
      totalCount={totalCount}
      mapItems={[]}
      userPosition={[userLat, userLng]}
      hasUserAddress={hasUserAddress}
    />
  );
}
