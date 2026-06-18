import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import type { AgendaEventRecord } from "@/lib/types";
import type { SortMode } from "@/lib/utils/search-params";

export const EVENTS_PAGE_SIZE = 20;

export type EventListFilters = {
  communeId: string;
  categorie?: string;
};

export type EventMarker = {
  id: string;
  title: string;
  category_slug: string | null;
  address_lat: number;
  address_lng: number;
};

function applyEventFilters<T extends { eq: Function }>(
  query: T,
  filters: EventListFilters,
) {
  let q = query
    .eq("commune_id", filters.communeId)
    .eq("status", EVENT_STATUS.active)
    .is("suspended_at", null);
  if (filters.categorie) q = q.eq("category_slug", filters.categorie);
  return q;
}

export async function listEventsPage(
  supabase: SupabaseClient,
  filters: EventListFilters,
  options: { offset?: number; limit?: number; sortMode?: SortMode },
) {
  const limit = options.limit ?? EVENTS_PAGE_SIZE;
  const now = new Date().toISOString();
  const ascending = options.sortMode !== "oldest";

  let countQuery = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .gte("ends_at", now);
  countQuery = applyEventFilters(countQuery, filters);
  const { count } = await countQuery;

  let query = supabase
    .from("events")
    .select("*")
    .gte("ends_at", now)
    .order("starts_at", { ascending })
    .order("id", { ascending })
    .limit(limit);

  query = applyEventFilters(query, filters);

  if (options.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1);
  }

  const { data } = await query;
  return { items: (data ?? []) as AgendaEventRecord[], totalCount: count ?? 0 };
}

export async function listEventMapItems(
  supabase: SupabaseClient,
  filters: EventListFilters,
): Promise<AgendaEventRecord[]> {
  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("*")
    .gte("ends_at", now)
    .not("address_lat", "is", null)
    .not("address_lng", "is", null)
    .order("starts_at", { ascending: true });

  query = applyEventFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as AgendaEventRecord[];
}

export async function listEventMarkers(
  supabase: SupabaseClient,
  filters: EventListFilters,
): Promise<EventMarker[]> {
  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("id, title, category_slug, address_lat, address_lng")
    .gte("ends_at", now)
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  query = applyEventFilters(query, filters);
  const { data } = await query;
  return (data ?? []) as EventMarker[];
}

export async function listVolunteerCountsByInitiativeId(
  supabase: SupabaseClient,
  initiativeIds: string[],
): Promise<Record<string, number>> {
  if (initiativeIds.length === 0) return {};

  const { data } = await supabase
    .from("initiative_responses")
    .select("initiative_id")
    .in("initiative_id", initiativeIds)
    .eq("response_type", "volunteer");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.initiative_id] = (counts[row.initiative_id] ?? 0) + 1;
  }
  return counts;
}

export async function enrichEventsWithVolunteerCounts<
  T extends { source_initiative_id: string | null },
>(supabase: SupabaseClient, events: T[]): Promise<(T & { volunteers_registered: number })[]> {
  const initiativeIds = [
    ...new Set(
      events
        .map((event) => event.source_initiative_id)
        .filter((id): id is string => id != null),
    ),
  ];
  const counts = await listVolunteerCountsByInitiativeId(supabase, initiativeIds);

  return events.map((event) => ({
    ...event,
    volunteers_registered: event.source_initiative_id
      ? (counts[event.source_initiative_id] ?? 0)
      : 0,
  }));
}
