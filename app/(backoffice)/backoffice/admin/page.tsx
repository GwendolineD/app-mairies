import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Flag,
  LifeBuoy,
  Mail,
  Megaphone,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { PageStack } from "@/components/ui/page-stack";
import { PILOT_ACCESS_STATUSES } from "@/lib/constants/access-status";
import { ROUTES } from "@/lib/constants/routes";
import { UtilisateursStatsChart } from "@/app/(backoffice)/backoffice/utilisateurs/_components/utilisateurs-stats-chart";
import { ContenusStatsChart } from "@/app/(backoffice)/backoffice/contenus/_components/contenus-stats-chart";
import { getCachedOpenLeadsCount } from "@/lib/queries/commune-interest-leads";
import {
  countAllContentTypes,
  getContentPopulationStats,
} from "@/lib/queries/backoffice-contenus";
import {
  countGlobalStats,
  getPopulationStats,
} from "@/lib/queries/backoffice-users-list";
import { getCachedAllPendingReportsCount } from "@/lib/queries/reports";
import { getCachedOpenSupportRequestsCount } from "@/lib/queries/support-requests";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

type DashboardStatCardProps = {
  href: string;
  label: string;
  value: number;
  icon: ReactNode;
  accentClass: string;
  borderClass: string;
  bgClass: string;
};

function DashboardStatCard({
  href,
  label,
  value,
  icon,
  accentClass,
  borderClass,
  bgClass,
}: DashboardStatCardProps) {
  return (
    <Link href={href} className="cursor-pointer text-left">
      <Card
        className={cn(
          "flex flex-col gap-1 rounded-xl p-3 transition hover:scale-[1.02] hover:shadow-elevated md:p-4",
          bgClass,
          borderClass,
        )}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted">
          {icon}
          {label}
        </p>
        <p className={cn("font-bold text-xl md:text-3xl", accentClass)}>
          {value}
        </p>
      </Card>
    </Link>
  );
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function BackofficeAdminHomePage() {
  const supabase = await createClient();

  const [
    { count: communeCount },
    { count: communesActive },
    contentCounts,
    userCounts,
    pendingReportsCount,
    openSupportCount,
    openLeadsCount,
    userPopulationStats,
    contentPopulationStats,
  ] = await Promise.all([
    supabase
      .from("communes")
      .select("*", { count: "exact", head: true })
      .in("access_status", [...PILOT_ACCESS_STATUSES]),
    supabase
      .from("communes")
      .select("*", { count: "exact", head: true })
      .eq("access_status", "active"),
    countAllContentTypes(supabase),
    countGlobalStats(supabase),
    getCachedAllPendingReportsCount(),
    getCachedOpenSupportRequestsCount(),
    getCachedOpenLeadsCount(),
    getPopulationStats(supabase),
    getContentPopulationStats(supabase),
  ]);

  return (
    <PageStack>
      <PageHeading title="Dashboard" />

      <DashboardSection title="Communes">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={ROUTES.backoffice.communes} className="cursor-pointer text-left">
            <Card className="space-y-1 rounded-xl p-5 transition hover:scale-[1.02] hover:shadow-elevated">
              <p className="text-[10px] font-semibold uppercase text-muted">
                Communes pilotées
              </p>
              <p className="text-5xl font-bold text-purple">
                {communeCount ?? "—"}
              </p>
            </Card>
          </Link>
          <Link href={ROUTES.backoffice.communes} className="cursor-pointer text-left">
            <Card className="space-y-1 rounded-xl p-5 transition hover:scale-[1.02] hover:shadow-elevated">
              <p className="text-[10px] font-semibold uppercase text-muted">
                Communautés ouvertes
              </p>
              <p className="text-5xl font-bold text-mint">
                {communesActive ?? "—"}
              </p>
            </Card>
          </Link>
        </div>
      </DashboardSection>

      <DashboardSection title="Contenus">
        <div className="grid grid-cols-3 gap-3">
          <DashboardStatCard
            href={`${ROUTES.backoffice.contenus}?tab=announcement`}
            label="Annonces"
            value={contentCounts.announcement}
            icon={<Megaphone className="size-3.5 shrink-0 text-coral" aria-hidden />}
            accentClass="text-coral"
            borderClass="border-coral/25"
            bgClass="bg-coral/5"
          />
          <DashboardStatCard
            href={`${ROUTES.backoffice.contenus}?tab=initiative`}
            label="Initiatives"
            value={contentCounts.initiative}
            icon={<Sparkles className="size-3.5 shrink-0 text-mint" aria-hidden />}
            accentClass="text-mint"
            borderClass="border-mint/25"
            bgClass="bg-mint/10"
          />
          <DashboardStatCard
            href={`${ROUTES.backoffice.contenus}?tab=event`}
            label="Événements"
            value={contentCounts.event}
            icon={
              <CalendarDays className="size-3.5 shrink-0 text-orange" aria-hidden />
            }
            accentClass="text-orange"
            borderClass="border-orange/25"
            bgClass="bg-orange/5"
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Utilisateurs">
        <div className="grid grid-cols-2 gap-3">
          <DashboardStatCard
            href={ROUTES.backoffice.utilisateurs}
            label="Total inscrits"
            value={userCounts.totalUsers}
            icon={<Users className="size-3.5 shrink-0 text-purple" aria-hidden />}
            accentClass="text-purple"
            borderClass="border-purple/25"
            bgClass="bg-purple/5"
          />
          <DashboardStatCard
            href={`${ROUTES.backoffice.utilisateurs}?tab=invitations`}
            label="Invitations en cours"
            value={userCounts.pendingInvitations}
            icon={<Mail className="size-3.5 shrink-0 text-orange" aria-hidden />}
            accentClass="text-orange"
            borderClass="border-orange/25"
            bgClass="bg-orange/5"
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Modération & suivi">
        <div className="grid grid-cols-3 gap-3">
          <DashboardStatCard
            href={ROUTES.backoffice.signalements}
            label="Signalements"
            value={pendingReportsCount}
            icon={<Flag className="size-3.5 shrink-0 text-coral" aria-hidden />}
            accentClass="text-coral"
            borderClass="border-coral/25"
            bgClass="bg-coral/5"
          />
          <DashboardStatCard
            href={ROUTES.backoffice.assistance}
            label="Assistance"
            value={openSupportCount}
            icon={<LifeBuoy className="size-3.5 shrink-0 text-purple" aria-hidden />}
            accentClass="text-purple"
            borderClass="border-purple/25"
            bgClass="bg-purple/5"
          />
          <DashboardStatCard
            href={ROUTES.backoffice.leads}
            label="Pré-inscriptions"
            value={openLeadsCount}
            icon={
              <UserPlus className="size-3.5 shrink-0 text-turquoise" aria-hidden />
            }
            accentClass="text-turquoise"
            borderClass="border-turquoise/25"
            bgClass="bg-turquoise/5"
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Statistiques">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text">Utilisateurs</h3>
            <UtilisateursStatsChart stats={userPopulationStats} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text">Contenus</h3>
            <ContenusStatsChart stats={contentPopulationStats} />
          </div>
        </div>
      </DashboardSection>
    </PageStack>
  );
}
