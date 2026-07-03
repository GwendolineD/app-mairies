import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildParisWeekBuckets,
  countByParisWeek,
  formatParisWeekLabel,
} from "@/lib/datetime";

export type WeeklyContentRow = {
  week: string;
  annonces: number;
  initiatives: number;
  evenements: number;
};

export type WeeklyMembersRow = {
  week: string;
  inscrits: number;
};

const DASHBOARD_CHART_ROW_LIMIT = 5000;

export async function fetchWeeklyContentCreation(
  supabase: SupabaseClient,
  communeId: string,
  since: Date,
): Promise<WeeklyContentRow[]> {
  const sinceIso = since.toISOString();
  const [{ data: annDates }, { data: iniDates }, { data: evtDates }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("created_at")
        .eq("commune_id", communeId)
        .gte("created_at", sinceIso)
        .limit(DASHBOARD_CHART_ROW_LIMIT),
      supabase
        .from("initiatives")
        .select("created_at")
        .eq("commune_id", communeId)
        .gte("created_at", sinceIso)
        .limit(DASHBOARD_CHART_ROW_LIMIT),
      supabase
        .from("events")
        .select("created_at")
        .eq("commune_id", communeId)
        .gte("created_at", sinceIso)
        .limit(DASHBOARD_CHART_ROW_LIMIT),
    ]);

  const buckets = buildParisWeekBuckets(since);
  const annMap = countByParisWeek(annDates ?? [], buckets);
  const iniMap = countByParisWeek(iniDates ?? [], buckets);
  const evtMap = countByParisWeek(evtDates ?? [], buckets);

  return buckets.map((b) => ({
    week: formatParisWeekLabel(b),
    annonces: annMap.get(b.getTime()) ?? 0,
    initiatives: iniMap.get(b.getTime()) ?? 0,
    evenements: evtMap.get(b.getTime()) ?? 0,
  }));
}

export async function fetchWeeklyMembershipGrowth(
  supabase: SupabaseClient,
  communeId: string,
  since: Date,
): Promise<WeeklyMembersRow[]> {
  const { data: memDates } = await supabase
    .from("memberships")
    .select("created_at")
    .eq("commune_id", communeId)
    .gte("created_at", since.toISOString())
    .limit(DASHBOARD_CHART_ROW_LIMIT);

  const buckets = buildParisWeekBuckets(since);
  const weekMap = countByParisWeek(memDates ?? [], buckets);

  let cumulative = 0;
  return buckets.map((b) => {
    cumulative += weekMap.get(b.getTime()) ?? 0;
    return { week: formatParisWeekLabel(b), inscrits: cumulative };
  });
}
