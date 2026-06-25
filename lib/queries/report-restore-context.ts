import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDisplayName } from "@/lib/utils/display-name";

export type ReportRestoreInfo = {
  at: string;
  actorName: string;
};

export type ReportRestoreContext = {
  isStillSuspended: boolean;
  lastRestore: ReportRestoreInfo | null;
};

export type ReportRestoreContextMaps = {
  contentStillSuspended: Record<string, boolean>;
  membershipStillSuspended: Record<string, boolean>;
  contentRestore: Record<string, ReportRestoreInfo>;
  membershipRestore: Record<string, ReportRestoreInfo>;
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

const CONTENT_TARGET_TYPES = new Set([
  "announcement",
  "initiative",
  "event",
]);

async function buildRestoreMapFromActions(
  supabase: SupabaseClient,
  actions: Array<{
    target_id: string;
    actor_user_id: string;
    created_at: string;
  }>,
): Promise<Record<string, ReportRestoreInfo>> {
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

  const actorNameByUserId: Record<string, string> = {};
  if (actorUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, display_name")
      .in("user_id", actorUserIds);

    for (const profile of profiles ?? []) {
      actorNameByUserId[profile.user_id] = resolveActorName(profile);
    }
  }

  const restoreMap: Record<string, ReportRestoreInfo> = {};
  for (const [targetId, entry] of latestByTarget) {
    restoreMap[targetId] = {
      at: entry.createdAt,
      actorName: actorNameByUserId[entry.actorUserId] ?? UNKNOWN_ACTOR,
    };
  }

  return restoreMap;
}

export async function buildRestoredByNameMap(
  supabase: SupabaseClient,
  reports: Array<{ restored_by_user_id?: string | null }>,
): Promise<Record<string, string>> {
  const userIds = [
    ...new Set(
      reports
        .map((report) => report.restored_by_user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  ];

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

export async function buildReportRestoreContextMaps(
  supabase: SupabaseClient,
  params: {
    contentIds: string[];
    membershipIds: string[];
    contentSuspendedAtById: Record<string, string | null>;
    membershipStatusById: Record<string, string>;
  },
): Promise<ReportRestoreContextMaps> {
  const contentStillSuspended: Record<string, boolean> = {};
  for (const [contentId, suspendedAt] of Object.entries(
    params.contentSuspendedAtById,
  )) {
    contentStillSuspended[contentId] = suspendedAt != null;
  }

  const membershipStillSuspended: Record<string, boolean> = {};
  for (const [membershipId, status] of Object.entries(
    params.membershipStatusById,
  )) {
    membershipStillSuspended[membershipId] = status === "suspended";
  }

  const uniqueContentIds = [...new Set(params.contentIds)];
  const uniqueMembershipIds = [...new Set(params.membershipIds)];

  const [contentActionsResult, membershipActionsResult] = await Promise.all([
    uniqueContentIds.length > 0
      ? supabase
          .from("moderation_actions")
          .select("target_id, target_type, actor_user_id, created_at")
          .eq("action", "reactivate")
          .in("target_id", uniqueContentIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
    uniqueMembershipIds.length > 0
      ? supabase
          .from("moderation_actions")
          .select("target_id, actor_user_id, created_at")
          .eq("action", "reactivate")
          .eq("target_type", "membership")
          .in("target_id", uniqueMembershipIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (contentActionsResult.error) {
    console.error(
      "[reports] Failed to load content reactivate actions:",
      contentActionsResult.error.message,
      contentActionsResult.error.code,
    );
  }

  if (membershipActionsResult.error) {
    console.error(
      "[reports] Failed to load membership reactivate actions:",
      membershipActionsResult.error.message,
      membershipActionsResult.error.code,
    );
  }

  const contentActions = (contentActionsResult.data ?? []).filter((action) =>
    CONTENT_TARGET_TYPES.has(action.target_type),
  );

  const [contentRestore, membershipRestore] = await Promise.all([
    buildRestoreMapFromActions(supabase, contentActions),
    buildRestoreMapFromActions(supabase, membershipActionsResult.data ?? []),
  ]);

  return {
    contentStillSuspended,
    membershipStillSuspended,
    contentRestore,
    membershipRestore,
  };
}

export function getReportRestoreContext(
  report: {
    resolution: string | null;
    context_type: string;
    context_id: string;
    restored_at?: string | null;
    restored_by_name?: string | null;
  },
  authorMembershipId: string | null,
  maps: ReportRestoreContextMaps,
): ReportRestoreContext | null {
  const reportRestore = report.restored_at
    ? {
        at: report.restored_at,
        actorName: report.restored_by_name ?? UNKNOWN_ACTOR,
      }
    : null;

  if (report.resolution === "content_suspended") {
    if (report.context_type === "user") return null;

    return {
      isStillSuspended: maps.contentStillSuspended[report.context_id] ?? false,
      lastRestore:
        reportRestore ?? maps.contentRestore[report.context_id] ?? null,
    };
  }

  if (report.resolution === "user_suspended") {
    if (!authorMembershipId) {
      return {
        isStillSuspended: false,
        lastRestore: reportRestore,
      };
    }

    return {
      isStillSuspended:
        maps.membershipStillSuspended[authorMembershipId] ?? false,
      lastRestore:
        reportRestore ?? maps.membershipRestore[authorMembershipId] ?? null,
    };
  }

  return null;
}
