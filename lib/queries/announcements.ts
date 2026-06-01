import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnnouncementType } from "@/lib/constants/announcement-types";
import { ANNOUNCEMENT_STATUS } from "@/lib/constants/statuses";
import type { Announcement, Membership, Profile } from "@/lib/types";

export const ANNOUNCEMENTS_PAGE_SIZE = 20;

export type AnnouncementListFilters = {
  communeId: string;
  type?: AnnouncementType;
  categorie?: string;
};

export type AnnouncementWithAuthor = Announcement & {
  author_membership: (Pick<
    Membership,
    "address_label" | "address_lat" | "address_lng"
  > & {
    profiles: Pick<Profile, "first_name" | "display_name"> | null;
  }) | null;
};

export type AnnouncementMarker = {
  id: string;
  title: string;
  category_slug: string;
  address_lat: number;
  address_lng: number;
};

export type PaginatedAnnouncements = {
  items: AnnouncementWithAuthor[];
  nextCursor: string | null;
  totalCount: number;
};

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = raw.split("|");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function applyAnnouncementFilters<T extends { eq: Function; in: Function }>(
  query: T,
  filters: AnnouncementListFilters,
) {
  let q = query
    .eq("commune_id", filters.communeId)
    .in("status", [ANNOUNCEMENT_STATUS.ouverte, ANNOUNCEMENT_STATUS.pourvue]);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.categorie) q = q.eq("category_slug", filters.categorie);
  return q;
}

export async function countAnnouncements(
  supabase: SupabaseClient,
  filters: AnnouncementListFilters,
): Promise<number> {
  let query = supabase
    .from("announcements")
    .select("id", { count: "exact", head: true });
  query = applyAnnouncementFilters(query, filters);
  const { count } = await query;
  return count ?? 0;
}

export async function listAnnouncementsPage(
  supabase: SupabaseClient,
  filters: AnnouncementListFilters,
  options: { cursor?: string | null; limit?: number; offset?: number },
): Promise<PaginatedAnnouncements> {
  const limit = options.limit ?? ANNOUNCEMENTS_PAGE_SIZE;
  const totalCount = await countAnnouncements(supabase, filters);

  let query = supabase
    .from("announcements")
    .select(
      "*, author_membership:memberships!announcements_author_membership_id_fkey(address_label, address_lat, address_lng, profiles:profiles!memberships_user_id_fkey(first_name, display_name))",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  query = applyAnnouncementFilters(query, filters);

  if (options.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1);
  } else if (options.cursor) {
    const decoded = decodeCursor(options.cursor);
    if (decoded) {
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
      );
    }
  }

  const { data } = await query;
  const items = (data ?? []) as AnnouncementWithAuthor[];
  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last
      ? encodeCursor(last.created_at, last.id)
      : null;

  return { items, nextCursor, totalCount };
}

export async function listAnnouncementMarkers(
  supabase: SupabaseClient,
  filters: AnnouncementListFilters,
): Promise<AnnouncementMarker[]> {
  let query = supabase
    .from("announcements")
    .select("id, title, category_slug, address_lat, address_lng")
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  query = applyAnnouncementFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as AnnouncementMarker[];
}

export async function countOpenDemandsToday(
  supabase: SupabaseClient,
  communeId: string,
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const { count } = await supabase
    .from("announcements")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .eq("type", "demande")
    .eq("status", ANNOUNCEMENT_STATUS.ouverte)
    .eq("target_date", today);

  return count ?? 0;
}

export async function listSimilarAnnouncements(
  supabase: SupabaseClient,
  communeId: string,
  categorySlug: string,
  excludeId: string,
  limit = 3,
): Promise<Announcement[]> {
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("commune_id", communeId)
    .eq("category_slug", categorySlug)
    .neq("id", excludeId)
    .in("status", [ANNOUNCEMENT_STATUS.ouverte, ANNOUNCEMENT_STATUS.pourvue])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Announcement[];
}
