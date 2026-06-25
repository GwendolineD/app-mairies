import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackofficeMembersListParams } from "@/lib/utils/backoffice-search-params";
import type { HabitantsSort } from "@/lib/utils/habitants-list-params";
import type { MembershipRole, MembershipStatus } from "@/lib/types";

export type CommuneMemberRow = {
  membershipId: string;
  userId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: MembershipRole;
  isPlatformAdmin: boolean;
  status: MembershipStatus;
  joinedAt: string;
  suspendedAt: string | null;
  suspendedByName: string | null;
  suspendedReason: string | null;
};

function formatFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  displayName: string | null | undefined,
): string {
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return displayName?.trim() || "Utilisateur·rice";
}

function sortCommuneMembers(
  items: CommuneMemberRow[],
  sort: HabitantsSort | undefined,
): CommuneMemberRow[] {
  if (!sort || sort === "recent") return items;

  const direction = sort === "name_asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName, "fr", {
      sensitivity: "base",
    });
    if (lastNameCompare !== 0) return lastNameCompare * direction;

    return (
      a.firstName.localeCompare(b.firstName, "fr", { sensitivity: "base" }) *
      direction
    );
  });
}

export async function listCommuneMembersPage(
  supabase: SupabaseClient,
  communeId: string,
  params: BackofficeMembersListParams & {
    sort?: HabitantsSort;
    roles?: MembershipRole[];
    statuses?: MembershipStatus[];
  },
): Promise<{ items: CommuneMemberRow[]; totalCount: number }> {
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

  let countQuery = supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("commune_id", communeId)
    .neq("status", "left");

  let dataQuery = supabase
    .from("memberships")
    .select(
      "id, user_id, role, status, created_at, suspended_at, suspension_reason, profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url, is_platform_admin)",
    )
    .eq("commune_id", communeId)
    .neq("status", "left")
    .order("created_at", { ascending: false })
    .range(offset, offset + params.limit - 1);

  if (userIdsFilter) {
    countQuery = countQuery.in("user_id", userIdsFilter);
    dataQuery = dataQuery.in("user_id", userIdsFilter);
  }

  const roleFilters =
    params.roles && params.roles.length > 0
      ? params.roles
      : params.role
        ? [params.role]
        : null;
  const statusFilters =
    params.statuses && params.statuses.length > 0
      ? params.statuses
      : params.status
        ? [params.status]
        : null;

  if (roleFilters) {
    countQuery = countQuery.in("role", roleFilters);
    dataQuery = dataQuery.in("role", roleFilters);
  }

  if (statusFilters) {
    countQuery = countQuery.in("status", statusFilters);
    dataQuery = dataQuery.in("status", statusFilters);
  }

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const suspendedMembershipIds = (data ?? [])
    .filter((row) => row.status === "suspended")
    .map((row) => row.id);

  const suspendedByMap: Record<string, string> = {};

  if (suspendedMembershipIds.length > 0) {
    const { data: suspendActions } = await supabase
      .from("moderation_actions")
      .select("target_id, actor_user_id, created_at")
      .eq("target_type", "membership")
      .eq("action", "suspend")
      .in("target_id", suspendedMembershipIds)
      .order("created_at", { ascending: false });

    const latestActorByMembership = new Map<string, string>();
    for (const action of suspendActions ?? []) {
      if (!latestActorByMembership.has(action.target_id)) {
        latestActorByMembership.set(action.target_id, action.actor_user_id);
      }
    }

    const actorUserIds = [...new Set(latestActorByMembership.values())];
    if (actorUserIds.length > 0) {
      const { data: actorProfiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, display_name")
        .in("user_id", actorUserIds);

      const actorNameByUserId = Object.fromEntries(
        (actorProfiles ?? []).map((profile) => [
          profile.user_id,
          formatFullName(
            profile.first_name,
            profile.last_name,
            profile.display_name,
          ),
        ]),
      );

      for (const [membershipId, actorUserId] of latestActorByMembership) {
        const name = actorNameByUserId[actorUserId];
        if (name) suspendedByMap[membershipId] = name;
      }
    }
  }

  const items: CommuneMemberRow[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const firstName =
      profile?.first_name?.trim() || profile?.display_name?.trim() || "—";
    const lastName = profile?.last_name?.trim() || "—";

    return {
      membershipId: row.id,
      userId: row.user_id,
      fullName: formatFullName(
        profile?.first_name,
        profile?.last_name,
        profile?.display_name,
      ),
      firstName,
      lastName,
      avatarUrl: profile?.avatar_url ?? null,
      role: row.role as MembershipRole,
      isPlatformAdmin: profile?.is_platform_admin ?? false,
      status: row.status as MembershipStatus,
      joinedAt: row.created_at,
      suspendedAt: row.suspended_at ?? null,
      suspendedByName: suspendedByMap[row.id] ?? null,
      suspendedReason: row.suspension_reason ?? null,
    };
  });

  return {
    items: sortCommuneMembers(items, params.sort),
    totalCount: count ?? 0,
  };
}
