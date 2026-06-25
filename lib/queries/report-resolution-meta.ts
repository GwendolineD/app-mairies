import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDisplayName } from "@/lib/utils/display-name";

export type ReportResolutionMeta = {
  at: string;
  actorName: string;
};

export type ReportResolutionMetaMaps = {
  reviewedByNameMap: Record<string, string>;
  suspendByReportId: Record<string, ReportResolutionMeta>;
  contentSuspendById: Record<string, ReportResolutionMeta>;
  membershipSuspendById: Record<string, ReportResolutionMeta>;
};

const UNKNOWN_ACTOR = "Modérateur";

function resolveActorName(profile: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  if (profile.first_name && profile.last_name) {
    return formatDisplayName(profile.first_name, profile.last_name);
  }
  return profile.display_name?.trim() || UNKNOWN_ACTOR;
}

async function buildActorNameMap(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_name")
    .in("user_id", userIds);

  const nameMap: Record<string, string> = {};
  for (const profile of profiles ?? []) {
    nameMap[profile.user_id] = resolveActorName(profile);
  }

  return nameMap;
}

export async function buildReviewedByNameMap(
  supabase: SupabaseClient,
  reports: Array<{ reviewed_by_user_id?: string | null }>,
): Promise<Record<string, string>> {
  const userIds = [
    ...new Set(
      reports
        .map((report) => report.reviewed_by_user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  ];

  return buildActorNameMap(supabase, userIds);
}

async function buildSuspendMetaFromActions(
  supabase: SupabaseClient,
  actions: Array<{
    target_id: string;
    actor_user_id: string;
    created_at: string;
  }>,
): Promise<Record<string, ReportResolutionMeta>> {
  const latestByTarget = new Map<
    string,
    { actorUserId: string; createdAt: string }
  >();

  for (const action of actions) {
    if (!latestByTarget.has(action.target_id)) {
      latestByTarget.set(action.target_id, {
        actorUserId: action.actor_user_id,
        createdAt: action.created_at,
      });
    }
  }

  const actorUserIds = [
    ...new Set([...latestByTarget.values()].map((entry) => entry.actorUserId)),
  ];
  const actorNameByUserId = await buildActorNameMap(supabase, actorUserIds);

  const metaMap: Record<string, ReportResolutionMeta> = {};
  for (const [targetId, entry] of latestByTarget) {
    metaMap[targetId] = {
      at: entry.createdAt,
      actorName: actorNameByUserId[entry.actorUserId] ?? UNKNOWN_ACTOR,
    };
  }

  return metaMap;
}

export async function buildReportResolutionMetaMaps(
  supabase: SupabaseClient,
  params: {
    reports: Array<{ id: string }>;
    contentIds: string[];
    membershipIds: string[];
    contentSuspendedAtById: Record<string, string | null>;
    contentSuspendedByUserIdById: Record<string, string | null>;
    membershipSuspendedAtById: Record<string, string | null>;
  },
): Promise<ReportResolutionMetaMaps> {
  const reportIds = params.reports.map((report) => report.id);
  const uniqueContentIds = [...new Set(params.contentIds)];
  const uniqueMembershipIds = [...new Set(params.membershipIds)];

  const [
    reviewedByNameMap,
    reportActionsResult,
    contentActionsResult,
    membershipActionsResult,
  ] = await Promise.all([
    buildReviewedByNameMap(supabase, params.reports),
    reportIds.length > 0
      ? supabase
          .from("moderation_actions")
          .select("related_report_id, actor_user_id, created_at")
          .eq("action", "suspend")
          .in("related_report_id", reportIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
    uniqueContentIds.length > 0
      ? supabase
          .from("moderation_actions")
          .select("target_id, actor_user_id, created_at")
          .eq("action", "suspend")
          .in("target_id", uniqueContentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
    uniqueMembershipIds.length > 0
      ? supabase
          .from("moderation_actions")
          .select("target_id, actor_user_id, created_at")
          .eq("action", "suspend")
          .eq("target_type", "membership")
          .in("target_id", uniqueMembershipIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (reportActionsResult.error) {
    console.error(
      "[reports] Failed to load suspend actions by report:",
      reportActionsResult.error.message,
      reportActionsResult.error.code,
    );
  }

  if (contentActionsResult.error) {
    console.error(
      "[reports] Failed to load content suspend actions:",
      contentActionsResult.error.message,
      contentActionsResult.error.code,
    );
  }

  if (membershipActionsResult.error) {
    console.error(
      "[reports] Failed to load membership suspend actions:",
      membershipActionsResult.error.message,
      membershipActionsResult.error.code,
    );
  }

  const suspendByReportId: Record<string, ReportResolutionMeta> = {};
  const reportActionActorIds = [
    ...new Set(
      (reportActionsResult.data ?? []).map((action) => action.actor_user_id),
    ),
  ];
  const reportActionActorNames = await buildActorNameMap(
    supabase,
    reportActionActorIds,
  );
  for (const action of reportActionsResult.data ?? []) {
    if (!action.related_report_id || suspendByReportId[action.related_report_id]) {
      continue;
    }
    suspendByReportId[action.related_report_id] = {
      at: action.created_at,
      actorName: reportActionActorNames[action.actor_user_id] ?? UNKNOWN_ACTOR,
    };
  }

  const contentSuspendById = await buildSuspendMetaFromActions(
    supabase,
    contentActionsResult.data ?? [],
  );

  for (const [contentId, suspendedAt] of Object.entries(
    params.contentSuspendedAtById,
  )) {
    if (!suspendedAt || contentSuspendById[contentId]) continue;

    const suspendedByUserId = params.contentSuspendedByUserIdById[contentId];
    contentSuspendById[contentId] = {
      at: suspendedAt,
      actorName: suspendedByUserId
        ? (reviewedByNameMap[suspendedByUserId] ?? UNKNOWN_ACTOR)
        : UNKNOWN_ACTOR,
    };
  }

  const contentSuspendedByUserIds = [
    ...new Set(
      Object.values(params.contentSuspendedByUserIdById).filter(
        (userId): userId is string => Boolean(userId),
      ),
    ),
  ];
  const contentSuspendedByNames = await buildActorNameMap(
    supabase,
    contentSuspendedByUserIds,
  );

  for (const [contentId, suspendedAt] of Object.entries(
    params.contentSuspendedAtById,
  )) {
    if (!suspendedAt || contentSuspendById[contentId]) continue;

    const suspendedByUserId = params.contentSuspendedByUserIdById[contentId];
    contentSuspendById[contentId] = {
      at: suspendedAt,
      actorName: suspendedByUserId
        ? (contentSuspendedByNames[suspendedByUserId] ?? UNKNOWN_ACTOR)
        : UNKNOWN_ACTOR,
    };
  }

  const membershipSuspendById = await buildSuspendMetaFromActions(
    supabase,
    membershipActionsResult.data ?? [],
  );

  for (const [membershipId, suspendedAt] of Object.entries(
    params.membershipSuspendedAtById,
  )) {
    if (!suspendedAt || membershipSuspendById[membershipId]) continue;
    membershipSuspendById[membershipId] = {
      at: suspendedAt,
      actorName: UNKNOWN_ACTOR,
    };
  }

  return {
    reviewedByNameMap,
    suspendByReportId,
    contentSuspendById,
    membershipSuspendById,
  };
}

export function getReportResolutionMeta(
  report: {
    id: string;
    status: string;
    resolution: string | null;
    context_type: string;
    context_id: string;
    reviewed_at?: string | null;
    reviewed_by_user_id?: string | null;
  },
  authorMembershipId: string | null,
  maps: ReportResolutionMetaMaps,
): ReportResolutionMeta | null {
  if (report.status === "pending") return null;

  let fallback: ReportResolutionMeta | null = null;

  if (report.resolution === "content_suspended" && report.context_type !== "user") {
    fallback =
      maps.suspendByReportId[report.id] ??
      maps.contentSuspendById[report.context_id] ??
      null;
  } else if (report.resolution === "user_suspended" && authorMembershipId) {
    fallback = maps.membershipSuspendById[authorMembershipId] ?? null;
  }

  if (report.reviewed_at && report.reviewed_by_user_id) {
    return {
      at: report.reviewed_at,
      actorName:
        maps.reviewedByNameMap[report.reviewed_by_user_id] ?? UNKNOWN_ACTOR,
    };
  }

  if (report.reviewed_at) {
    return {
      at: report.reviewed_at,
      actorName: fallback?.actorName ?? UNKNOWN_ACTOR,
    };
  }

  return fallback;
}
