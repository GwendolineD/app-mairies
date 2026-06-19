import { startOfWeek, format, addWeeks, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import type { SupabaseClient } from "@supabase/supabase-js";

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

function weekLabel(date: Date): string {
  return format(date, "dd/MM", { locale: fr });
}

function buildWeekBuckets(since: Date): Date[] {
  const buckets: Date[] = [];
  const now = new Date();
  let cursor = startOfWeek(since, { weekStartsOn: 1 });
  const currentWeek = startOfWeek(now, { weekStartsOn: 1 });
  while (isBefore(cursor, currentWeek) || cursor.getTime() === currentWeek.getTime()) {
    buckets.push(new Date(cursor));
    cursor = addWeeks(cursor, 1);
  }
  return buckets;
}

function countByWeek(
  dates: { created_at: string }[],
  buckets: Date[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const { created_at } of dates) {
    const week = startOfWeek(new Date(created_at), { weekStartsOn: 1 });
    const ts = week.getTime();
    map.set(ts, (map.get(ts) ?? 0) + 1);
  }
  return map;
}

export async function fetchWeeklyContentCreation(
  supabase: SupabaseClient,
  communeId: string,
  since: Date,
): Promise<WeeklyContentRow[]> {
  const [{ data: annDates }, { data: iniDates }, { data: evtDates }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("created_at")
        .eq("commune_id", communeId),
      supabase
        .from("initiatives")
        .select("created_at")
        .eq("commune_id", communeId),
      supabase
        .from("events")
        .select("created_at")
        .eq("commune_id", communeId),
    ]);

  const buckets = buildWeekBuckets(since);
  const annMap = countByWeek(annDates ?? [], buckets);
  const iniMap = countByWeek(iniDates ?? [], buckets);
  const evtMap = countByWeek(evtDates ?? [], buckets);

  return buckets.map((b) => ({
    week: weekLabel(b),
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
    .eq("commune_id", communeId);

  const buckets = buildWeekBuckets(since);
  const weekMap = countByWeek(memDates ?? [], buckets);

  let cumulative = 0;
  return buckets.map((b) => {
    cumulative += weekMap.get(b.getTime()) ?? 0;
    return { week: weekLabel(b), inscrits: cumulative };
  });
}
