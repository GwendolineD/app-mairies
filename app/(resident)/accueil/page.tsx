import { requireActiveMembership } from "@/lib/auth/session";
import {
  countAnnouncements,
  countNeighborAnnouncementsDueToday,
  listFeaturedAnnouncementForAccueil,
} from "@/lib/queries/announcements";
import { listInitiativesPage } from "@/lib/queries/initiatives";
import {
  listEventsPage,
  listVolunteerCountsByEventId,
} from "@/lib/queries/events";
import { createClient } from "@/lib/supabase/server";
import { PageStack } from "@/components/ui/page-stack";
import {
  AccueilHero,
  AccueilQuickActions,
} from "@/components/features/accueil-sections";
import {
  AccueilAnnouncementsHub,
  AccueilEventsHub,
  AccueilInitiativesHub,
} from "@/components/features/accueil-hub-sections";
import { AccueilOutcomeBanner } from "@/components/features/accueil-outcome-banner";
import { AccueilPageHeader } from "@/components/features/accueil-page-header";
import { NeighborInviteBlock } from "@/components/features/profile/neighbor-invite-block";
import type { EventCardData } from "@/components/features/event-card";
import { resolveDisplayName, resolveFirstName } from "@/lib/utils/display-name";
import { fetchAccueilBannerSlides } from "@/lib/queries/dashboard-charts";

export default async function ResidentAccueilPage() {
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const membershipId = ctx.activeMembership!.id;
  const supabase = await createClient();

  const [
    neighborDemandCount,
    totalAnnouncements,
    demandeCount,
    offreCount,
    initiativesRes,
    eventsRes,
    fulfilledBannerSlides,
    invitesResult,
  ] = await Promise.all([
    countNeighborAnnouncementsDueToday(supabase, communeId, membershipId),
    countAnnouncements(supabase, { communeId }),
    countAnnouncements(supabase, { communeId, type: "demande" }),
    countAnnouncements(supabase, { communeId, type: "offre" }),
    listInitiativesPage(supabase, { communeId }, { limit: 1 }),
    listEventsPage(supabase, { communeId }, { limit: 1 }),
    fetchAccueilBannerSlides(supabase, communeId),
    supabase
      .from("neighbor_invites")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("inviter_membership_id", membershipId),
  ]);

  const featuredAnnouncement = await listFeaturedAnnouncementForAccueil(
    supabase,
    communeId,
    {
      preferNeighborDemandToday: neighborDemandCount > 0,
      excludeMembershipId: membershipId,
    },
  );

  const featuredInitiative = initiativesRes.items[0] ?? null;
  const featuredEvent = eventsRes.items[0] ?? null;

  let featuredEventWithVolunteers: EventCardData | null = featuredEvent;
  if (featuredEvent) {
    const volunteerCounts = await listVolunteerCountsByEventId(supabase, [
      featuredEvent.id,
    ]);
    featuredEventWithVolunteers = {
      ...featuredEvent,
      volunteers_registered: volunteerCounts[featuredEvent.id] ?? 0,
    };
  }

  const communeName = ctx.activeMembership!.commune?.name ?? "Votre commune";
  const inviteCount = invitesResult.count ?? 0;

  return (
    <PageStack gap="6">
      <AccueilPageHeader />
      <AccueilHero
        userFirstName={resolveFirstName(ctx.profile)}
        neighborDemandCount={neighborDemandCount}
      />

      <AccueilOutcomeBanner slides={fulfilledBannerSlides} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <AccueilAnnouncementsHub
          totalCount={totalAnnouncements}
          demandeCount={demandeCount}
          offreCount={offreCount}
          featured={featuredAnnouncement}
          className="lg:col-start-1 lg:row-start-1 lg:h-full"
        />
        <AccueilInitiativesHub
          totalCount={initiativesRes.totalCount}
          featured={featuredInitiative}
          className="lg:col-start-1 lg:row-start-2"
        />
        <AccueilEventsHub
          totalCount={eventsRes.totalCount}
          featured={featuredEventWithVolunteers}
          className="lg:col-start-2 lg:row-start-1 lg:h-full"
        />
      </div>

      <AccueilQuickActions />

      <NeighborInviteBlock
        senderName={resolveDisplayName(ctx.profile)}
        communeName={communeName}
        inviteCount={inviteCount}
        desktopSplit
      />
    </PageStack>
  );
}
