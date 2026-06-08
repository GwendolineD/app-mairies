import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/constants/roles";
import { PageHeading } from "@/components/ui/page-heading";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { CommuneForm } from "@/components/features/platform/commune-form";
import { PaymentForm } from "@/components/features/platform/payment-form";
import { ConfirmButton } from "@/components/features/platform/confirm-button";
import { StatCard } from "@/components/features/platform/stat-card";
import {
  MembershipBadge,
  PaymentBadge,
  SubscriptionBadge,
} from "@/components/features/platform/status-badge";
import {
  deleteCommune,
  deleteCommuneUser,
  deletePayment,
  reactivateCommune,
  reactivateCommuneUser,
  suspendCommune,
  suspendCommuneUser,
} from "@/lib/actions/platform";
import { ROUTES } from "@/lib/constants/routes";
import { COMMUNE_PLAN_LABEL } from "@/lib/constants/statuses";
import { formatCents } from "@/lib/utils/money";
import type {
  CommuneOverviewRow,
  CommunePayment,
  CommuneUserRow,
} from "@/lib/types";

export default async function PlatformClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const ctx = await requireRole([USER_ROLES.platformAdmin]);
  const supabase = await createClient();

  const [{ data: overview }, { data: usersData }, { data: paymentsData }] =
    await Promise.all([
      supabase.rpc("admin_commune_overview"),
      supabase.rpc("admin_commune_users", { p_commune_id: id }),
      supabase
        .from("commune_payments")
        .select("*")
        .eq("commune_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const commune = ((overview ?? []) as CommuneOverviewRow[]).find(
    (c) => c.id === id,
  );
  if (!commune) notFound();

  const users = (usersData ?? []) as CommuneUserRow[];
  const payments = (paymentsData ?? []) as CommunePayment[];
  const isSuspended = commune.subscription_status === "suspended";
  const defaultPaymentAmount = commune.monthly_amount_cents
    ? (commune.monthly_amount_cents / 100).toString()
    : undefined;

  return (
    <div className="space-y-6">
      <BackLink href={ROUTES.platform.clients}>← Retour aux clients</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <PageHeading title={commune.name} />
            <SubscriptionBadge status={commune.subscription_status} />
          </div>
          <p className="text-sm font-medium text-muted">
            INSEE {commune.insee_code}
            {commune.postcode ? ` · ${commune.postcode}` : ""}
            {commune.department ? ` · ${commune.department}` : ""} ·{" "}
            {COMMUNE_PLAN_LABEL[commune.plan]} ·{" "}
            {formatCents(commune.monthly_amount_cents)}/mois
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isSuspended ? (
            <ConfirmButton
              action={reactivateCommune}
              fields={{ communeId: commune.id }}
              label="Réactiver"
              title="Réactiver la commune"
              description={`Réactiver « ${commune.name} » ?`}
              confirmLabel="Réactiver"
              confirmVariant="primary"
            />
          ) : (
            <ConfirmButton
              action={suspendCommune}
              fields={{ communeId: commune.id }}
              label="Suspendre"
              title="Suspendre la commune"
              description={`Suspendre « ${commune.name} » ? Les nouvelles inscriptions seront bloquées.`}
              confirmLabel="Suspendre"
              withReason
            />
          )}
          <ConfirmButton
            action={deleteCommune}
            fields={{ communeId: commune.id }}
            label="Supprimer"
            title="Supprimer la commune"
            description={`Supprimer définitivement « ${commune.name} » et toutes ses données ? Cette action est irréversible.`}
            confirmLabel="Supprimer définitivement"
            variant="danger"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Habitants" value={commune.resident_count} tone="purple" />
        <StatCard
          label="Annonces"
          value={commune.announcement_count}
          tone="aqua"
        />
        <StatCard
          label="Initiatives"
          value={commune.initiative_count}
          tone="mint"
        />
        <StatCard label="Événements" value={commune.event_count} tone="orange" />
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-xl font-semibold text-text">Informations & abonnement</h2>
        <CommuneForm mode="edit" commune={commune} />
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">
            Utilisateurs ({users.length})
          </h2>
        </div>
        {users.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucun utilisateur rattaché à cette commune.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {users.map((u) => (
              <li
                key={u.membership_id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-semibold text-text">
                    {u.display_name ?? u.email ?? "Utilisateur"}
                    {u.role !== "resident" ? (
                      <span className="ml-2 rounded-full bg-soft-pink px-2 py-0.5 text-[10px] font-semibold text-purple">
                        {u.role === "platform_admin" ? "Admin" : "Mairie"}
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs font-medium text-muted">
                    {u.email ?? "—"} · {u.announcement_count} annonces
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <MembershipBadge status={u.membership_status} />
                  {u.membership_status === "suspended" ? (
                    <ConfirmButton
                      action={reactivateCommuneUser}
                      fields={{
                        membershipId: u.membership_id,
                        communeId: commune.id,
                      }}
                      label="Réactiver"
                      title="Réactiver l'utilisateur"
                      description={`Réactiver l'accès de « ${u.display_name ?? u.email ?? "cet utilisateur"} » dans cette commune ?`}
                      confirmLabel="Réactiver"
                      confirmVariant="primary"
                    />
                  ) : (
                    <ConfirmButton
                      action={suspendCommuneUser}
                      fields={{
                        membershipId: u.membership_id,
                        communeId: commune.id,
                      }}
                      label="Suspendre"
                      title="Suspendre l'utilisateur"
                      description={`Suspendre « ${u.display_name ?? u.email ?? "cet utilisateur"} » dans cette commune ?`}
                      confirmLabel="Suspendre"
                      withReason
                    />
                  )}
                  {u.user_id === ctx.userId ? (
                    <span className="text-[10px] font-medium text-subtle">
                      (vous)
                    </span>
                  ) : (
                    <ConfirmButton
                      action={deleteCommuneUser}
                      fields={{ userId: u.user_id, communeId: commune.id }}
                      label="Supprimer"
                      title="Supprimer l'utilisateur"
                      description={`Supprimer définitivement le compte de « ${u.display_name ?? u.email ?? "cet utilisateur"} » ? Cette action est irréversible et retire l'accès à toutes ses communes.`}
                      confirmLabel="Supprimer définitivement"
                      variant="danger"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-text">Paiements & revenus</h2>
          <div className="flex gap-2 text-xs font-medium text-muted">
            <span className="rounded-md bg-mint/15 px-3 py-1 font-semibold text-mint">
              Encaissé : {formatCents(commune.paid_revenue_cents)}
            </span>
            <span className="rounded-md bg-sun/20 px-3 py-1 font-semibold text-orange">
              En attente : {formatCents(commune.pending_revenue_cents)}
            </span>
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm font-medium text-muted">
            Aucun paiement enregistré.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-text">
                    {formatCents(p.amount_cents)}
                  </span>
                  <PaymentBadge status={p.status} />
                  {p.note ? (
                    <span className="text-xs font-medium text-muted">
                      {p.note}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-subtle">
                    {p.period_start ?? "—"}
                    {p.period_end ? ` → ${p.period_end}` : ""}
                  </span>
                  <ConfirmButton
                    action={deletePayment}
                    fields={{ paymentId: p.id, communeId: commune.id }}
                    label="Suppr."
                    title="Supprimer le paiement"
                    description="Supprimer cette ligne de paiement ?"
                    confirmLabel="Supprimer"
                    variant="ghost"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border/60 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-text">
            Enregistrer un paiement
          </h3>
          <PaymentForm
            communeId={commune.id}
            defaultAmount={defaultPaymentAmount}
          />
        </div>
      </Card>
    </div>
  );
}
