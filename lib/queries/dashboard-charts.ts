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

export type CategoryBreakdown = {
  categorySlug: string;
  fulfilled: number;
  unfulfilled: number;
};

export type OutcomeSection = {
  fulfilled: number;
  unfulfilled: number;
  byCategory: CategoryBreakdown[];
};

export type OutcomeSummary = {
  announcementDemande: OutcomeSection;
  announcementOffre: OutcomeSection;
  events: OutcomeSection;
  byCategory: OutcomeStatsRow[];
};

export type BannerSlide = {
  key: "demandes" | "offres" | "events";
  count: number;
};

type OutcomeBannerStatsRow = {
  demands: number;
  offers: number;
  events: number;
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
  );
  const iniMap = countByParisWeek(
    [...(iniDates ?? []), ...archivedInitiatives],
  );
  const evtMap = countByParisWeek(
    [...(evtDates ?? []), ...archivedEvents],
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
  const weekMap = countByParisWeek(allDates);

  let cumulative = 0;
  return buckets.map((b) => {
    cumulative += weekMap.get(b.getTime()) ?? 0;
    return { week: formatParisWeekLabel(b), inscrits: cumulative };
  });
}

/** Resident accueil banner slides: all-time fulfilled demands, offers, and events. */
export async function fetchAccueilBannerSlides(
  supabase: SupabaseClient,
  communeId: string,
): Promise<BannerSlide[]> {
  const { data, error } = await supabase
    .rpc("commune_outcome_banner_stats", { p_commune_id: communeId })
    .single();

  if (error || !data) return [];

  const stats = data as OutcomeBannerStatsRow;
  const slides: BannerSlide[] = [];

  if (stats.demands > 0) slides.push({ key: "demandes", count: stats.demands });
  if (stats.offers > 0) slides.push({ key: "offres", count: stats.offers });
  if (stats.events > 0) slides.push({ key: "events", count: stats.events });

  return slides;
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

  const emptySection = (): OutcomeSection => ({
    fulfilled: 0,
    unfulfilled: 0,
    byCategory: [],
  });

  if (error || !data) {
    return {
      announcementDemande: emptySection(),
      announcementOffre: emptySection(),
      events: emptySection(),
      byCategory: [],
    };
  }

  const byCategoryMap = new Map<string, OutcomeStatsRow>();
  const summary: OutcomeSummary = {
    announcementDemande: emptySection(),
    announcementOffre: emptySection(),
    events: emptySection(),
    byCategory: [],
  };

  type SectionKey = "announcementDemande" | "announcementOffre" | "events";
  const sectionCatMaps = {
    announcementDemande: new Map<string, CategoryBreakdown>(),
    announcementOffre: new Map<string, CategoryBreakdown>(),
    events: new Map<string, CategoryBreakdown>(),
  };

  for (const row of data) {
    const contentKind = row.content_kind as ContentKind;
    const contentType = row.content_type;
    const outcome = row.outcome as OutcomeReason;
    const categorySlug = row.category_slug;

    let sectionKey: SectionKey | null = null;
    if (contentKind === "announcement" && contentType === "demande") {
      sectionKey = "announcementDemande";
    } else if (contentKind === "announcement" && contentType === "offre") {
      sectionKey = "announcementOffre";
    } else if (contentKind === "event") {
      sectionKey = "events";
    }

    if (sectionKey) {
      summary[sectionKey][outcome] += 1;
      const catMap = sectionCatMaps[sectionKey];
      let cat = catMap.get(categorySlug);
      if (!cat) {
        cat = { categorySlug, fulfilled: 0, unfulfilled: 0 };
        catMap.set(categorySlug, cat);
      }
      cat[outcome] += 1;
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

  for (const sectionKey of Object.keys(sectionCatMaps) as SectionKey[]) {
    summary[sectionKey].byCategory = [...sectionCatMaps[sectionKey].values()]
      .filter((c) => c.fulfilled + c.unfulfilled > 0)
      .sort((a, b) => b.fulfilled + b.unfulfilled - (a.fulfilled + a.unfulfilled));
  }

  summary.byCategory = [...byCategoryMap.values()].sort((a, b) => b.count - a.count);
  return summary;
}
