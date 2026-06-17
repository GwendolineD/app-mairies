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
import type {
  Announcement,
  InitiativeRecord,
  AgendaEventRecord,
} from "@/lib/types";
import { NEIGHBOR_INVITE_TEMPLATE_KEY } from "@/lib/constants/email-templates";
import { normalizeNeighborInviteTemplate } from "@/lib/utils/email-template";

type SearchParams = Promise<{ tab?: string }> | undefined;

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

  const [
    activeAnnouncementsResult,
    activeInitiativesResult,
    activeEventsResult,
    invitesResult,
    templateResult,
    notificationPrefs,
    pushPublicKey,
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select(
        "id, commune_id, author_membership_id, type, category_slug, title, description, photo_url, target_date, status, created_at",
      )
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .neq("status", "archivee")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("initiatives")
      .select(
        "id, commune_id, author_membership_id, category_slug, title, description, date_mode, single_starts_at, single_ends_at, recurrence_rule, status, photo_url, location_label, address_lat, address_lng, created_at, updated_at",
      )
      .eq("commune_id", communeId)
      .eq("author_membership_id", membershipId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("events")
      .select(
        "id, commune_id, author_membership_id, title, description, starts_at, ends_at, status, photo_url, address_label, address_lat, address_lng, created_at, updated_at",
      )
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
    supabase
      .from("commune_email_templates")
      .select("subject, preheader, body_markdown, cta_label")
      .eq("commune_id", communeId)
      .eq("template_key", NEIGHBOR_INVITE_TEMPLATE_KEY)
      .maybeSingle(),
    getNotificationPreferences(supabase, ctx.userId),
    getPushPublicKey(),
  ]);

  const announcements = (activeAnnouncementsResult.data ?? []) as Announcement[];
  const initiatives = (activeInitiativesResult.data ?? []) as InitiativeRecord[];
  const events = (activeEventsResult.data ?? []) as AgendaEventRecord[];

  const displayName = getDisplayName(profile);
  const communeName = membership.commune?.name ?? "Votre commune";

  const addressParts = [
    membership.address_street,
    membership.address_city,
    membership.address_postcode,
  ].filter(Boolean);
  const fullAddress =
    addressParts.length > 0
      ? addressParts.join(", ")
      : "Adresse non renseignée";

  const template = normalizeNeighborInviteTemplate(templateResult.data);
  const inviteCount = invitesResult.count ?? (invitesResult.data?.length ?? 0);

  return (
    <ProfilePageClient
      profile={{
        displayName,
        firstName: profile.first_name,
        lastName: profile.last_name,
        bio: (profile as { bio?: string | null }).bio ?? "",
        avatarUrl: profile.avatar_url,
      }}
      membership={{
        fullAddress,
        communeName,
        joinedAt: membership.created_at,
        totalAnnouncements: (membership as Record<string, unknown>).total_announcements_published as number ?? 0,
        totalInitiatives: (membership as Record<string, unknown>).total_initiatives_published as number ?? 0,
        totalEvents: (membership as Record<string, unknown>).total_events_published as number ?? 0,
        role: ctx.profile.is_platform_admin
          ? "Super admin"
          : membership.role === "mayor"
            ? "Maire"
            : membership.role === "staff"
              ? "Staff mairie"
              : "Résident·e",
      }}
      activeTab={activeTab}
      announcements={announcements}
      initiatives={initiatives}
      events={events}
      invite={{
        template,
        senderName: displayName,
        communeName,
        inviteCount,
      }}
      settings={{
        notificationPrefs,
        pushPublicKey,
        memberships: ctx.memberships,
      }}
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
    .join(" ");
  return profile.display_name || fullName || "Voisin·e";
}
