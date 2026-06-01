import type { SupabaseClient } from "@supabase/supabase-js";
import { INITIATIVE_STATUS } from "@/lib/constants/statuses";
import type { InitiativeRecord, Membership } from "@/lib/types";

export const INITIATIVES_PAGE_SIZE = 20;

export type InitiativeListFilters = {
  communeId: string;
  categorie?: string;
};

export type InitiativeWithAuthor = InitiativeRecord & {
  author_membership: Pick<Membership, "address_label"> | null;
};

export type InitiativeMarker = {
  id: string;
  title: string;
  category_slug: string | null;
  address_lat: number;
  address_lng: number;
};

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString("base64url");
}

function applyFilters<T extends { eq: Function; in: Function }>(
  query: T,
  filters: InitiativeListFilters,
) {
  let q = query.eq("commune_id", filters.communeId).eq("status", INITIATIVE_STATUS.active);
  if (filters.categorie) q = q.eq("category_slug", filters.categorie);
  return q;
}

export async function listInitiativesPage(
  supabase: SupabaseClient,
  filters: InitiativeListFilters,
  options: { offset?: number; limit?: number; cursor?: string | null },
) {
  const limit = options.limit ?? INITIATIVES_PAGE_SIZE;

  let countQuery = supabase.from("initiatives").select("id", { count: "exact", head: true });
  countQuery = applyFilters(countQuery, filters);
  const { count } = await countQuery;

  let query = supabase
    .from("initiatives")
    .select(
      "*, author_membership:memberships!initiatives_author_membership_id_fkey(address_label)",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  query = applyFilters(query, filters);

  if (options.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1);
  }

  const { data } = await query;
  const items = (data ?? []) as InitiativeWithAuthor[];
  const last = items[items.length - 1];
  const nextCursor =
    items.length === limit && last ? encodeCursor(last.created_at, last.id) : null;

  return { items, nextCursor, totalCount: count ?? 0 };
}

export async function listInitiativeMarkers(
  supabase: SupabaseClient,
  filters: InitiativeListFilters,
): Promise<InitiativeMarker[]> {
  let query = supabase
    .from("initiatives")
    .select("id, title, category_slug, address_lat, address_lng")
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  query = applyFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as InitiativeMarker[];
}
