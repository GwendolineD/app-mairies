import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/features/platform/stat-card";
import { SubscriptionBadge } from "@/components/features/platform/status-badge";
import { ROUTES } from "@/lib/constants/routes";
import { formatCents } from "@/lib/utils/money";
import type { CommuneOverviewRow, PlatformStats } from "@/lib/types";

export default async function PlatformAdminHomePage() {
  const supabase = await createClient();

  const [{ data: stats }, { data: communes }] = await Promise.all([
    supabase.rpc("admin_platform_stats"),
    supabase.rpc("admin_commune_overview"),
  ]);

  const s = (stats ?? {}) as Partial<PlatformStats>;
  const rows = (communes ?? []) as CommuneOverviewRow[];
  const topClients = [...rows]
    .sort((a, b) => b.resident_count - a.resident_count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Vue d'ensemble"
          subtitle="Pilotage des communes clientes, de leur engagement et de leurs revenus."
        />
        <Link
          href={ROUTES.platform.clientNew}
          className="gradient-hero inline-flex cursor-pointer items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:opacity-95"
        >
          + Créer un client
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Communes actives"
          value={s.communes_active ?? 0}
          hint={`${s.communes_total ?? 0} au total`}
          tone="purple"
        />
        <StatCard
          label="Habitants inscrits"
          value={s.residents_total ?? 0}
          hint="Adhésions actives"
          tone="aqua"
        />
        <StatCard
          label="Revenu mensuel (MRR)"
          value={formatCents(s.mrr_cents)}
          hint="Communes actives"
          tone="mint"
        />
        <StatCard
          label="Revenus encaissés"
          value={formatCents(s.revenue_paid_cents)}
          hint={`${formatCents(s.revenue_pending_cents)} en attente`}
          tone="orange"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
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
        <StatCard label="Événements" value={s.events_total ?? 0} tone="text" />
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">
            Top communes par engagement
          </h2>
          <Link
            href={ROUTES.platform.clients}
            className="text-sm font-semibold text-purple underline"
          >
            Tous les clients →
          </Link>
        </div>
        {topClients.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucune commune cliente pour l&apos;instant.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {topClients.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <Link
                  href={ROUTES.platform.clientDetail(c.id)}
                  className="font-semibold text-text hover:text-purple"
                >
                  {c.name}
                </Link>
                <div className="flex items-center gap-4 text-xs font-medium text-muted">
                  <span>{c.resident_count} habitants</span>
                  <span>{c.announcement_count} annonces</span>
                  <span>{formatCents(c.monthly_amount_cents)}/mois</span>
                  <SubscriptionBadge status={c.subscription_status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
