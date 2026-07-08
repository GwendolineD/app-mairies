import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { MairieTrialSection } from "@/components/features/mairie/mairie-trial-section";
import nextDynamic from "next/dynamic";

const DashboardContentChart = nextDynamic(
  () =>
    import("@/components/features/mairie/dashboard-content-chart").then(
      (m) => m.DashboardContentChart,
    ),
  {
    loading: () => (
      <div className="h-[280px] animate-pulse rounded-sm bg-warm" />
    ),
  },
);

const DashboardMembersChart = nextDynamic(
  () =>
    import("@/components/features/mairie/dashboard-members-chart").then(
      (m) => m.DashboardMembersChart,
    ),
  {
    loading: () => (
      <div className="h-[280px] animate-pulse rounded-sm bg-warm" />
    ),
  },
);
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
const DashboardOutcomeSection = nextDynamic(
  () =>
    import("@/components/features/mairie/dashboard-outcome-section").then(
      (m) => m.DashboardOutcomeSection,
    ),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[260px] animate-pulse rounded-lg bg-warm" />
        ))}
      </div>
    ),
  },
);
import {
  fetchWeeklyContentCreation,
  fetchWeeklyMembershipGrowth,
  fetchOutcomeStats,
} from "@/lib/queries/dashboard-charts";
import { fetchMairieLiveStats } from "@/lib/queries/mairie-live-stats";
import type { AccessStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MairieAccueilPage() {
  const { communeId } = await requireCommuneStaff();

  const supabase = await createClient();

  const { data: commune } = await supabase
    .from("communes")
    .select("access_status, trial_access_code, trial_max_members, created_at")
    .eq("id", communeId)
    .single();

  const communeCreatedAt = commune?.created_at
    ? new Date(commune.created_at as string)
    : new Date();

  const [liveStats, contentData, membersData, outcomeStats] = await Promise.all([
    fetchMairieLiveStats(supabase, communeId),
    fetchWeeklyContentCreation(supabase, communeId, communeCreatedAt),
    fetchWeeklyMembershipGrowth(supabase, communeId, communeCreatedAt),
    fetchOutcomeStats(supabase, communeId, communeCreatedAt),
  ]);

  return (
    <PageStack>
      <PageHeading title="Tableau de bord" />

      <MairieTrialSection
        communeId={communeId}
        accessStatus={(commune?.access_status as AccessStatus) ?? "inactive"}
        trialAccessCode={(commune?.trial_access_code as string | null) ?? null}
        trialMaxMembers={(commune?.trial_max_members as number) ?? 30}
        currentMembersCount={liveStats.activeResidents}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Annonces actives"
          value={liveStats.activeAnnouncements}
          accent="purple"
          href={`${ROUTES.mairie.annonces}?statut=actives`}
        />
        <StatCard
          label="Initiatives actives"
          value={liveStats.activeInitiatives}
          accent="mint"
          href={`${ROUTES.mairie.initiatives}?statut=actives`}
        />
        <StatCard
          label="Événements actifs"
          value={liveStats.activeEvents}
          accent="orange"
          href={`${ROUTES.mairie.evenements}?statut=actives`}
        />
        <StatCard
          label="Habitants inscrits"
          value={liveStats.activeResidents}
          accent="turquoise"
          href={`${ROUTES.mairie.habitants}?statut=active`}
        />
      </div>

      <DashboardOutcomeSection stats={outcomeStats} />

      <Card className="space-y-3 max-md:rounded-none max-md:border-0 max-md:p-0 max-md:!bg-transparent max-md:!shadow-none md:rounded-lg md:border md:border-border/60 md:bg-surface md:p-6 md:shadow-card">
        <h2 className="text-lg font-semibold text-text">
          Activité hebdomadaire
        </h2>
        <DashboardContentChart data={contentData} />
      </Card>

      <Card className="space-y-3 max-md:rounded-none max-md:border-0 max-md:p-0 max-md:!bg-transparent max-md:!shadow-none md:rounded-lg md:border md:border-border/60 md:bg-surface md:p-6 md:shadow-card">
        <h2 className="text-lg font-semibold text-text">
          Évolution des inscriptions
        </h2>
        <DashboardMembersChart data={membersData} />
      </Card>
    </PageStack>
  );
}
