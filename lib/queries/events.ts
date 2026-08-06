import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import { startOfTodayParisIso } from "@/lib/datetime";
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
  const minEndsAt = startOfTodayParisIso();
  const ascending = options.sortMode !== "oldest";

  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .gte("ends_at", minEndsAt)
    .order("starts_at", { ascending })
    .order("id", { ascending })
    .limit(limit);

  query = applyEventFilters(query, filters);

  if (options.offset !== undefined) {
    query = query.range(options.offset, options.offset + limit - 1);
  }

  const { data, count } = await query;
  return {
    items: (data ?? []) as AgendaEventRecord[],
    totalCount: count ?? 0,
  };
}

export async function listEventMapItems(
  supabase: SupabaseClient,
  filters: EventListFilters,
): Promise<AgendaEventRecord[]> {
  const minEndsAt = startOfTodayParisIso();

  let query = supabase
    .from("events")
    .select("*")
    .gte("ends_at", minEndsAt)
    .not("address_lat", "is", null)
    .not("address_lng", "is", null)
    .order("starts_at", { ascending: true });

  query = applyEventFilters(query, filters);
  query = query.limit(500);
  const { data } = await query;
  return (data ?? []) as AgendaEventRecord[];
}

export async function listEventMarkers(
  supabase: SupabaseClient,
  filters: EventListFilters,
): Promise<EventMarker[]> {
  const minEndsAt = startOfTodayParisIso();

  let query = supabase
    .from("events")
    .select("id, title, category_slug, address_lat, address_lng")
    .gte("ends_at", minEndsAt)
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  query = applyEventFilters(query, filters);
  query = query.limit(500);
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

export const EVENT_MEMBER_LIST_PAGE_SIZE = 20;

async function listEventMemberRows(
  supabase: SupabaseClient,
  table: "event_volunteers" | "event_participants",
  eventId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<EventVolunteer[]> {
  const limit = options.limit ?? EVENT_MEMBER_LIST_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const { data, error } = await supabase
    .from(table as "event_volunteers")
    .select(
      "membership_id, memberships(id, profiles(first_name, last_name, display_name, avatar_url))",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

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
  options: { limit?: number; offset?: number } = {},
): Promise<EventVolunteer[]> {
  return listEventMemberRows(supabase, "event_volunteers", eventId, options);
}

export async function listEventParticipants(
  supabase: SupabaseClient,
  eventId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<EventVolunteer[]> {
  return listEventMemberRows(supabase, "event_participants", eventId, options);
}

export async function countEventVolunteers(
  supabase: SupabaseClient,
  eventId: string,
): Promise<number> {
  const { count } = await supabase
    .from("event_volunteers")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count ?? 0;
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
