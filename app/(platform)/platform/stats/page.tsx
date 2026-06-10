import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/features/platform/stat-card";
import { formatCents } from "@/lib/utils/money";
import type { CommuneOverviewRow, PlatformStats } from "@/lib/types";

export default async function PlatformStatsPage() {
  const supabase = await createClient();

  const [{ data: stats }, { data: communes }] = await Promise.all([
    supabase.rpc("admin_platform_stats"),
    supabase.rpc("admin_commune_overview"),
  ]);

  const s = (stats ?? {}) as Partial<PlatformStats>;
  const rows = (communes ?? []) as CommuneOverviewRow[];
  const topRevenue = [...rows]
    .sort((a, b) => b.paid_revenue_cents - a.paid_revenue_cents)
    .slice(0, 6);

  const arrCents = (s.mrr_cents ?? 0) * 12;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Statistiques & revenus"
        subtitle="Pilotage commercial : abonnements, paiements et revenus générés."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Revenus
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="MRR (mensuel récurrent)"
            value={formatCents(s.mrr_cents)}
            hint="Communes actives"
            tone="mint"
          />
          <StatCard
            label="ARR (annuel projeté)"
            value={formatCents(arrCents)}
            tone="purple"
          />
          <StatCard
            label="Revenus encaissés"
            value={formatCents(s.revenue_paid_cents)}
            hint={`${s.payments_paid_count ?? 0} paiements`}
            tone="aqua"
          />
          <StatCard
            label="Paiements en attente"
            value={formatCents(s.revenue_pending_cents)}
            tone="orange"
          />
        </div>
        <StatCard
          label="Revenus encaissés (30 derniers jours)"
          value={formatCents(s.revenue_last_30d_cents)}
          tone="text"
          className="sm:max-w-xs"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Portefeuille clients
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Communes actives"
            value={s.communes_active ?? 0}
            tone="mint"
          />
          <StatCard label="En essai" value={s.communes_trial ?? 0} tone="orange" />
          <StatCard
            label="Suspendues"
            value={s.communes_suspended ?? 0}
            tone="coral"
          />
          <StatCard
            label="Inactives"
            value={s.communes_inactive ?? 0}
            tone="text"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Engagement global
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Habitants inscrits"
            value={s.residents_total ?? 0}
            tone="purple"
          />
          <StatCard
            label="Annonces"
            value={s.announcements_total ?? 0}
            tone="text"
          />
          <StatCard
            label="Initiatives"
            value={s.initiatives_total ?? 0}
            tone="text"
          />
          <StatCard
            label="Événements"
            value={s.events_total ?? 0}
            tone="text"
          />
        </div>
      </section>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold text-text">
          Top communes par revenus encaissés
        </h2>
        {topRevenue.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucun revenu enregistré pour l&apos;instant.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {topRevenue.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="font-semibold text-text">{c.name}</span>
                <div className="flex items-center gap-4 text-xs font-medium text-muted">
                  <span>{formatCents(c.monthly_amount_cents)}/mois</span>
                  <span className="font-semibold text-mint">
                    {formatCents(c.paid_revenue_cents)} encaissés
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
