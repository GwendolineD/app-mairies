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

export async function listVolunteerCountsByEventId(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};

  const { data } = await supabase
    .from("event_volunteers")
    .select("event_id")
    .in("event_id", eventIds);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  }
  return counts;
}

export async function enrichEventsWithVolunteerCounts<
  T extends { id: string },
>(supabase: SupabaseClient, events: T[]): Promise<(T & { volunteers_registered: number })[]> {
  const eventIds = events.map((e) => e.id);
  const counts = await listVolunteerCountsByEventId(supabase, eventIds);

  return events.map((event) => ({
    ...event,
    volunteers_registered: counts[event.id] ?? 0,
  }));
}

export type EventVolunteer = {
  membershipId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

async function listEventMemberRows(
  supabase: SupabaseClient,
  table: "event_volunteers" | "event_participants",
  eventId: string,
): Promise<EventVolunteer[]> {
  const { data, error } = await supabase
    .from(table as "event_volunteers")
    .select(
      "membership_id, memberships(id, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .eq("event_id", eventId)
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

export async function listEventVolunteers(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventVolunteer[]> {
  return listEventMemberRows(supabase, "event_volunteers", eventId);
}

export async function listEventParticipants(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventVolunteer[]> {
  return listEventMemberRows(supabase, "event_participants", eventId);
}

export async function countEventParticipants(
  supabase: SupabaseClient,
  eventId: string,
): Promise<number> {
  const { count } = await supabase
    .from("event_participants")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count ?? 0;
}
