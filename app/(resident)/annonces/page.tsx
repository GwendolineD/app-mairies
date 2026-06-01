import { requireActiveMembership } from "@/lib/auth/session";
import {
  listAnnouncementMarkers,
  listAnnouncementsPage,
  ANNOUNCEMENTS_PAGE_SIZE,
} from "@/lib/queries/announcements";
import { createClient } from "@/lib/supabase/server";
import { announcementMarkersToMap } from "@/lib/utils/map-markers";
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
    categorie: params.categorie,
  };

  const offset = (params.page - 1) * ANNOUNCEMENTS_PAGE_SIZE;
  const { items, nextCursor, totalCount } = await listAnnouncementsPage(
    supabase,
    filters,
    { offset, limit: ANNOUNCEMENTS_PAGE_SIZE },
  );

  const rawMarkers = await listAnnouncementMarkers(supabase, filters);
  const mapMarkers = announcementMarkersToMap(rawMarkers);

  const lat =
    ctx.activeMembership!.address_lat ??
    ctx.activeMembership!.commune?.centroid_lat ??
    48.8566;
  const lng =
    ctx.activeMembership!.address_lng ??
    ctx.activeMembership!.commune?.centroid_lng ??
    2.3522;

  return (
    <AnnoncesPageClient
      params={params}
      items={items}
      nextCursor={nextCursor}
      totalCount={totalCount}
      mapMarkers={mapMarkers}
      mapCenter={[lat, lng]}
    />
  );
}
