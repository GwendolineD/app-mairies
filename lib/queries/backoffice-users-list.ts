import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchMemberEmails } from "@/lib/queries/backoffice-memberships";
import { createServiceClient } from "@/lib/supabase/server";
import type { BackofficeUtilisateursListParams } from "@/lib/utils/backoffice-utilisateurs-params";
import {
  resolvePopulationBracket,
} from "@/lib/queries/population-brackets";
import {
  POPULATION_BRACKETS,
  type GlobalUserStats,
  type PopulationBracket,
  type PopulationBracketStats,
  type PopulationStatsResult,
  type UserListRow,
} from "@/lib/queries/backoffice-users-list.types";

export { countByCommuneId, resolvePopulationBracket } from "@/lib/queries/population-brackets";

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

function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  displayName: string | null | undefined,
): string {
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return displayName?.trim() || "Utilisateur·rice";
}

function toProfileDateBound(
  date: string | undefined,
  endOfDay: boolean,
): string | null {
  if (!date) return null;
  return endOfDay ? `${date}T23:59:59.999Z` : `${date}T00:00:00.000Z`;
}

export async function countGlobalStats(
  supabase: SupabaseClient,
): Promise<GlobalUserStats> {
  const now = new Date().toISOString();
  const [
    { count: totalUsers },
    { count: pendingInvitations },
    { count: totalInvitations },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true }),
    supabase
      .from("neighbor_invites")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .or(`expires_at.is.null,expires_at.gte.${now}`),
    supabase
      .from("neighbor_invites")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    pendingInvitations: pendingInvitations ?? 0,
    totalInvitations: totalInvitations ?? 0,
  };
}

export async function listUsersPage(
  supabase: SupabaseClient,
  params: BackofficeUtilisateursListParams,
): Promise<{ items: UserListRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;
  const serviceClient = await createServiceClient();

  const { data: rows, error } = await serviceClient.rpc("list_filtered_users_page", {
    p_q: params.q.trim() || undefined,
    p_banned: params.banned,
    p_admin: params.admin,
    p_date_from: toProfileDateBound(params.dateFrom, false) ?? undefined,
    p_date_to: toProfileDateBound(params.dateTo, true) ?? undefined,
    p_commune_id: params.commune,
    p_role: params.role,
    p_membership_status: params.membershipStatus,
    p_limit: params.limit,
    p_offset: offset,
  });

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const pageRows = rows ?? [];
  const totalCount = pageRows[0]?.total_count ?? 0;
  const pageUserIds = pageRows.map((row) => row.user_id);

  if (pageUserIds.length === 0) {
    return { items: [], totalCount: Number(totalCount) };
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

  const items: UserListRow[] = pageRows.map((row) => {
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
    totalCount: Number(totalCount),
  };
}

export async function getPopulationStats(
  supabase: SupabaseClient,
): Promise<PopulationStatsResult> {
  void supabase;
  const serviceClient = await createServiceClient();
  const { data: communeRows, error } = await serviceClient.rpc(
    "count_population_by_commune",
  );

  if (error) {
    return {
      brackets: POPULATION_BRACKETS.map((bracket) => ({
        bracket,
        communeCount: 0,
        avgMembers: 0,
        avgPendingInvites: 0,
        avgTotalInvites: 0,
      })),
      communesWithoutPopulation: 0,
    };
  }

  const communes = communeRows ?? [];

  let communesWithoutPopulation = 0;
  const bracketTotals = new Map<
    PopulationBracket,
    { communeCount: number; members: number; invites: number; totalInvites: number }
  >();

  for (const bracket of POPULATION_BRACKETS) {
    bracketTotals.set(bracket, {
      communeCount: 0,
      members: 0,
      invites: 0,
      totalInvites: 0,
    });
  }

  for (const commune of communes) {
    if (commune.population == null) {
      communesWithoutPopulation += 1;
      continue;
    }

    const bracket = resolvePopulationBracket(commune.population);
    const totals = bracketTotals.get(bracket)!;
    totals.communeCount += 1;
    totals.members += Number(commune.active_members ?? 0);
    totals.invites += Number(commune.pending_invites ?? 0);
    totals.totalInvites += Number(commune.total_invites ?? 0);
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
        avgTotalInvites:
          totals.communeCount > 0
            ? Math.round((totals.totalInvites / totals.communeCount) * 10) / 10
            : 0,
      };
    },
  );

  return {
    brackets,
    communesWithoutPopulation,
  };
}
