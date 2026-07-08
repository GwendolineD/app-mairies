import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ANNOUNCEMENT_STATUS,
  EVENT_STATUS,
  INITIATIVE_STATUS,
  MEMBERSHIP_STATUS,
} from "@/lib/constants/statuses";
import { startOfTodayParisIso } from "@/lib/datetime";

export type MairieLiveStats = {
  activeAnnouncements: number;
  activeInitiatives: number;
  activeEvents: number;
  activeResidents: number;
};

/** Canonical "live" counts shown on the municipality dashboard stat cards. */
export async function fetchMairieLiveStats(
  supabase: SupabaseClient,
  communeId: string,
): Promise<MairieLiveStats> {
  const [
    { count: activeAnnouncements },
    { count: activeInitiatives },
    { count: activeEvents },
    { count: activeResidents },
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", ANNOUNCEMENT_STATUS.ouverte)
      .is("suspended_at", null),
    supabase
      .from("initiatives")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", INITIATIVE_STATUS.active)
      .is("suspended_at", null),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", EVENT_STATUS.active)
      .is("suspended_at", null)
      .gte("ends_at", startOfTodayParisIso()),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", MEMBERSHIP_STATUS.active),
  ]);

  return {
    activeAnnouncements: activeAnnouncements ?? 0,
    activeInitiatives: activeInitiatives ?? 0,
    activeEvents: activeEvents ?? 0,
    activeResidents: activeResidents ?? 0,
  };
}
