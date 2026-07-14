import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/lib/queries/messages";
import { getPushPublicKey } from "@/lib/actions/notifications";
import {
  listAuthorAnnouncementsPage,
  listAuthorEventsPage,
  listAuthorInitiativesPage,
  PROFILE_CONTENT_PAGE_SIZE,
  type ProfileListResult,
} from "@/lib/queries/profile-content";
import { ProfileSkeleton } from "@/components/features/profile/profile-skeleton";
import type { ProfileTabKey } from "@/components/features/profile/profile-tabs";
import { ProfilePageClient } from "@/components/features/profile/profile-page-client";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import type { AgendaEventRecord } from "@/lib/types";
import { formatAddressLabel } from "@/lib/utils/format-address";
import { parseProfileListParams } from "@/lib/utils/profile-list-params";

type SearchParams =
  | Promise<{
      tab?: string;
      page?: string;
      email_changed?: string;
      email_change_error?: string;
    }>
  | undefined;

const CONTENT_TABS = ["annonces", "initiatives", "evenements"] as const;
type ContentTabKey = (typeof CONTENT_TABS)[number];

function isContentTab(tab: ProfileTabKey): tab is ContentTabKey {
  return (CONTENT_TABS as readonly string[]).includes(tab);
}

export default function ProfilPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProfilContent({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = (await searchParams) ?? {};
  const { tab: activeTab, page } = parseProfileListParams(sp);
  const ctx = await requireActiveMembership();
  const profile = ctx.profile;
  const membership = ctx.activeMembership!;
  const communeId = membership.commune_id;
  const membershipId = membership.id;
  const scope = { communeId, membershipId };

  const supabase = await createClient();

  const needsContent = isContentTab(activeTab);

  const [
    contentResult,
    invitesResult,
    notificationPrefs,
    pushPublicKey,
    userResult,
    emailLifecycleResult,
  ] = await Promise.all([
    needsContent
      ? fetchActiveTabContent(supabase, activeTab, scope, page)
      : Promise.resolve(null),
    supabase
      .from("neighbor_invites")
      .select("id, email, created_at", { count: "exact" })
      .eq("commune_id", communeId)
      .eq("inviter_membership_id", membershipId)
      .order("created_at", { ascending: false })
      .limit(3),
    getNotificationPreferences(supabase, ctx.userId),
    getPushPublicKey(),
    supabase.auth.getUser(),
    supabase
      .from("user_notification_preferences")
      .select("email_lifecycle_enabled")
      .eq("user_id", ctx.userId)
      .maybeSingle(),
  ]);

  const user = userResult.data.user;

  const emptyList = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: PROFILE_CONTENT_PAGE_SIZE,
  };

  const announcementsList =
    activeTab === "annonces" && contentResult
      ? (contentResult as ProfileListResult<AnnouncementWithAuthor>)
      : emptyList;

  const initiativesList =
    activeTab === "initiatives" && contentResult
      ? (contentResult as ProfileListResult<InitiativeWithAuthor>)
      : emptyList;

  const eventsList =
    activeTab === "evenements" && contentResult
      ? (contentResult as ProfileListResult<AgendaEventRecord>)
      : emptyList;

  const displayName = getDisplayName(profile);
  const communeName = membership.commune?.name ?? "Votre commune";

  const fullAddress = formatAddressLabel(
    membership.address_street,
    membership.address_postcode,
    membership.address_city,
  );

  const inviteCount = invitesResult.count ?? invitesResult.data?.length ?? 0;

  const hasPassword =
    user?.identities?.some((identity) => identity.provider === "email") ?? false;

  const staffWarning = getStaffDeletionWarning(
    profile.is_platform_admin,
    membership.role,
    communeName,
  );

  return (
    <ProfilePageClient
      profile={{
        displayName,
        firstName: profile.first_name,
        lastName: profile.last_name,
        avatarUrl: profile.avatar_url,
        email: user?.email ?? null,
      }}
      membership={{
        fullAddress,
        communeName,
        joinedAt: membership.created_at,
        totalAnnouncements: membership.total_announcements_published ?? 0,
        totalInitiatives: membership.total_initiatives_published ?? 0,
        totalEvents: membership.total_events_published ?? 0,
        role: ctx.profile.is_platform_admin
          ? "Super admin"
          : membership.role === "mayor"
            ? "Maire"
            : membership.role === "staff"
              ? "Staff mairie"
              : "Résident·e",
        addressStreet: membership.address_street,
        addressPostcode: membership.address_postcode,
        addressCity: membership.address_city,
        addressCitycode: membership.address_citycode,
        addressLat: membership.address_lat,
        addressLng: membership.address_lng,
      }}
      activeTab={activeTab}
      announcements={announcementsList}
      initiatives={initiativesList}
      events={eventsList}
      invite={{
        senderName: displayName,
        communeName,
        inviteCount,
      }}
      settings={{
        notificationPrefs,
        pushPublicKey,
        emailLifecycleEnabled: emailLifecycleResult.data?.email_lifecycle_enabled ?? true,
        isPlatformAdmin: profile.is_platform_admin,
        hasPassword,
        staffWarning,
      }}
      emailChanged={sp.email_changed === "1"}
      emailChangeError={sp.email_change_error === "1"}
    />
  );
}

async function fetchActiveTabContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tab: ContentTabKey,
  scope: { communeId: string; membershipId: string },
  page: number,
) {
  switch (tab) {
    case "annonces":
      return listAuthorAnnouncementsPage(supabase, scope, { page });
    case "initiatives":
      return listAuthorInitiativesPage(supabase, scope, { page });
    case "evenements":
      return listAuthorEventsPage(supabase, scope, { page });
  }
}

function getStaffDeletionWarning(
  isPlatformAdmin: boolean,
  role: string,
  communeName: string,
): string | null {
  if (isPlatformAdmin) return null;

  if (role === "mayor") {
    return `Attention : vous êtes actuellement maire de ${communeName}. La commune n'aura plus de maire après la suppression.`;
  }

  if (role === "staff") {
    return `Attention : vous êtes actuellement staff de ${communeName}.`;
  }

  return null;
}

function getDisplayName(profile: {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
}) {
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || profile.display_name?.trim() || "Voisin·e";
}
