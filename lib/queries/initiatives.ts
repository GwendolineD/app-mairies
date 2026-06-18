// @ts-nocheck
import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_STATUS, INITIATIVE_STATUS } from "@/lib/constants/statuses";
import type { InitiativeRecord, Membership } from "@/lib/types";
import type { SortMode } from "@/lib/utils/search-params";

export const INITIATIVES_PAGE_SIZE = 20;

export type InitiativeListFilters = {
  communeId: string;
  categorie?: string;
};

export type InitiativeWithAuthor = InitiativeRecord & {
  author_membership: Pick<Membership, "address_street" | "address_city"> & {
    profiles?: {
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  support_count?: number;
  linked_event?: { id: string; starts_at: string } | null;
};

export type InitiativeMarker = {
  id: string;
  title: string;
  category_slug: string | null;
  photo_url: string | null;
  address_lat: number;
  address_lng: number;
};

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString("base64url");
}

function decodeCursor(
  cursor: string,
): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [createdAt, id] = decoded.split("|");
    if (!createdAt || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function applyFilters<T extends { eq: Function; in: Function }>(
  query: T,
  filters: InitiativeListFilters,
) {
  let q = query
    .eq("commune_id", filters.communeId)
    .eq("status", INITIATIVE_STATUS.active)
    .is("suspended_at", null);
  if (filters.categorie) q = q.eq("category_slug", filters.categorie);
  return q;
}

export async function listInitiativesPage(
  supabase: SupabaseClient,
  filters: InitiativeListFilters,
  options: { offset?: number; limit?: number; cursor?: string | null; sortMode?: SortMode },
) {
  const limit = options.limit ?? INITIATIVES_PAGE_SIZE;
  const ascending = options.sortMode === "oldest";

  let countQuery = supabase.from("initiatives").select("id", { count: "exact", head: true });
  countQuery = applyFilters(countQuery, filters);
  const { count } = await countQuery;

  let query = supabase
    .from("initiatives")
    .select(
      "*, author_membership:memberships!initiatives_author_membership_id_fkey(address_street, address_city, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .order("created_at", { ascending })
    .order("id", { ascending })
    .limit(limit);

  query = applyFilters(query, filters);

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
  const items = (data ?? []) as InitiativeWithAuthor[];

  await enrichInitiativesWithMeta(supabase, items);

  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last ? encodeCursor(last.created_at, last.id) : null;

  return { items, nextCursor, totalCount: count ?? 0 };
}

export async function listInitiativesForAccueil(
  supabase: SupabaseClient,
  communeId: string,
  limit = 3,
): Promise<InitiativeWithAuthor[]> {
  const { data } = await supabase
    .from("initiatives")
    .select(
      "*, author_membership:memberships!initiatives_author_membership_id_fkey(address_street, address_city, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .eq("commune_id", communeId)
    .eq("status", INITIATIVE_STATUS.active)
    .is("suspended_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  const items = (data ?? []) as InitiativeWithAuthor[];
  await enrichInitiativesWithMeta(supabase, items);
  return items;
}

async function enrichInitiativesWithMeta(
  supabase: SupabaseClient,
  items: InitiativeWithAuthor[],
): Promise<void> {
  if (items.length === 0) return;

  const ids = items.map((i) => i.id);
  const [{ data: counts }, { data: events }] = await Promise.all([
    supabase
      .from("initiative_responses")
      .select("initiative_id")
      .in("initiative_id", ids)
      .eq("response_type", "support"),
    supabase
      .from("events")
      .select("id, source_initiative_id, starts_at")
      .in("source_initiative_id", ids)
      .eq("status", EVENT_STATUS.active),
  ]);

  if (counts) {
    const countMap = new Map<string, number>();
    for (const row of counts) {
      countMap.set(row.initiative_id, (countMap.get(row.initiative_id) ?? 0) + 1);
    }
    for (const item of items) {
      item.support_count = countMap.get(item.id) ?? 0;
    }
  }

  const eventMap = new Map<string, { id: string; starts_at: string }>();
  for (const event of events ?? []) {
    if (event.source_initiative_id && event.starts_at) {
      eventMap.set(event.source_initiative_id, {
        id: event.id,
        starts_at: event.starts_at,
      });
    }
  }
  for (const item of items) {
    item.linked_event = eventMap.get(item.id) ?? null;
  }
}

export async function listInitiativeMapItems(
  supabase: SupabaseClient,
  filters: InitiativeListFilters,
): Promise<InitiativeWithAuthor[]> {
  let query = supabase
    .from("initiatives")
    .select(
      "*, author_membership:memberships!initiatives_author_membership_id_fkey(address_street, address_city, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .not("address_lat", "is", null)
    .not("address_lng", "is", null)
    .order("created_at", { ascending: false });

  query = applyFilters(query, filters);
  const { data } = await query;
  const items = (data ?? []) as InitiativeWithAuthor[];
  await enrichInitiativesWithMeta(supabase, items);
  return items;
}

export async function listInitiativeMarkers(
  supabase: SupabaseClient,
  filters: InitiativeListFilters,
): Promise<InitiativeMarker[]> {
  let query = supabase
    .from("initiatives")
    .select("id, title, category_slug, photo_url, address_lat, address_lng")
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  query = applyFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as InitiativeMarker[];
}

export type InitiativeSupporter = {
  membershipId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function listInitiativeSupporters(
  supabase: SupabaseClient,
  initiativeId: string,
): Promise<InitiativeSupporter[]> {
  const { data, error } = await supabase
    .from("initiative_responses")
    .select(
      "membership_id, memberships(id, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .eq("initiative_id", initiativeId)
    .eq("response_type", "support")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const membership = row.memberships as unknown as {
      id: string;
      profiles: {
        first_name: string | null;
        last_name: string | null;
        display_name: string | null;
        avatar_url: string | null;
      } | null;
    } | null;
    const profile = membership?.profiles;
    return {
      membershipId: row.membership_id,
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}
