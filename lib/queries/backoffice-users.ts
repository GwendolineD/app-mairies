import type { SupabaseClient } from "@supabase/supabase-js";
import type { MembershipRole, MembershipStatus } from "@/lib/types";

export type BackofficeUserMembershipRow = {
  membershipId: string;
  communeId: string;
  communeName: string;
  addressLabel: string;
  role: MembershipRole;
  status: MembershipStatus;
};

export type BackofficeUserDetail = {
  userId: string;
  fullName: string;
  createdAt: string;
  isPlatformAdmin: boolean;
  memberships: BackofficeUserMembershipRow[];
  totalAnnouncementsCount: number;
  totalInitiativesCount: number;
  totalEventsCount: number;
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

function formatAddress(
  street: string | null | undefined,
  city: string | null | undefined,
  postcode: string | null | undefined,
): string {
  const parts = [street, city, postcode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export async function getBackofficeUserDetail(
  supabase: SupabaseClient,
  userId: string,
): Promise<BackofficeUserDetail | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_name, created_at, is_platform_admin")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data: memberships, error: membershipsError } = await supabase
    .from("memberships")
    .select(
      "id, commune_id, role, status, address_street, address_city, address_postcode, commune:communes(name)",
    )
    .eq("user_id", userId)
    .neq("status", "left")
    .order("created_at", { ascending: false });

  if (membershipsError) return null;

  const membershipRows = memberships ?? [];
  const membershipIds = membershipRows.map((row) => row.id);

  let totalAnnouncementsCount = 0;
  let totalInitiativesCount = 0;
  let totalEventsCount = 0;

  if (membershipIds.length > 0) {
    const [
      { count: announcementsCount },
      { count: initiativesCount },
      { count: eventsCount },
    ] = await Promise.all([
      supabase
        .from("announcements")
        .select("*", { count: "exact", head: true })
        .in("author_membership_id", membershipIds),
      supabase
        .from("initiatives")
        .select("*", { count: "exact", head: true })
        .in("author_membership_id", membershipIds),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .in("author_membership_id", membershipIds),
    ]);

    totalAnnouncementsCount = announcementsCount ?? 0;
    totalInitiativesCount = initiativesCount ?? 0;
    totalEventsCount = eventsCount ?? 0;
  }

  const mappedMemberships: BackofficeUserMembershipRow[] = membershipRows.map((row) => {
    const commune = Array.isArray(row.commune) ? row.commune[0] : row.commune;
    return {
      membershipId: row.id,
      communeId: row.commune_id,
      communeName: commune?.name ?? "Commune",
      addressLabel: formatAddress(
        row.address_street,
        row.address_city,
        row.address_postcode,
      ),
      role: row.role as MembershipRole,
      status: row.status as MembershipStatus,
    };
  });

  return {
    userId: profile.user_id,
    fullName: formatFullName(
      profile.first_name,
      profile.last_name,
      profile.display_name,
    ),
    createdAt: profile.created_at,
    isPlatformAdmin: profile.is_platform_admin ?? false,
    memberships: mappedMemberships,
    totalAnnouncementsCount,
    totalInitiativesCount,
    totalEventsCount,
  };
}
