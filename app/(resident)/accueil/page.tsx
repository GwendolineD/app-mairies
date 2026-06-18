import { requireActiveMembership } from "@/lib/auth/session";
import { EVENT_STATUS } from "@/lib/constants/statuses";
import {
  countNeighborAnnouncementsDueToday,
  listAnnouncementsPage,
} from "@/lib/queries/announcements";
import { listInitiativesForAccueil } from "@/lib/queries/initiatives";
import { createClient } from "@/lib/supabase/server";
import { PageStack } from "@/components/ui/page-stack";
import {
  AccueilHero,
  AccueilQuickActions,
} from "@/components/features/accueil-sections";
import {
  AccueilRecentAnnouncements,
  AccueilTrendingInitiative,
  AccueilUpcomingEvents,
} from "@/components/features/accueil-feed-sections";
import { resolveFirstName } from "@/lib/utils/display-name";
import type { AgendaEventRecord } from "@/lib/types";

export default async function ResidentAccueilPage() {
  const ctx = await requireActiveMembership();
  const communeId = ctx.activeMembership!.commune_id;
  const supabase = await createClient();

  const [neighborDemandCount, recentAnnouncements, neighborInitiatives, eventsRes] =
    await Promise.all([
      countNeighborAnnouncementsDueToday(supabase, communeId),
      listAnnouncementsPage(supabase, { communeId }, { limit: 2 }),
      listInitiativesForAccueil(supabase, communeId, 2),
      supabase
        .from("events")
        .select("*")
        .eq("commune_id", communeId)
        .eq("status", EVENT_STATUS.active)
        .is("suspended_at", null)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3),
    ]);

  const upcomingEvents = (eventsRes.data ?? []) as AgendaEventRecord[];

  const linkedInitiativeIds = [
    ...new Set(
      upcomingEvents
        .map((event) => event.source_initiative_id)
        .filter((id): id is string => id != null),
    ),
  ];

  const volunteerCountByInitiativeId: Record<string, number> = {};
  if (linkedInitiativeIds.length > 0) {
    const { data: volunteerRows } = await supabase
      .from("initiative_responses")
      .select("initiative_id")
      .in("initiative_id", linkedInitiativeIds)
      .eq("response_type", "volunteer");

    for (const row of volunteerRows ?? []) {
      volunteerCountByInitiativeId[row.initiative_id] =
        (volunteerCountByInitiativeId[row.initiative_id] ?? 0) + 1;
    }
  }

  return (
    <PageStack gap="6">
      <AccueilHero
        userFirstName={resolveFirstName(ctx.profile)}
        neighborDemandCount={neighborDemandCount}
      />
      <AccueilQuickActions />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <AccueilRecentAnnouncements items={recentAnnouncements.items} />
          <AccueilTrendingInitiative initiatives={neighborInitiatives} />
        </div>
        <AccueilUpcomingEvents
          events={upcomingEvents}
          volunteerCountByInitiativeId={volunteerCountByInitiativeId}
        />
      </div>
    </PageStack>
  );
}
