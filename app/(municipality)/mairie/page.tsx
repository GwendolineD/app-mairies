import { requireCommuneStaff } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  ANNOUNCEMENT_STATUS,
  EVENT_STATUS,
  INITIATIVE_STATUS,
  MEMBERSHIP_STATUS,
} from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { MairieTrialSection } from "@/components/features/mairie/mairie-trial-section";
import { DashboardContentChart } from "@/components/features/mairie/dashboard-content-chart";
import { DashboardMembersChart } from "@/components/features/mairie/dashboard-members-chart";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import {
  fetchWeeklyContentCreation,
  fetchWeeklyMembershipGrowth,
} from "@/lib/queries/dashboard-charts";
import type { AccessStatus } from "@/lib/types";

export default async function MairieAccueilPage() {
  const { communeId } = await requireCommuneStaff();

  const supabase = await createClient();

  const [
    { data: commune },
    { count: activeAnnouncements },
    { count: activeInitiatives },
    { count: activeEvents },
    { count: residents },
  ] = await Promise.all([
    supabase
      .from("communes")
      .select("access_status, trial_access_code, trial_max_members, created_at")
      .eq("id", communeId)
      .single(),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", ANNOUNCEMENT_STATUS.ouverte),
    supabase
      .from("initiatives")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", INITIATIVE_STATUS.active),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", EVENT_STATUS.active),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", MEMBERSHIP_STATUS.active),
  ]);

  const communeCreatedAt = commune?.created_at
    ? new Date(commune.created_at as string)
    : new Date();

  const [contentData, membersData] = await Promise.all([
    fetchWeeklyContentCreation(supabase, communeId, communeCreatedAt),
    fetchWeeklyMembershipGrowth(supabase, communeId, communeCreatedAt),
  ]);

  return (
    <PageStack>
      <PageHeading title="Tableau de bord" />

      <MairieTrialSection
        communeId={communeId}
        accessStatus={(commune?.access_status as AccessStatus) ?? "inactive"}
        trialAccessCode={(commune?.trial_access_code as string | null) ?? null}
        trialMaxMembers={(commune?.trial_max_members as number) ?? 30}
        currentMembersCount={residents ?? 0}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Annonces actives"
          value={activeAnnouncements ?? 0}
          accent="purple"
          href={ROUTES.mairie.annonces}
        />
        <StatCard
          label="Initiatives actives"
          value={activeInitiatives ?? 0}
          accent="mint"
          href={ROUTES.mairie.initiatives}
        />
        <StatCard
          label="Événements actifs"
          value={activeEvents ?? 0}
          accent="orange"
          href={ROUTES.mairie.evenements}
        />
        <StatCard
          label="Habitants inscrits"
          value={residents ?? 0}
          accent="turquoise"
          href={ROUTES.mairie.habitants}
        />
      </div>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold text-text">
          Activité hebdomadaire
        </h2>
        <DashboardContentChart data={contentData} />
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold text-text">
          Évolution des inscriptions
        </h2>
        <DashboardMembersChart data={membersData} />
      </Card>
    </PageStack>
  );
}
