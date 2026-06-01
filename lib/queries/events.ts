import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import type { AgendaEventRecord } from "@/lib/types";

export const EVENTS_PAGE_SIZE = 20;

export type EventListFilters = {
  communeId: string;
};

export type EventMarker = {
  id: string;
  title: string;
  address_lat: number;
  address_lng: number;
};

export async function listEventsPage(
  supabase: SupabaseClient,
  filters: EventListFilters,
  options: { offset?: number; limit?: number },
) {
  const limit = options.limit ?? EVENTS_PAGE_SIZE;
  const now = new Date().toISOString();

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", filters.communeId)
    .eq("status", EVENT_STATUS.active)
    .gte("starts_at", now);

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("commune_id", filters.communeId)
    .eq("status", EVENT_STATUS.active)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .range(options.offset ?? 0, (options.offset ?? 0) + limit - 1);

  return { items: (data ?? []) as AgendaEventRecord[], totalCount: count ?? 0 };
}

export async function listEventMarkers(
  supabase: SupabaseClient,
  filters: EventListFilters,
): Promise<EventMarker[]> {
  const { data } = await supabase
    .from("events")
    .select("id, title, address_lat, address_lng")
    .eq("commune_id", filters.communeId)
    .eq("status", EVENT_STATUS.active)
    .not("address_lat", "is", null)
    .not("address_lng", "is", null);

  return (data ?? []) as EventMarker[];
}
