import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildParisWeekBuckets,
  countByParisWeek,
  formatParisWeekLabel,
} from "@/lib/datetime";
import type { ContentKind, OutcomeReason } from "@/lib/constants/content-outcomes";

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

export type OutcomeStatsRow = {
  contentKind: ContentKind;
  contentType: string | null;
  categorySlug: string;
  outcome: OutcomeReason;
  count: number;
};

export type OutcomeSummary = {
  announcementDemande: { fulfilled: number; unfulfilled: number };
  announcementOffre: { fulfilled: number; unfulfilled: number };
  events: { fulfilled: number; unfulfilled: number };
  byCategory: OutcomeStatsRow[];
};

const DASHBOARD_CHART_ROW_LIMIT = 5000;

export async function fetchWeeklyContentCreation(
  supabase: SupabaseClient,
  communeId: string,
  since: Date,
): Promise<WeeklyContentRow[]> {
  const sinceIso = since.toISOString();
  const [
    { data: annDates },
    { data: iniDates },
    { data: evtDates },
    { data: archivedContent },
  ] = await Promise.all([
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
    supabase
      .from("deleted_content_creation_archive")
      .select("content_kind, original_created_at")
      .eq("commune_id", communeId)
      .gte("original_created_at", sinceIso)
      .limit(DASHBOARD_CHART_ROW_LIMIT),
  ]);

  const archivedAnnouncements =
    archivedContent
      ?.filter((row) => row.content_kind === "announcement")
      .map((row) => ({ created_at: row.original_created_at })) ?? [];
  const archivedInitiatives =
    archivedContent
      ?.filter((row) => row.content_kind === "initiative")
      .map((row) => ({ created_at: row.original_created_at })) ?? [];
  const archivedEvents =
    archivedContent
      ?.filter((row) => row.content_kind === "event")
      .map((row) => ({ created_at: row.original_created_at })) ?? [];

  const buckets = buildParisWeekBuckets(since);
  const annMap = countByParisWeek(
    [...(annDates ?? []), ...archivedAnnouncements],
    buckets,
  );
  const iniMap = countByParisWeek(
    [...(iniDates ?? []), ...archivedInitiatives],
    buckets,
  );
  const evtMap = countByParisWeek(
    [...(evtDates ?? []), ...archivedEvents],
    buckets,
  );

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
  const sinceIso = since.toISOString();

  const [{ data: memDates }, { data: archivedDates }] = await Promise.all([
    supabase
      .from("memberships")
      .select("created_at")
      .eq("commune_id", communeId)
      .gte("created_at", sinceIso)
      .limit(DASHBOARD_CHART_ROW_LIMIT),
    supabase
      .from("deleted_membership_archive")
      .select("original_created_at")
      .eq("commune_id", communeId)
      .gte("original_created_at", sinceIso)
      .limit(DASHBOARD_CHART_ROW_LIMIT),
  ]);

  const allDates = [
    ...(memDates ?? []),
    ...(archivedDates ?? []).map((row) => ({
      created_at: row.original_created_at,
    })),
  ];

  const buckets = buildParisWeekBuckets(since);
  const weekMap = countByParisWeek(allDates, buckets);

  let cumulative = 0;
  return buckets.map((b) => {
    cumulative += weekMap.get(b.getTime()) ?? 0;
    return { week: formatParisWeekLabel(b), inscrits: cumulative };
  });
}

export async function fetchFulfilledCountThisWeek(
  supabase: SupabaseClient,
  communeId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("commune_fulfilled_demands_this_week", {
    p_commune_id: communeId,
  });

  if (error) return 0;
  return data ?? 0;
}

export async function fetchOutcomeStats(
  supabase: SupabaseClient,
  communeId: string,
  since: Date,
): Promise<OutcomeSummary> {
  const { data, error } = await supabase
    .from("content_outcomes")
    .select("content_kind, content_type, category_slug, outcome")
    .eq("commune_id", communeId)
    .gte("recorded_at", since.toISOString())
    .limit(DASHBOARD_CHART_ROW_LIMIT);

  if (error || !data) {
    return {
      announcementDemande: { fulfilled: 0, unfulfilled: 0 },
      announcementOffre: { fulfilled: 0, unfulfilled: 0 },
      events: { fulfilled: 0, unfulfilled: 0 },
      byCategory: [],
    };
  }

  const byCategoryMap = new Map<string, OutcomeStatsRow>();
  const summary: OutcomeSummary = {
    announcementDemande: { fulfilled: 0, unfulfilled: 0 },
    announcementOffre: { fulfilled: 0, unfulfilled: 0 },
    events: { fulfilled: 0, unfulfilled: 0 },
    byCategory: [],
  };

  for (const row of data) {
    const contentKind = row.content_kind as ContentKind;
    const contentType = row.content_type;
    const outcome = row.outcome as OutcomeReason;
    const categorySlug = row.category_slug;

    if (contentKind === "announcement" && contentType === "demande") {
      summary.announcementDemande[outcome] += 1;
    } else if (contentKind === "announcement" && contentType === "offre") {
      summary.announcementOffre[outcome] += 1;
    } else if (contentKind === "event") {
      summary.events[outcome] += 1;
    }

    const key = `${contentKind}:${contentType ?? ""}:${categorySlug}:${outcome}`;
    const existing = byCategoryMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byCategoryMap.set(key, {
        contentKind,
        contentType,
        categorySlug,
        outcome,
        count: 1,
      });
    }
  }

  summary.byCategory = [...byCategoryMap.values()].sort((a, b) => b.count - a.count);
  return summary;
}
