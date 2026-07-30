"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  Euro,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  createCommuneSubscriptionPeriod,
  markSubscriptionPaid,
  deleteSubscriptionPeriod,
} from "@/lib/actions/platform";
import { cn } from "@/lib/utils/cn";
import { clampEndDate, formatCompactShortDate, formatShortDate } from "@/lib/datetime";
import { formatEuros } from "@/lib/utils/format-currency";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip";
import { CancellationBadge } from "@/components/features/subscription/cancellation-badge";
import type { SubscriptionPeriod } from "@/lib/queries/commune-subscription";

type CancellationInfo = {
  createdAt: string;
  requesterName: string | null;
  comment: string;
};

type Props = {
  communeId: string;
  subscribedSince: string | null;
  periods: SubscriptionPeriod[];
  cancellationsBySubscription: Record<string, CancellationInfo>;
};

const PAYMENT_METHODS = ["Virement", "Chèque", "CB", "Prélèvement", "Autre"];

function addOneYearMinusOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setFullYear(date.getFullYear() + 1);
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function periodsOverlap(
  newStart: string,
  newEnd: string,
  existingPeriods: SubscriptionPeriod[],
): boolean {
  return existingPeriods.some(
    (p) => newStart <= p.ends_at && newEnd >= p.starts_at,
  );
}

function PaymentStatusBadge({
  status,
  paidAt,
  paymentMethod,
}: {
  status: "paid" | "unpaid";
  paidAt?: string | null;
  paymentMethod?: string | null;
}) {
  if (status === "unpaid") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
          "bg-orange/15 text-orange",
        )}
      >
        <Euro className="size-3.5 shrink-0" aria-hidden />
        En attente
      </span>
    );
  }

  return (
    <Tooltip
      side="right"
      content={
        <>
          <span className="block whitespace-nowrap">
            Date : {paidAt ? formatShortDate(paidAt) : "—"}
          </span>
          <span className="block whitespace-nowrap">
            Moyen : {paymentMethod ?? "—"}
          </span>
        </>
      }
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          "bg-mint/15 text-mint",
        )}
      >
        Payé
      </span>
    </Tooltip>
  );
}

function SubscriptionInfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted">{label}</p>
        <div className="font-medium text-text">{children}</div>
      </div>
    </div>
  );
}

function SubscriptionPeriodMobileCard({
  period,
  cancellation,
  isPending,
  onMarkPaid,
  onDelete,
}: {
  period: SubscriptionPeriod;
  cancellation?: CancellationInfo;
  isPending: boolean;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-warm/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text">
          {formatEuros(period.amount_cents)}
        </p>
        <PaymentStatusBadge
          status={period.payment_status}
          paidAt={period.paid_at}
          paymentMethod={period.payment_method}
        />
      </div>

      <p className="text-sm font-normal text-text">
        Du{" "}
        <span className="font-bold">{formatShortDate(period.starts_at)}</span> au{" "}
        <span className="font-bold">{formatShortDate(period.ends_at)}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <SubscriptionInfoRow icon={RefreshCw} label="Renouvellement auto">
          {period.auto_renew ? "Oui" : "Non"}
        </SubscriptionInfoRow>
        <SubscriptionInfoRow icon={Scale} label="Résiliation">
          {cancellation ? (
            <CancellationBadge
              createdAt={cancellation.createdAt}
              requesterName={cancellation.requesterName}
              comment={cancellation.comment}
            />
          ) : (
            <span className="text-muted">—</span>
          )}
        </SubscriptionInfoRow>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {period.payment_status === "unpaid" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => onMarkPaid(period.id)}
            className="gap-1.5 text-xs text-mint"
          >
            <Wallet className="size-3.5" aria-hidden />
            Marquer payé
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => onDelete(period.id)}
          className="gap-1.5 text-xs text-coral"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Supprimer
        </Button>
      </div>
    </div>
  );
}

export function CommuneSubscriptionSection({
  communeId,
  subscribedSince,
  periods,
  cancellationsBySubscription,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Add period modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    startsAt: "",
    endsAt: "",
    amountCents: "",
  });

  // Mark paid modal
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<string | null>(null);
  const [markPaidData, setMarkPaidData] = useState({
    paidAt: getTodayString(),
    paymentMethod: "",
  });

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Pre-fill dates when opening add modal
  useEffect(() => {
    if (addModalOpen && periods.length > 0) {
      const sortedPeriods = [...periods].sort(
        (a, b) => b.ends_at.localeCompare(a.ends_at),
      );
      const lastEndsAt = sortedPeriods[0].ends_at;
      const nextStartsAt = addOneDay(lastEndsAt);
      const nextEndsAt = addOneYearMinusOneDay(nextStartsAt);
      setNewPeriod((prev) => ({
        ...prev,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
      }));
    } else if (addModalOpen && periods.length === 0) {
      setNewPeriod({ startsAt: "", endsAt: "", amountCents: "" });
    }
  }, [addModalOpen, periods]);

  function handleAddPeriod() {
    setError(null);
    const amountCents = Math.round(Number(newPeriod.amountCents) * 100);
    if (!newPeriod.startsAt || !newPeriod.endsAt || isNaN(amountCents)) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    // Client-side overlap validation
    if (periodsOverlap(newPeriod.startsAt, newPeriod.endsAt, periods)) {
      setError("Les dates chevauchent une période existante.");
      return;
    }

    startTransition(async () => {
      const result = await createCommuneSubscriptionPeriod(communeId, {
        startsAt: newPeriod.startsAt,
        endsAt: newPeriod.endsAt,
        amountCents,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setAddModalOpen(false);
      setNewPeriod({ startsAt: "", endsAt: "", amountCents: "" });
      router.refresh();
    });
  }

  function openMarkPaidModal(subscriptionId: string) {
    setMarkPaidTarget(subscriptionId);
    setMarkPaidData({ paidAt: getTodayString(), paymentMethod: "" });
    setError(null);
    setMarkPaidModalOpen(true);
  }

  function handleMarkPaid() {
    if (!markPaidTarget) return;
    setError(null);

    if (!markPaidData.paidAt || !markPaidData.paymentMethod.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    startTransition(async () => {
      const result = await markSubscriptionPaid(
        markPaidTarget,
        markPaidData.paidAt,
        markPaidData.paymentMethod,
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMarkPaidModalOpen(false);
      setMarkPaidTarget(null);
      router.refresh();
    });
  }

  function openDeleteModal(subscriptionId: string) {
    setDeleteTarget(subscriptionId);
    setError(null);
    setDeleteModalOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteSubscriptionPeriod(deleteTarget);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        {subscribedSince ? (
          <span className="text-sm text-muted">
            Abonné depuis le {formatCompactShortDate(subscribedSince)}
          </span>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="ml-auto shrink-0 gap-1.5 font-semibold"
        >
          <Plus aria-hidden />
          Ajouter
        </Button>
      </div>

      <div className="space-y-6">
        {periods.length === 0 ? (
          <p className="text-sm text-muted">Aucune période enregistrée.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
                {periods.map((period) => (
                  <SubscriptionPeriodMobileCard
                    key={period.id}
                    period={period}
                    cancellation={cancellationsBySubscription[period.id]}
                    isPending={isPending}
                    onMarkPaid={openMarkPaidModal}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted">
                      <th className="py-2 pr-3">Début</th>
                      <th className="py-2 pr-3">Fin</th>
                      <th className="py-2 pr-3">Montant</th>
                      <th className="py-2 pr-3">Paiement</th>
                      <th className="py-2 pr-3">Renew auto</th>
                      <th className="py-2 pr-3">Résiliation</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => {
                      const cancellation = cancellationsBySubscription[period.id];
                      return (
                        <tr key={period.id} className="border-b border-border/60">
                          <td className="py-2 pr-3 font-medium">
                            {formatShortDate(period.starts_at)}
                          </td>
                          <td className="py-2 pr-3">
                            {formatShortDate(period.ends_at)}
                          </td>
                          <td className="py-2 pr-3 font-semibold">
                            {formatEuros(period.amount_cents)}
                          </td>
                          <td className="py-2 pr-3">
                            <PaymentStatusBadge
                              status={period.payment_status}
                              paidAt={period.paid_at}
                              paymentMethod={period.payment_method}
                            />
                          </td>
                          <td className="py-2 pr-3 text-muted">
                            {period.auto_renew ? "Oui" : "Non"}
                          </td>
                          <td className="py-2 pr-3">
                            {cancellation ? (
                              <CancellationBadge
                                createdAt={cancellation.createdAt}
                                requesterName={cancellation.requesterName}
                                comment={cancellation.comment}
                              />
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              {period.payment_status === "unpaid" ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disabled={isPending}
                                  onClick={() => openMarkPaidModal(period.id)}
                                  className="text-xs text-mint"
                                >
                                  Marquer payé
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => openDeleteModal(period.id)}
                                className="text-xs text-coral"
                              >
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
      </div>

      {/* Add period modal */}
      <Modal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setError(null);
        }}
        title="Ajouter une période"
      >
        <div className="space-y-4">
          <FormField label="Date de début">
            <DatePickerField
              value={newPeriod.startsAt}
              onChange={(startsAt) => {
                setNewPeriod((prev) => ({
                  ...prev,
                  startsAt,
                  endsAt: startsAt ? addOneYearMinusOneDay(startsAt) : "",
                }));
              }}
              className="w-full"
              placeholder="Choisir une date"
            />
          </FormField>
          <FormField label="Date de fin">
            <DatePickerField
              value={newPeriod.endsAt}
              onChange={(endsAt) =>
                setNewPeriod((prev) => ({
                  ...prev,
                  endsAt: clampEndDate(endsAt, prev.startsAt),
                }))
              }
              minDate={newPeriod.startsAt || undefined}
              className="w-full"
              placeholder="Choisir une date"
            />
          </FormField>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Montant
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min="0"
                value={newPeriod.amountCents}
                onChange={(e) =>
                  setNewPeriod((prev) => ({
                    ...prev,
                    amountCents: e.target.value,
                  }))
                }
                placeholder="500"
                className="w-1/4 min-w-24 rounded-sm border border-border bg-surface px-3 py-2 text-sm"
              />
              <span className="text-sm font-medium text-text">€</span>
            </div>
          </div>
          {error ? (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleAddPeriod}
            >
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark paid modal */}
      <Modal
        open={markPaidModalOpen}
        onClose={() => {
          setMarkPaidModalOpen(false);
          setMarkPaidTarget(null);
          setError(null);
        }}
        title="Marquer comme payé"
      >
        <div className="space-y-4">
          <FormField label="Date de paiement">
            <DatePickerField
              value={markPaidData.paidAt}
              onChange={(paidAt) =>
                setMarkPaidData((prev) => ({ ...prev, paidAt }))
              }
              className="w-full"
              placeholder="Choisir une date"
            />
          </FormField>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Moyen de paiement
            </label>
            <input
              type="text"
              list="payment-methods"
              value={markPaidData.paymentMethod}
              onChange={(e) =>
                setMarkPaidData((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value,
                }))
              }
              placeholder="Virement, Chèque, CB…"
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
            <datalist id="payment-methods">
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method} />
              ))}
            </datalist>
          </div>
          {error ? (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMarkPaidModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending}
              onClick={handleMarkPaid}
            >
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
          setError(null);
        }}
        title="Supprimer la période"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Êtes-vous sûr de vouloir supprimer cette période d&apos;abonnement ?
            Cette action est irréversible.
          </p>
          {error ? (
            <p className="text-sm text-coral" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
