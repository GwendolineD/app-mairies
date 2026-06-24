import { Suspense } from "react";
import { requireActiveMembership } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/lib/queries/messages";
import { getPushPublicKey } from "@/lib/actions/notifications";
import { ProfileSkeleton } from "@/components/features/profile/profile-skeleton";
import {
  isProfileTab,
  type ProfileTabKey,
} from "@/components/features/profile/profile-tabs";
import { ProfilePageClient } from "@/components/features/profile/profile-page-client";
import type { AnnouncementWithAuthor } from "@/lib/queries/announcements";
import type { InitiativeWithAuthor } from "@/lib/queries/initiatives";
import { enrichInitiativesWithMeta } from "@/lib/queries/initiatives";
import type { AgendaEventRecord } from "@/lib/types";
import { formatAddressLabel } from "@/lib/utils/format-address";

type SearchParams =
  | Promise<{ tab?: string; email_changed?: string; email_change_error?: string }>
  | undefined;

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
  const activeTab: ProfileTabKey = isProfileTab(sp.tab ?? "")
    ? (sp.tab as ProfileTabKey)
    : "annonces";
  const ctx = await requireActiveMembership();
  const profile = ctx.profile;
  const membership = ctx.activeMembership!;
  const communeId = membership.commune_id;
  const membershipId = membership.id;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    activeAnnouncementsResult,
    activeInitiativesResult,
    activeEventsResult,
    invitesResult,
    notificationPrefs,
    pushPublicKey,
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select(
        "*, author_membership:memberships!announcements_author_membership_id_fkey(address_street, address_city, address_postcode, address_lat, address_lng, profiles:profiles!memberships_profiles_user_id_fkey(first_name, last_name, display_name, avatar_url))",
      )
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .neq("status", "archivee")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("initiatives")
      .select(
        "*, author_membership:memberships!initiatives_author_membership_id_fkey(address_street, address_city, profiles(first_name, last_name, display_name, avatar_url))",
      )
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select("*")
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("neighbor_invites")
      .select("id, email, created_at", { count: "exact" })
      .eq("commune_id", communeId)
      .eq("inviter_membership_id", membershipId)
      .order("created_at", { ascending: false })
      .limit(3),
    getNotificationPreferences(supabase, ctx.userId),
    getPushPublicKey(),
  ]);

  const announcements = (activeAnnouncementsResult.data ??
    []) as AnnouncementWithAuthor[];
  const initiatives = (activeInitiativesResult.data ??
    []) as InitiativeWithAuthor[];
  await enrichInitiativesWithMeta(supabase, initiatives);
  const events = (activeEventsResult.data ?? []) as AgendaEventRecord[];

  const displayName = getDisplayName(profile);
  const communeName = membership.commune?.name ?? "Votre commune";

  const fullAddress = formatAddressLabel(
    membership.address_street,
    membership.address_postcode,
    membership.address_city,
  );

  const inviteCount = invitesResult.count ?? (invitesResult.data?.length ?? 0);

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
      announcements={announcements}
      initiatives={initiatives}
      events={events}
      invite={{
        senderName: displayName,
        communeName,
        inviteCount,
      }}
      settings={{
        notificationPrefs,
        pushPublicKey,
      }}
      emailChanged={sp.email_changed === "1"}
      emailChangeError={sp.email_change_error === "1"}
    />
  );
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
