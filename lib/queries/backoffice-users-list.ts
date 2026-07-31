import type { SupabaseClient } from "@supabase/supabase-js";
import { PILOT_ACCESS_STATUSES } from "@/lib/constants/access-status";
import { fetchMemberEmails } from "@/lib/queries/backoffice-memberships";
import type { BackofficeUtilisateursListParams } from "@/lib/utils/backoffice-utilisateurs-params";
import {
  POPULATION_BRACKETS,
  type GlobalUserStats,
  type PopulationBracket,
  type PopulationBracketStats,
  type PopulationStatsResult,
  type UserListRow,
} from "@/lib/queries/backoffice-users-list.types";

export type {
  GlobalUserStats,
  PopulationBracket,
  PopulationBracketStats,
  PopulationStatsResult,
  UserListRow,
} from "@/lib/queries/backoffice-users-list.types";

export {
  POPULATION_BRACKETS,
  POPULATION_BRACKET_LABELS,
} from "@/lib/queries/backoffice-users-list.types";

function intersectUserIds(
  current: string[] | null,
  next: string[],
): string[] | null {
  if (next.length === 0) return [];
  if (!current) return next;
  const nextSet = new Set(next);
  return current.filter((id) => nextSet.has(id));
}

function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  displayName: string | null | undefined,
): string {
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return displayName?.trim() || "Utilisateur·rice";
}

function countByCommuneId(rows: { commune_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.commune_id, (counts.get(row.commune_id) ?? 0) + 1);
  }
  return counts;
}

function resolvePopulationBracket(population: number): PopulationBracket {
  if (population <= 500) return "0-500";
  if (population <= 800) return "501-800";
  if (population <= 1000) return "801-1000";
  return ">1000";
}

function applyProfileDateRange<T extends { gte: Function; lte: Function }>(
  query: T,
  dateFrom?: string,
  dateTo?: string,
): T {
  let next = query;
  if (dateFrom) {
    next = next.gte("created_at", `${dateFrom}T00:00:00.000Z`) as T;
  }
  if (dateTo) {
    next = next.lte("created_at", `${dateTo}T23:59:59.999Z`) as T;
  }
  return next;
}

export async function countGlobalStats(
  supabase: SupabaseClient,
): Promise<GlobalUserStats> {
  const now = new Date().toISOString();
  const [{ count: totalUsers }, { count: pendingInvitations }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true }),
      supabase
        .from("neighbor_invites")
        .select("id", { count: "exact", head: true })
        .is("accepted_at", null)
        .or(`expires_at.is.null,expires_at.gte.${now}`),
    ]);

  return {
    totalUsers: totalUsers ?? 0,
    pendingInvitations: pendingInvitations ?? 0,
  };
}

export async function listUsersPage(
  supabase: SupabaseClient,
  params: BackofficeUtilisateursListParams,
): Promise<{ items: UserListRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;
  let userIdsFilter: string[] | null = null;

  if (params.q) {
    const pattern = `%${params.q}%`;
    const { data: matchingProfiles } = await supabase
      .from("profiles")
      .select("user_id")
      .or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},display_name.ilike.${pattern}`,
      );

    userIdsFilter = (matchingProfiles ?? []).map((profile) => profile.user_id);
    if (userIdsFilter.length === 0) {
      return { items: [], totalCount: 0 };
    }
  }

  if (params.commune) {
    const { data } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("commune_id", params.commune)
      .neq("status", "left");

    userIdsFilter = intersectUserIds(
      userIdsFilter,
      (data ?? []).map((row) => row.user_id),
    );
    if (userIdsFilter !== null && userIdsFilter.length === 0) {
      return { items: [], totalCount: 0 };
    }
  }

  if (params.role) {
    const { data } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("role", params.role)
      .neq("status", "left");

    userIdsFilter = intersectUserIds(
      userIdsFilter,
      (data ?? []).map((row) => row.user_id),
    );
    if (userIdsFilter !== null && userIdsFilter.length === 0) {
      return { items: [], totalCount: 0 };
    }
  }

  if (params.membershipStatus) {
    const { data } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("status", params.membershipStatus);

    userIdsFilter = intersectUserIds(
      userIdsFilter,
      (data ?? []).map((row) => row.user_id),
    );
    if (userIdsFilter !== null && userIdsFilter.length === 0) {
      return { items: [], totalCount: 0 };
    }
  }

  let countQuery = supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true });

  let dataQuery = supabase
    .from("profiles")
    .select(
      "user_id, first_name, last_name, display_name, created_at, is_platform_admin, banned_at",
    );

  if (userIdsFilter) {
    countQuery = countQuery.in("user_id", userIdsFilter);
    dataQuery = dataQuery.in("user_id", userIdsFilter);
  }

  if (params.banned === true) {
    countQuery = countQuery.not("banned_at", "is", null);
    dataQuery = dataQuery.not("banned_at", "is", null);
  } else if (params.banned === false) {
    countQuery = countQuery.is("banned_at", null);
    dataQuery = dataQuery.is("banned_at", null);
  }

  if (params.admin === true) {
    countQuery = countQuery.eq("is_platform_admin", true);
    dataQuery = dataQuery.eq("is_platform_admin", true);
  } else if (params.admin === false) {
    countQuery = countQuery.eq("is_platform_admin", false);
    dataQuery = dataQuery.eq("is_platform_admin", false);
  }

  countQuery = applyProfileDateRange(
    countQuery,
    params.dateFrom,
    params.dateTo,
  );
  dataQuery = applyProfileDateRange(dataQuery, params.dateFrom, params.dateTo);

  dataQuery = dataQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + params.limit - 1);

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const rows = data ?? [];
  const pageUserIds = rows.map((row) => row.user_id);

  if (pageUserIds.length === 0) {
    return { items: [], totalCount: count ?? 0 };
  }

  const [emailMap, membershipsResult] = await Promise.all([
    fetchMemberEmails(pageUserIds),
    supabase
      .from("memberships")
      .select(
        "user_id, commune_id, status, total_announcements_published, total_initiatives_published, total_events_published",
      )
      .in("user_id", pageUserIds)
      .neq("status", "left"),
  ]);

  const membershipsByUser = new Map<
    string,
    Array<{
      commune_id: string;
      status: string;
      total_announcements_published: number;
      total_initiatives_published: number;
      total_events_published: number;
    }>
  >();

  for (const membership of membershipsResult.data ?? []) {
    const existing = membershipsByUser.get(membership.user_id) ?? [];
    existing.push(membership);
    membershipsByUser.set(membership.user_id, existing);
  }

  const items: UserListRow[] = rows.map((row) => {
    const memberships = membershipsByUser.get(row.user_id) ?? [];
    const activeCommuneIds = new Set(
      memberships
        .filter((membership) => membership.status === "active")
        .map((membership) => membership.commune_id),
    );
    const totalContentCount = memberships.reduce(
      (sum, membership) =>
        sum +
        (membership.total_announcements_published ?? 0) +
        (membership.total_initiatives_published ?? 0) +
        (membership.total_events_published ?? 0),
      0,
    );

    return {
      userId: row.user_id,
      fullName: formatFullName(
        row.first_name,
        row.last_name,
        row.display_name,
      ),
      email: emailMap.get(row.user_id) ?? null,
      createdAt: row.created_at,
      isPlatformAdmin: row.is_platform_admin ?? false,
      bannedAt: row.banned_at,
      communeCount: activeCommuneIds.size,
      totalContentCount,
    };
  });

  return {
    items,
    totalCount: count ?? 0,
  };
}

export async function getPopulationStats(
  supabase: SupabaseClient,
): Promise<PopulationStatsResult> {
  const now = new Date().toISOString();

  const [communesResult, membershipsResult, invitesResult] = await Promise.all([
    supabase
      .from("communes")
      .select("id, population")
      .in("access_status", [...PILOT_ACCESS_STATUSES]),
    supabase
      .from("memberships")
      .select("commune_id")
      .eq("status", "active"),
    supabase
      .from("neighbor_invites")
      .select("commune_id")
      .is("accepted_at", null)
      .or(`expires_at.is.null,expires_at.gte.${now}`),
  ]);

  const communes = communesResult.data ?? [];
  const memberCounts = countByCommuneId(membershipsResult.data ?? []);
  const inviteCounts = countByCommuneId(invitesResult.data ?? []);

  let communesWithoutPopulation = 0;
  const bracketTotals = new Map<
    PopulationBracket,
    { communeCount: number; members: number; invites: number }
  >();

  for (const bracket of POPULATION_BRACKETS) {
    bracketTotals.set(bracket, { communeCount: 0, members: 0, invites: 0 });
  }

  for (const commune of communes) {
    if (commune.population == null) {
      communesWithoutPopulation += 1;
      continue;
    }

    const bracket = resolvePopulationBracket(commune.population);
    const totals = bracketTotals.get(bracket)!;
    totals.communeCount += 1;
    totals.members += memberCounts.get(commune.id) ?? 0;
    totals.invites += inviteCounts.get(commune.id) ?? 0;
  }

  const brackets: PopulationBracketStats[] = POPULATION_BRACKETS.map(
    (bracket) => {
      const totals = bracketTotals.get(bracket)!;
      return {
        bracket,
        communeCount: totals.communeCount,
        avgMembers:
          totals.communeCount > 0
            ? Math.round((totals.members / totals.communeCount) * 10) / 10
            : 0,
        avgPendingInvites:
          totals.communeCount > 0
            ? Math.round((totals.invites / totals.communeCount) * 10) / 10
            : 0,
      };
    },
  );

  return {
    brackets,
    communesWithoutPopulation,
  };
}
