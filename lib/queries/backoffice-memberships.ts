import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackofficeMembersListParams } from "@/lib/utils/backoffice-search-params";
import type { HabitantsSort } from "@/lib/utils/habitants-list-params";
import type { MembershipRole, MembershipStatus, NotificationPreferences } from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/server";

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
  addressStreet: string | null;
  addressLieuDit: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  totalAnnouncements: number;
  totalInitiatives: number;
  totalEvents: number;
  bannedAt: string | null;
  banReason: string | null;
  email: string | null;
  hasPushNotifications: boolean;
  notificationPreferences: NotificationPreferences | null;
  invitationCount: number;
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

function intersectUserIds(
  current: string[] | null,
  next: string[],
): string[] | null {
  if (next.length === 0) return [];
  if (!current) return next;
  const nextSet = new Set(next);
  return current.filter((id) => nextSet.has(id));
}

function applyMemberSort<T extends { order: Function }>(
  query: T,
  sort: HabitantsSort | undefined,
): T {
  switch (sort) {
    case "name_asc":
      return query
        .order("profile(last_name)", { ascending: true, nullsFirst: false })
        .order("profile(first_name)", { ascending: true, nullsFirst: false });
    case "name_desc":
      return query
        .order("profile(last_name)", { ascending: false, nullsFirst: true })
        .order("profile(first_name)", { ascending: false, nullsFirst: true });
    default:
      return query.order("created_at", { ascending: false });
  }
}

export async function fetchMemberEmails(
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (userIds.length === 0) return map;

  const serviceClient = await createServiceClient();
  const results = await Promise.all(
    userIds.map((id) => serviceClient.auth.admin.getUserById(id)),
  );

  for (const { data } of results) {
    if (data?.user?.email) {
      map.set(data.user.id, data.user.email);
    }
  }

  return map;
}

export async function fetchMembersNotificationInfo(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<
  Map<string, { hasPush: boolean; preferences: NotificationPreferences | null }>
> {
  const map = new Map<
    string,
    { hasPush: boolean; preferences: NotificationPreferences | null }
  >();
  if (userIds.length === 0) return map;

  const [pushResult, prefsResult] = await Promise.all([
    supabase.from("push_subscriptions").select("user_id").in("user_id", userIds),
    supabase
      .from("user_notification_preferences")
      .select(
        "user_id, notify_message_announcement, notify_message_initiative, notify_message_event, notify_initiative_support, notify_event_participation, notify_event_volunteer, notify_new_announcement, notify_new_initiative, notify_new_event",
      )
      .in("user_id", userIds),
  ]);

  const pushUserIds = new Set((pushResult.data ?? []).map((row) => row.user_id));
  const prefsByUserId = new Map(
    (prefsResult.data ?? []).map((row) => [
      row.user_id,
      {
        notify_message_announcement: row.notify_message_announcement,
        notify_message_initiative: row.notify_message_initiative,
        notify_message_event: row.notify_message_event,
        notify_initiative_support: row.notify_initiative_support,
        notify_event_participation: row.notify_event_participation,
        notify_event_volunteer: row.notify_event_volunteer,
        notify_new_announcement: row.notify_new_announcement,
        notify_new_initiative: row.notify_new_initiative,
        notify_new_event: row.notify_new_event,
      } satisfies NotificationPreferences,
    ]),
  );

  for (const userId of userIds) {
    map.set(userId, {
      hasPush: pushUserIds.has(userId),
      preferences: prefsByUserId.get(userId) ?? null,
    });
  }

  return map;
}

export async function countMemberInvitations(
  supabase: SupabaseClient,
  membershipIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (membershipIds.length === 0) return map;

  for (const membershipId of membershipIds) {
    map.set(membershipId, 0);
  }

  const { data } = await supabase
    .from("neighbor_invites")
    .select("inviter_membership_id")
    .in("inviter_membership_id", membershipIds);

  for (const row of data ?? []) {
    map.set(
      row.inviter_membership_id,
      (map.get(row.inviter_membership_id) ?? 0) + 1,
    );
  }

  return map;
}

export async function listCommuneMembersPage(
  supabase: SupabaseClient,
  communeId: string,
  params: BackofficeMembersListParams & {
    sort?: HabitantsSort;
    roles?: MembershipRole[];
    joinedFrom?: string;
    joinedTo?: string;
  },
): Promise<{ items: CommuneMemberRow[]; totalCount: number }> {
  const offset = (params.page - 1) * params.limit;
  let userIdsFilter: string[] | null = null;
  let excludeUserIds: string[] | null = null;

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

  if (params.banned) {
    const { data: bannedProfiles } = await supabase
      .from("profiles")
      .select("user_id")
      .not("banned_at", "is", null);

    userIdsFilter = intersectUserIds(
      userIdsFilter,
      (bannedProfiles ?? []).map((profile) => profile.user_id),
    );
    if (userIdsFilter !== null && userIdsFilter.length === 0) {
      return { items: [], totalCount: 0 };
    }
  }

  if (params.notifications === "active" || params.notifications === "inactive") {
    const { data: pushSubscriptions } = await supabase
      .from("push_subscriptions")
      .select("user_id");

    const pushUserIds = [
      ...new Set((pushSubscriptions ?? []).map((row) => row.user_id)),
    ];

    if (params.notifications === "active") {
      userIdsFilter = intersectUserIds(userIdsFilter, pushUserIds);
      if (userIdsFilter !== null && userIdsFilter.length === 0) {
        return { items: [], totalCount: 0 };
      }
    } else if (pushUserIds.length > 0) {
      excludeUserIds = pushUserIds;
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
      "id, user_id, role, status, created_at, suspended_at, suspension_reason, address_street, address_lieu_dit, address_city, address_postcode, total_announcements_published, total_initiatives_published, total_events_published, profile:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url, is_platform_admin, banned_at, ban_reason)",
    )
    .eq("commune_id", communeId)
    .neq("status", "left");

  if (userIdsFilter) {
    countQuery = countQuery.in("user_id", userIdsFilter);
    dataQuery = dataQuery.in("user_id", userIdsFilter);
  }

  if (excludeUserIds && excludeUserIds.length > 0) {
    countQuery = countQuery.not("user_id", "in", `(${excludeUserIds.join(",")})`);
    dataQuery = dataQuery.not("user_id", "in", `(${excludeUserIds.join(",")})`);
  }

  const roleFilters =
    params.roles && params.roles.length > 0
      ? params.roles
      : params.role
        ? [params.role]
        : null;
  const statusFilters =
    params.statuses.length > 0
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

  if (params.joinedFrom) {
    countQuery = countQuery.gte("created_at", params.joinedFrom);
    dataQuery = dataQuery.gte("created_at", params.joinedFrom);
  }

  if (params.joinedTo) {
    countQuery = countQuery.lte("created_at", params.joinedTo);
    dataQuery = dataQuery.lte("created_at", params.joinedTo);
  }

  dataQuery = applyMemberSort(dataQuery, params.sort).range(
    offset,
    offset + params.limit - 1,
  );

  const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return { items: [], totalCount: 0 };
  }

  const rows = data ?? [];
  const userIds = rows.map((row) => row.user_id);
  const membershipIds = rows.map((row) => row.id);

  const suspendedMembershipIds = rows
    .filter((row) => row.status === "suspended")
    .map((row) => row.id);

  const [emailMap, notificationMap, invitationMap, suspendedByMap] =
    await Promise.all([
      fetchMemberEmails(userIds),
      fetchMembersNotificationInfo(supabase, userIds),
      countMemberInvitations(supabase, membershipIds),
      loadSuspendedByMap(supabase, suspendedMembershipIds),
    ]);

  const items: CommuneMemberRow[] = rows.map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const firstName =
      profile?.first_name?.trim() || profile?.display_name?.trim() || "—";
    const lastName = profile?.last_name?.trim() || "—";
    const notificationInfo = notificationMap.get(row.user_id);

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
      addressStreet: row.address_street ?? null,
      addressLieuDit: row.address_lieu_dit ?? null,
      addressCity: row.address_city ?? null,
      addressPostcode: row.address_postcode ?? null,
      totalAnnouncements: row.total_announcements_published ?? 0,
      totalInitiatives: row.total_initiatives_published ?? 0,
      totalEvents: row.total_events_published ?? 0,
      bannedAt: profile?.banned_at ?? null,
      banReason: profile?.ban_reason ?? null,
      email: emailMap.get(row.user_id) ?? null,
      hasPushNotifications: notificationInfo?.hasPush ?? false,
      notificationPreferences: notificationInfo?.preferences ?? null,
      invitationCount: invitationMap.get(row.id) ?? 0,
    };
  });

  return {
    items,
    totalCount: count ?? 0,
  };
}

async function loadSuspendedByMap(
  supabase: SupabaseClient,
  suspendedMembershipIds: string[],
): Promise<Record<string, string>> {
  const suspendedByMap: Record<string, string> = {};
  if (suspendedMembershipIds.length === 0) return suspendedByMap;

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
  if (actorUserIds.length === 0) return suspendedByMap;

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

  return suspendedByMap;
}
