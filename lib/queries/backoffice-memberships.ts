import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackofficeMembersListParams } from "@/lib/utils/backoffice-search-params";
import type { MembershipRole, MembershipStatus } from "@/lib/types";

export type CommuneMemberRow = {
  membershipId: string;
  userId: string;
  fullName: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string;
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

export async function listCommuneMembersPage(
  supabase: SupabaseClient,
  communeId: string,
  params: BackofficeMembersListParams,
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
      "id, user_id, role, status, created_at, profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name)",
    )
    .eq("commune_id", communeId)
    .neq("status", "left")
    .order("created_at", { ascending: false })
    .range(offset, offset + params.limit - 1);

  if (userIdsFilter) {
    countQuery = countQuery.in("user_id", userIdsFilter);
    dataQuery = dataQuery.in("user_id", userIdsFilter);
  }

  if (params.role) {
    countQuery = countQuery.eq("role", params.role);
    dataQuery = dataQuery.eq("role", params.role);
  }

  if (params.status) {
    countQuery = countQuery.eq("status", params.status);
    dataQuery = dataQuery.eq("status", params.status);
  }

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const items: CommuneMemberRow[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return {
      membershipId: row.id,
      userId: row.user_id,
      fullName: formatFullName(
        profile?.first_name,
        profile?.last_name,
        profile?.display_name,
      ),
      role: row.role as MembershipRole,
      status: row.status as MembershipStatus,
      joinedAt: row.created_at,
    };
  });

  return { items, totalCount: count ?? 0 };
}
