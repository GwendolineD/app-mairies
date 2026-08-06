import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDisplayName } from "@/lib/utils/display-name";
import {
  filterReports,
  type ReportListParams,
} from "@/lib/utils/report-list-params";
import {
  buildReportResolutionMetaMaps,
  type ReportResolutionMetaMaps,
} from "@/lib/queries/report-resolution-meta";
import {
  buildReportRestoreContextMaps,
  buildRestoredByNameMap,
  type ReportRestoreContextMaps,
} from "@/lib/queries/report-restore-context";

type ReportRow = {
  id: string;
  status: string;
  resolution: string | null;
  context_type: string;
  context_id: string;
  commune_id: string;
  reason: string;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by_user_id?: string | null;
  restored_at?: string | null;
  restored_by_user_id?: string | null;
  reporter_membership?: {
    profiles?: {
      display_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  } | null;
  commune?: { name?: string | null } | null;
};

type ContentContextType = "announcement" | "initiative" | "event";

type ContentMaps = {
  titleMap: Record<string, string>;
  authorMembershipIdMap: Record<string, string>;
  announcementTypeMap: Record<string, string>;
  contentSuspendedAtById: Record<string, string | null>;
  contentSuspendedByUserIdById: Record<string, string | null>;
  contentSuspensionReasonById: Record<string, string | null>;
};

function resolveJoinedProfile(
  profile:
    | {
        display_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
      }
    | Array<{
        display_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
      }>
    | null
    | undefined,
): string {
  const resolved = Array.isArray(profile) ? profile[0] : profile;
  return resolveDisplayName(resolved ?? {});
}

function emptyContentMaps(): ContentMaps {
  return {
    titleMap: {},
    authorMembershipIdMap: {},
    announcementTypeMap: {},
    contentSuspendedAtById: {},
    contentSuspendedByUserIdById: {},
    contentSuspensionReasonById: {},
  };
}

function mergeContentMaps(target: ContentMaps, source: ContentMaps): void {
  Object.assign(target.titleMap, source.titleMap);
  Object.assign(target.authorMembershipIdMap, source.authorMembershipIdMap);
  Object.assign(target.announcementTypeMap, source.announcementTypeMap);
  Object.assign(target.contentSuspendedAtById, source.contentSuspendedAtById);
  Object.assign(
    target.contentSuspendedByUserIdById,
    source.contentSuspendedByUserIdById,
  );
  Object.assign(
    target.contentSuspensionReasonById,
    source.contentSuspensionReasonById,
  );
}

async function fetchAnnouncementContentMaps(
  supabase: SupabaseClient,
  ids: string[],
): Promise<ContentMaps> {
  const maps = emptyContentMaps();
  if (ids.length === 0) return maps;

  const { data } = await supabase
    .from("announcements")
    .select(
      "id, title, author_membership_id, type, suspended_at, suspended_by, suspension_reason",
    )
    .in("id", ids);

  for (const row of data ?? []) {
    maps.titleMap[row.id] = row.title;
    maps.authorMembershipIdMap[row.id] = row.author_membership_id;
    maps.announcementTypeMap[row.id] = row.type;
    maps.contentSuspendedAtById[row.id] = row.suspended_at;
    maps.contentSuspendedByUserIdById[row.id] = row.suspended_by;
    maps.contentSuspensionReasonById[row.id] = row.suspension_reason;
  }

  return maps;
}

async function fetchGenericContentMaps(
  supabase: SupabaseClient,
  table: "initiatives" | "events",
  ids: string[],
): Promise<ContentMaps> {
  const maps = emptyContentMaps();
  if (ids.length === 0) return maps;

  const { data } = await supabase
    .from(table)
    .select(
      "id, title, author_membership_id, suspended_at, suspended_by, suspension_reason",
    )
    .in("id", ids);

  for (const row of data ?? []) {
    maps.titleMap[row.id] = row.title;
    maps.authorMembershipIdMap[row.id] = row.author_membership_id;
    maps.contentSuspendedAtById[row.id] = row.suspended_at;
    maps.contentSuspendedByUserIdById[row.id] = row.suspended_by;
    maps.contentSuspensionReasonById[row.id] = row.suspension_reason;
  }

  return maps;
}

async function fetchContentMaps(
  supabase: SupabaseClient,
  contentIds: Array<{ type: string; id: string }>,
): Promise<ContentMaps> {
  const idsByType: Record<ContentContextType, string[]> = {
    announcement: [],
    initiative: [],
    event: [],
  };

  for (const entry of contentIds) {
    if (
      entry.type === "announcement" ||
      entry.type === "initiative" ||
      entry.type === "event"
    ) {
      idsByType[entry.type].push(entry.id);
    }
  }

  const [announcements, initiatives, events] = await Promise.all([
    fetchAnnouncementContentMaps(supabase, idsByType.announcement),
    fetchGenericContentMaps(supabase, "initiatives", idsByType.initiative),
    fetchGenericContentMaps(supabase, "events", idsByType.event),
  ]);

  const merged = emptyContentMaps();
  mergeContentMaps(merged, announcements);
  mergeContentMaps(merged, initiatives);
  mergeContentMaps(merged, events);
  return merged;
}

async function fetchUserReportMembershipMaps(
  supabase: SupabaseClient,
  reports: ReportRow[],
  options: { communeId?: string } = {},
): Promise<{
  userReportMembershipIdMap: Record<string, string>;
  membershipStatusById: Record<string, string>;
  membershipSuspendedAtById: Record<string, string | null>;
}> {
  const userReportMembershipIdMap: Record<string, string> = {};
  const membershipStatusById: Record<string, string> = {};
  const membershipSuspendedAtById: Record<string, string | null> = {};

  const userReportUserIds = [
    ...new Set(
      reports
        .filter((report) => report.context_type === "user")
        .map((report) => report.context_id),
    ),
  ];

  if (userReportUserIds.length === 0) {
    return {
      userReportMembershipIdMap,
      membershipStatusById,
      membershipSuspendedAtById,
    };
  }

  let query = supabase
    .from("memberships")
    .select("id, user_id, commune_id, status, suspended_at")
    .in("user_id", userReportUserIds);

  if (options.communeId) {
    query = query.eq("commune_id", options.communeId);
  }

  const { data: userReportMemberships } = await query;

  for (const row of userReportMemberships ?? []) {
    const mapKey = options.communeId
      ? row.user_id
      : `${row.commune_id}:${row.user_id}`;
    userReportMembershipIdMap[mapKey] = row.id;
    membershipStatusById[row.id] = row.status;
    membershipSuspendedAtById[row.id] = row.suspended_at;
  }

  return {
    userReportMembershipIdMap,
    membershipStatusById,
    membershipSuspendedAtById,
  };
}

async function fetchAuthorMembershipMaps(
  supabase: SupabaseClient,
  authorMembershipIds: string[],
): Promise<{
  authorUserIdMap: Record<string, string>;
  authorNameByMembershipId: Record<string, string>;
  membershipStatusById: Record<string, string>;
  membershipSuspendedAtById: Record<string, string | null>;
}> {
  const authorUserIdMap: Record<string, string> = {};
  const authorNameByMembershipId: Record<string, string> = {};
  const membershipStatusById: Record<string, string> = {};
  const membershipSuspendedAtById: Record<string, string | null> = {};

  if (authorMembershipIds.length === 0) {
    return {
      authorUserIdMap,
      authorNameByMembershipId,
      membershipStatusById,
      membershipSuspendedAtById,
    };
  }

  const { data: authorMemberships } = await supabase
    .from("memberships")
    .select(
      "id, user_id, status, suspended_at, profiles:profiles!memberships_profiles_user_id_fkey(display_name, first_name, last_name)",
    )
    .in("id", authorMembershipIds);

  for (const row of authorMemberships ?? []) {
    authorUserIdMap[row.id] = row.user_id;
    authorNameByMembershipId[row.id] = resolveJoinedProfile(row.profiles);
    membershipStatusById[row.id] = row.status;
    membershipSuspendedAtById[row.id] = row.suspended_at;
  }

  return {
    authorUserIdMap,
    authorNameByMembershipId,
    membershipStatusById,
    membershipSuspendedAtById,
  };
}

type ReportQueryBuilder = {
  eq: Function;
  or: Function;
  in: Function;
  order: Function;
  range: Function;
};

function applyReportSqlFilters<T extends ReportQueryBuilder>(
  query: T,
  params: ReportListParams,
): T {
  let next = query;

  if (params.statuses.length > 0) {
    const parts = params.statuses.map((status) =>
      status === "pending" ? "status.eq.pending" : `resolution.eq.${status}`,
    );
    next = next.or(parts.join(",")) as T;
  }

  const structuralTypes = params.contentTypes.filter(
    (type) => type === "initiative" || type === "event",
  );
  if (structuralTypes.length === 1) {
    next = next.eq("context_type", structuralTypes[0]) as T;
  } else if (structuralTypes.length === 2) {
    next = next.in("context_type", ["initiative", "event"]) as T;
  }

  return next;
}

async function fetchReportCountByContext(
  supabase: SupabaseClient,
  options: { communeId?: string },
): Promise<Map<string, number>> {
  let query = supabase
    .from("reports")
    .select("context_type, context_id")
    .neq("context_type", "user");

  if (options.communeId) {
    query = query.eq("commune_id", options.communeId);
  }

  const { data } = await query;
  const reportCountByContext = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.context_type}:${row.context_id}`;
    reportCountByContext.set(key, (reportCountByContext.get(key) ?? 0) + 1);
  }
  return reportCountByContext;
}

function resolveUserReportMembershipId(
  report: ReportRow,
  userReportMembershipIdMap: Record<string, string>,
  scopedCommuneId?: string,
): string | null {
  if (report.context_type !== "user") return null;
  if (scopedCommuneId) {
    return userReportMembershipIdMap[report.context_id] ?? null;
  }
  return (
    userReportMembershipIdMap[`${report.commune_id}:${report.context_id}`] ??
    null
  );
}

export type SignalementsPageData = {
  reports: ReportRow[];
  filteredReports: ReportRow[];
  totalCount: number;
  titleMap: Record<string, string>;
  authorMembershipIdMap: Record<string, string>;
  announcementTypeMap: Record<string, string>;
  contentSuspensionReasonById: Record<string, string | null>;
  authorUserIdMap: Record<string, string>;
  authorNameByMembershipId: Record<string, string>;
  userReportMembershipIdMap: Record<string, string>;
  resolutionMetaMaps: ReportResolutionMetaMaps;
  restoreContextMaps: ReportRestoreContextMaps;
  restoredByNameMap: Record<string, string>;
  reportCountByContext: Map<string, number>;
  resolveUserReportMembershipId: (report: ReportRow) => string | null;
};

async function getReportsPageData(
  supabase: SupabaseClient,
  listParams: ReportListParams,
  options: { communeId?: string } = {},
): Promise<SignalementsPageData> {
  const offset = (listParams.page - 1) * listParams.limit;
  const selectFields = options.communeId
    ? `*, reporter_membership:memberships!reports_reporter_membership_id_fkey(
        profiles:profiles!memberships_profiles_user_id_fkey(display_name, first_name, last_name)
      )`
    : `*, reporter_membership:memberships!reports_reporter_membership_id_fkey(
        profiles:profiles!memberships_profiles_user_id_fkey(display_name, first_name, last_name)
      ), commune:communes!reports_commune_id_fkey(name)`;

  let dataQuery = supabase
    .from("reports")
    .select(selectFields, { count: "exact" })
    .order("created_at", { ascending: listParams.tri === "oldest" })
    .range(offset, offset + listParams.limit - 1);

  let countQuery = supabase
    .from("reports")
    .select("id", { count: "exact", head: true });

  if (options.communeId) {
    dataQuery = dataQuery.eq("commune_id", options.communeId);
    countQuery = countQuery.eq("commune_id", options.communeId);
  }

  dataQuery = applyReportSqlFilters(dataQuery, listParams);
  countQuery = applyReportSqlFilters(countQuery, listParams);

  const [{ data: reports, error }, { count }] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  if (error) {
    throw error;
  }

  const reportRows = (reports ?? []) as unknown as ReportRow[];
  const contentIds = reportRows
    .filter((report) => report.context_type !== "user")
    .map((report) => ({ type: report.context_type, id: report.context_id }));

  const [contentMaps, userMembershipMaps, reportCountByContext] =
    await Promise.all([
      fetchContentMaps(supabase, contentIds),
      fetchUserReportMembershipMaps(supabase, reportRows, {
        communeId: options.communeId,
      }),
      fetchReportCountByContext(supabase, options),
    ]);

  const authorMembershipIds = [
    ...new Set(Object.values(contentMaps.authorMembershipIdMap)),
  ];

  const authorMembershipMaps = await fetchAuthorMembershipMaps(
    supabase,
    authorMembershipIds,
  );

  const membershipStatusById = {
    ...userMembershipMaps.membershipStatusById,
    ...authorMembershipMaps.membershipStatusById,
  };
  const membershipSuspendedAtById = {
    ...userMembershipMaps.membershipSuspendedAtById,
    ...authorMembershipMaps.membershipSuspendedAtById,
  };

  const allMembershipIds = [
    ...authorMembershipIds,
    ...Object.values(userMembershipMaps.userReportMembershipIdMap),
  ];

  const [resolutionMetaMaps, restoreContextMaps, restoredByNameMap] =
    await Promise.all([
      buildReportResolutionMetaMaps(supabase, {
        reports: reportRows,
        contentIds: contentIds.map((entry) => entry.id),
        membershipIds: allMembershipIds,
        contentSuspendedAtById: contentMaps.contentSuspendedAtById,
        contentSuspendedByUserIdById: contentMaps.contentSuspendedByUserIdById,
        membershipSuspendedAtById,
      }),
      buildReportRestoreContextMaps(supabase, {
        contentIds: contentIds.map((entry) => entry.id),
        membershipIds: allMembershipIds,
        contentSuspendedAtById: contentMaps.contentSuspendedAtById,
        membershipStatusById,
      }),
      buildRestoredByNameMap(supabase, reportRows),
    ]);

  const filteredReports = filterReports(
    reportRows,
    listParams,
    contentMaps.announcementTypeMap,
    contentMaps.titleMap,
  );

  return {
    reports: reportRows,
    filteredReports,
    totalCount: count ?? 0,
    titleMap: contentMaps.titleMap,
    authorMembershipIdMap: contentMaps.authorMembershipIdMap,
    announcementTypeMap: contentMaps.announcementTypeMap,
    contentSuspensionReasonById: contentMaps.contentSuspensionReasonById,
    authorUserIdMap: authorMembershipMaps.authorUserIdMap,
    authorNameByMembershipId: authorMembershipMaps.authorNameByMembershipId,
    userReportMembershipIdMap: userMembershipMaps.userReportMembershipIdMap,
    resolutionMetaMaps,
    restoreContextMaps,
    restoredByNameMap,
    reportCountByContext,
    resolveUserReportMembershipId: (report) =>
      resolveUserReportMembershipId(
        report,
        userMembershipMaps.userReportMembershipIdMap,
        options.communeId,
      ),
  };
}

export async function getSignalementsPageData(
  supabase: SupabaseClient,
  listParams: ReportListParams,
): Promise<SignalementsPageData> {
  return getReportsPageData(supabase, listParams);
}

export async function getMairieSignalementsPageData(
  supabase: SupabaseClient,
  communeId: string,
  listParams: ReportListParams,
): Promise<SignalementsPageData> {
  return getReportsPageData(supabase, listParams, { communeId });
}
