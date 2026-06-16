import { requireRole } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { USER_ROLES } from "@/lib/constants/roles";
import { MEMBERSHIP_STATUS } from "@/lib/constants/statuses";
import { createClient } from "@/lib/supabase/server";
import { formatMonthShort } from "@/lib/utils/date";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
<<<<<<< HEAD
import { StatCard } from "@/components/ui/stat-card";
import {
  AreaTrendChart,
  GroupedBarChart,
} from "@/components/features/dashboard/charts";
import { SubscriptionCard } from "@/components/features/dashboard/subscription-card";
import type { Commune } from "@/lib/types";
=======
import { PageStack } from "@/components/ui/page-stack";
>>>>>>> preprod

type MonthlyRow = {
  month: string;
  new_members: number;
  demandes: number;
  offres: number;
  initiatives: number;
  events: number;
};

export default async function MairieDashboardPage() {
  const ctx = await requireRole([USER_ROLES.municipalityStaff]);
  const communeId = ctx.profile.active_commune_id;

  if (!communeId) {
    return (
      <p className="text-base font-medium text-muted">
        Définissez une commune dans votre espace équipe Vie Locale avant de
        poursuivre.
      </p>
    );
  }

  const supabase = await createClient();

  const [
    commune,
    residents,
    demandes,
    offres,
    initiatives,
    events,
    monthly,
  ] = await Promise.all([
    supabase.from("communes").select("*").eq("id", communeId).single(),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("status", MEMBERSHIP_STATUS.active),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("type", "demande"),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId)
      .eq("type", "offre"),
    supabase
      .from("initiatives")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("commune_id", communeId),
    supabase.rpc("commune_dashboard_monthly", { p_commune_id: communeId }),
  ]);

  const rows = (monthly.data ?? []) as MonthlyRow[];

  // Cumulative residents per month (signup progression).
  const residentsTrend = rows.map((r, idx) => ({
    label: formatMonthShort(r.month),
    value: rows
      .slice(0, idx + 1)
      .reduce((acc, x) => acc + Number(x.new_members), 0),
  }));

  const monthLabels = rows.map((r) => formatMonthShort(r.month));
  const contentSeries = [
    {
      key: "demandes",
      label: "Demandes",
      colorVar: "--orange",
      values: rows.map((r) => Number(r.demandes)),
    },
    {
      key: "offres",
      label: "Offres",
      colorVar: "--aqua",
      values: rows.map((r) => Number(r.offres)),
    },
    {
      key: "initiatives",
      label: "Initiatives",
      colorVar: "--mint",
      values: rows.map((r) => Number(r.initiatives)),
    },
    {
      key: "events",
      label: "Événements",
      colorVar: "--coral",
      values: rows.map((r) => Number(r.events)),
    },
  ];

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      <PageHeading
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la vie locale de votre commune : habitant·es, contributions et abonnement."
      />

      <SubscriptionCard commune={commune.data as Commune} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Habitant·es inscrit·es"
          value={residents.count ?? 0}
          accent="purple"
          href={ROUTES.mairie.habitants}
        />
        <StatCard
          label="Demandes"
          value={demandes.count ?? 0}
          accent="orange"
          href={`${ROUTES.mairie.annonces}?type=demande`}
        />
        <StatCard
          label="Offres"
          value={offres.count ?? 0}
          accent="aqua"
          href={`${ROUTES.mairie.annonces}?type=offre`}
        />
        <StatCard
          label="Initiatives"
          value={initiatives.count ?? 0}
          accent="mint"
          href={ROUTES.mairie.initiatives}
        />
        <StatCard
          label="Événements"
          value={events.count ?? 0}
          accent="coral"
          href={ROUTES.mairie.evenements}
        />
      </div>

      <Card className="space-y-3 p-6">
        <div>
          <h2 className="text-xl font-semibold leading-7 text-text">
            Progression des inscriptions
          </h2>
          <p className="text-sm font-medium text-muted">
            Nombre cumulé d&apos;habitant·es par mois depuis l&apos;ouverture du
            compte.
          </p>
        </div>
        {residentsTrend.length > 0 ? (
          <AreaTrendChart points={residentsTrend} colorVar="--purple" />
        ) : (
          <p className="text-sm font-medium text-muted">
            Pas encore de données à afficher.
          </p>
        )}
      </Card>

      <Card className="space-y-3 p-6">
        <div>
          <h2 className="text-xl font-semibold leading-7 text-text">
            Contributions par mois
          </h2>
          <p className="text-sm font-medium text-muted">
            Annonces (demandes / offres), initiatives et événements créés chaque
            mois depuis l&apos;ouverture du compte.
          </p>
        </div>
        {monthLabels.length > 0 ? (
          <GroupedBarChart categories={monthLabels} series={contentSeries} />
        ) : (
          <p className="text-sm font-medium text-muted">
            Pas encore de données à afficher.
          </p>
        )}
=======
    <PageStack>
      <PageHeading title="Tableau de bord" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Annonces</p>
          <p className="text-5xl font-bold text-purple">{announces ?? 0}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">Alertes ouvertes</p>
          <p className="text-5xl font-bold text-coral">{reportsPending ?? 0}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-[10px] font-semibold uppercase text-muted">
            Resident·es actifs
          </p>
          <p className="text-5xl font-bold text-text">{residents ?? 0}</p>
        </Card>
      </div>

      <Card className="space-y-2 p-6">
        <h2 className="text-[28px] font-bold leading-9 text-text">Pilotage équipe</h2>
        <p className="text-base font-medium leading-6 text-muted">
          Gardez le sourire même dans vos modérations&nbsp;: vos voisin·es repèrent vite quand une
          collectivité se montre précise et empathique simultanément.
        </p>
        <Link
          href={ROUTES.mairie.signalements}
          className="inline-flex text-sm font-semibold text-purple underline"
        >
          Voir les signalements →
        </Link>
>>>>>>> preprod
      </Card>
    </PageStack>
  );
}
