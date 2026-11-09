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

/**
 * Attendance figures for one event. `*Registrations` = number of member rows
 * (internal: list pagination, avatar overflow badge); `*Headcount` =
 * registrations + declared companions (the only figure shown to users).
 */
export type EventParticipationCounts = {
  volunteersRegistrations: number;
  volunteersHeadcount: number;
  participantsRegistrations: number;
  participantsHeadcount: number;
};

const EMPTY_COUNTS: EventParticipationCounts = {
  volunteersRegistrations: 0,
  volunteersHeadcount: 0,
  participantsRegistrations: 0,
  participantsHeadcount: 0,
};

type CountRow = {
  event_id: string;
  volunteers_count: number | null;
  volunteers_headcount: number | null;
  participants_count: number | null;
  participants_headcount: number | null;
};

function toCounts(row: CountRow): EventParticipationCounts {
  return {
    volunteersRegistrations: Number(row.volunteers_count ?? 0),
    volunteersHeadcount: Number(row.volunteers_headcount ?? 0),
    participantsRegistrations: Number(row.participants_count ?? 0),
    participantsHeadcount: Number(row.participants_headcount ?? 0),
  };
}

async function fetchParticipationCounts(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Record<string, EventParticipationCounts>> {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase.rpc("count_event_participation", {
    p_event_ids: eventIds,
  });

  if (error || !data) return {};

  const byId: Record<string, EventParticipationCounts> = {};
  for (const row of data as CountRow[]) {
    byId[row.event_id] = toCounts(row);
  }
  return byId;
}

/** Single source of truth for the detail pages (one RPC round-trip). */
export async function getEventParticipationCounts(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventParticipationCounts> {
  const byId = await fetchParticipationCounts(supabase, [eventId]);
  return byId[eventId] ?? EMPTY_COUNTS;
}

export type EventAttendanceFields = {
  volunteers_headcount: number;
  participants_headcount: number;
};

/** Enrich a page of events with the public headcounts shown on cards. */
export async function enrichEventsWithCounts<T extends { id: string }>(
  supabase: SupabaseClient,
  events: T[],
): Promise<(T & EventAttendanceFields)[]> {
  const byId = await fetchParticipationCounts(
    supabase,
    events.map((e) => e.id),
  );

  return events.map((event) => {
    const counts = byId[event.id] ?? EMPTY_COUNTS;
    return {
      ...event,
      volunteers_headcount: counts.volunteersHeadcount,
      participants_headcount: counts.participantsHeadcount,
    };
  });
}

export type EventVolunteer = {
  membershipId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** Anonymous companions declared by this member (0..MAX_EVENT_GUESTS). */
  guestsCount: number;
};

export const EVENT_MEMBER_LIST_PAGE_SIZE = 20;

type EventMemberTable = "event_volunteers" | "event_participants";

async function listEventMemberRows(
  supabase: SupabaseClient,
  table: EventMemberTable,
  eventId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<EventVolunteer[]> {
  const limit = options.limit ?? EVENT_MEMBER_LIST_PAGE_SIZE;
  const offset = options.offset ?? 0;

  // Both tables share the same shape; the cast keeps a single typed query path.
  const { data, error } = await supabase
    .from(table as "event_volunteers")
    .select(
      "membership_id, guests_count, memberships(id, profiles(first_name, last_name, display_name, avatar_url))",
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
      guestsCount: row.guests_count ?? 0,
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

/** The current member's own registrations on an event (null = not registered). */
export type UserEventEngagement = {
  participating: { guestsCount: number } | null;
  volunteering: { guestsCount: number } | null;
};

export async function getUserEventEngagement(
  supabase: SupabaseClient,
  eventId: string,
  membershipId: string,
): Promise<UserEventEngagement> {
  const [{ data: participant }, { data: volunteer }] = await Promise.all([
    supabase
      .from("event_participants")
      .select("guests_count")
      .eq("event_id", eventId)
      .eq("membership_id", membershipId)
      .maybeSingle(),
    supabase
      .from("event_volunteers")
      .select("guests_count")
      .eq("event_id", eventId)
      .eq("membership_id", membershipId)
      .maybeSingle(),
  ]);

  return {
    participating: participant ? { guestsCount: participant.guests_count } : null,
    volunteering: volunteer ? { guestsCount: volunteer.guests_count } : null,
  };
}
