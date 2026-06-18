import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnnouncementType } from "@/lib/constants/announcement-types";
import { ANNOUNCEMENT_STATUS } from "@/lib/constants/statuses";
import type { Announcement, Membership, Profile } from "@/lib/types";
import type { AnnouncementDateFilter, SortMode } from "@/lib/utils/search-params";

export const ANNOUNCEMENTS_PAGE_SIZE = 20;

export type AnnouncementListFilters = {
  communeId: string;
  type?: AnnouncementType;
  /** One or more category slugs (OR-combined). */
  categories?: string[];
  date?: AnnouncementDateFilter;
  /** ISO YYYY-MM-DD, only relevant when date === "custom". */
  dateValue?: string;
};

export type AnnouncementWithAuthor = Announcement & {
  author_membership: (Pick<
    Membership,
    "address_street" | "address_city" | "address_postcode" | "address_lat" | "address_lng"
  > & {
    profiles: Pick<
      Profile,
      "first_name" | "last_name" | "display_name" | "avatar_url"
    > | null;
  }) | null;
};

export type AnnouncementMarker = {
  id: string;
  title: string;
  category_slug: string;
  address_lat: number;
  address_lng: number;
  /** Joined from announcement_categories */
  announcement_categories: {
    map_pin_url: string | null;
    color_hex: string;
  } | null;
};

export type AnnouncementMapItem = AnnouncementWithAuthor & {
  address_lat: number;
  address_lng: number;
  /** Joined from announcement_categories */
  announcement_categories: {
    map_pin_url: string | null;
    color_hex: string;
  } | null;
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Apply common filters (commune, status, type, category list, date) to a Supabase
 * filter builder. Loosely typed (`Function`) on purpose: Supabase's generic chain
 * type otherwise inflates to an "excessively deep" instantiation in TS.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function applyAnnouncementFilters<T extends { eq: Function; in: Function; gte: Function; lte: Function; is: Function }>(
  query: T,
  filters: AnnouncementListFilters,
): T {
  let q = query
    .eq("commune_id", filters.communeId)
    .in("status", [ANNOUNCEMENT_STATUS.ouverte, ANNOUNCEMENT_STATUS.pourvue]);
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.categories && filters.categories.length > 0) {
    q = q.in("category_slug", filters.categories);
  }
  if (filters.date === "today") {
    q = q.eq("target_date", todayIso());
  } else if (filters.date === "next7days") {
    q = q.gte("target_date", todayIso()).lte("target_date", plusDaysIso(7));
  } else if (filters.date === "none") {
    q = q.is("target_date", null);
  } else if (filters.date === "custom" && filters.dateValue) {
    q = q.eq("target_date", filters.dateValue);
  }
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
  options: { cursor?: string | null; limit?: number; offset?: number; sortMode?: SortMode },
): Promise<PaginatedAnnouncements> {
  const limit = options.limit ?? ANNOUNCEMENTS_PAGE_SIZE;
  const sortMode = options.sortMode ?? "recent";
  const ascending = sortMode === "oldest";
  const totalCount = await countAnnouncements(supabase, filters);

  let query = supabase
    .from("announcements")
    .select(
      "*, author_membership:memberships!announcements_author_membership_id_fkey(address_street, address_city, address_postcode, address_lat, address_lng, profiles:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url))",
    )
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit);

  query = applyAnnouncementFilters(query, filters);

  if (options.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1);
  } else if (options.cursor) {
    const decoded = decodeCursor(options.cursor);
    if (decoded) {
      const op = ascending ? "gt" : "lt";
      query = query.or(
        `created_at.${op}.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.${op}.${decoded.id})`,
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
    .select(
      "id, title, category_slug, address_lat, address_lng, announcement_categories(map_pin_url, color_hex)",
    )
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  query = applyAnnouncementFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as unknown as AnnouncementMarker[];
}

/**
 * List all announcements that have geo coordinates with full author info.
 * Used by the map view to render rich pin popovers + a synced "around you" carousel.
 * Volume is intentionally bounded by tenant scope — a single commune typically holds < 500 active announcements.
 */
export async function listAnnouncementMapItems(
  supabase: SupabaseClient,
  filters: AnnouncementListFilters,
): Promise<AnnouncementMapItem[]> {
  let query = supabase
    .from("announcements")
    .select(
      "*, author_membership:memberships!announcements_author_membership_id_fkey(address_street, address_city, address_postcode, address_lat, address_lng, profiles:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url)), announcement_categories(map_pin_url, color_hex)",
    )
    .not("address_lat", "is", null)
    .not("address_lng", "is", null)
    .order("created_at", { ascending: false });

  query = applyAnnouncementFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as AnnouncementMapItem[];
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
): Promise<AnnouncementWithAuthor[]> {
  const { data } = await supabase
    .from("announcements")
    .select(
      "*, author_membership:memberships!announcements_author_membership_id_fkey(address_street, address_city, address_postcode, address_lat, address_lng, profiles:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url))",
    )
    .eq("commune_id", communeId)
    .eq("category_slug", categorySlug)
    .neq("id", excludeId)
    .in("status", [ANNOUNCEMENT_STATUS.ouverte, ANNOUNCEMENT_STATUS.pourvue])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AnnouncementWithAuthor[];
}
