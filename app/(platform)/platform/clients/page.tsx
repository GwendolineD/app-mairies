import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { ConfirmButton } from "@/components/features/platform/confirm-button";
import { SubscriptionBadge } from "@/components/features/platform/status-badge";
import {
  deleteCommune,
  reactivateCommune,
  suspendCommune,
} from "@/lib/actions/platform";
import { ROUTES } from "@/lib/constants/routes";
import { COMMUNE_PLAN_LABEL } from "@/lib/constants/statuses";
import { formatCents } from "@/lib/utils/money";
import type { CommuneOverviewRow } from "@/lib/types";

export default async function PlatformClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_commune_overview");
  const rows = (data ?? []) as CommuneOverviewRow[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Clients (communes)"
          subtitle="Engagement, abonnement et facturation de chaque commune cliente."
        />
        <Link
          href={ROUTES.platform.clientNew}
          className="gradient-hero inline-flex cursor-pointer items-center gap-2 rounded-sm px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:opacity-95"
        >
          + Créer un client
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="p-6 text-sm font-medium text-muted">
          Aucune commune cliente. Créez votre premier client.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => {
            const isSuspended = c.subscription_status === "suspended";
            return (
              <Card key={c.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={ROUTES.platform.clientDetail(c.id)}
                      className="text-lg font-semibold text-text hover:text-purple"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs font-medium text-muted">
                      INSEE {c.insee_code}
                      {c.postcode ? ` · ${c.postcode}` : ""}
                      {c.department ? ` · ${c.department}` : ""} ·{" "}
                      {COMMUNE_PLAN_LABEL[c.plan]} ·{" "}
                      {formatCents(c.monthly_amount_cents)}/mois
                    </p>
                  </div>
                  <SubscriptionBadge status={c.subscription_status} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Habitants" value={c.resident_count} />
                  <Metric label="Annonces" value={c.announcement_count} />
                  <Metric label="Initiatives" value={c.initiative_count} />
                  <Metric label="Événements" value={c.event_count} />
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  <Link
                    href={ROUTES.platform.clientDetail(c.id)}
                    className="inline-flex cursor-pointer items-center rounded-sm border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition hover:bg-warm"
                  >
                    Gérer / Modifier
                  </Link>
                  {isSuspended ? (
                    <ConfirmButton
                      action={reactivateCommune}
                      fields={{ communeId: c.id }}
                      label="Réactiver"
                      title="Réactiver la commune"
                      description={`Réactiver « ${c.name} » ? Le statut repassera à « Active ».`}
                      confirmLabel="Réactiver"
                      confirmVariant="primary"
                    />
                  ) : (
                    <ConfirmButton
                      action={suspendCommune}
                      fields={{ communeId: c.id }}
                      label="Suspendre"
                      title="Suspendre la commune"
                      description={`Suspendre « ${c.name} » ? Les nouvelles inscriptions seront bloquées.`}
                      confirmLabel="Suspendre"
                      withReason
                    />
                  )}
                  <ConfirmButton
                    action={deleteCommune}
                    fields={{ communeId: c.id }}
                    label="Supprimer"
                    title="Supprimer la commune"
                    description={`Supprimer définitivement « ${c.name} » et toutes ses données (habitants, annonces, initiatives, événements, paiements) ? Cette action est irréversible.`}
                    confirmLabel="Supprimer définitivement"
                    variant="danger"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-warm px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-muted">{label}</p>
      <p className="text-xl font-bold text-text">{value}</p>
    </div>
  );
}
