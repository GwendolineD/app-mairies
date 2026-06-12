"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  createCommuneSubscriptionPeriod,
  markSubscriptionPaid,
  deleteSubscriptionPeriod,
} from "@/lib/actions/platform";
import { cn } from "@/lib/utils/cn";
import { formatShortDate } from "@/lib/utils/format-date";
import { formatEuros } from "@/lib/utils/format-currency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          "bg-orange/15 text-orange",
        )}
      >
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
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold leading-7 text-text">
          Abonnement
        </h2>
        {subscribedSince && (
          <span className="text-sm text-muted">
            Abonné depuis le {formatShortDate(subscribedSince)}
          </span>
        )}
      </div>

      <Card className="space-y-6 p-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">
              Périodes d&apos;abonnement
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddModalOpen(true)}
              className="text-xs"
            >
              + Ajouter
            </Button>
          </div>

          {periods.length === 0 ? (
            <p className="text-sm text-muted">Aucune période enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
          )}
        </div>
      </Card>

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
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Date de début
            </label>
            <input
              type="date"
              value={newPeriod.startsAt}
              onChange={(e) => {
                const startsAt = e.target.value;
                setNewPeriod((prev) => ({
                  ...prev,
                  startsAt,
                  endsAt: startsAt ? addOneYearMinusOneDay(startsAt) : "",
                }));
              }}
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Date de fin
            </label>
            <input
              type="date"
              value={newPeriod.endsAt}
              onChange={(e) =>
                setNewPeriod((prev) => ({ ...prev, endsAt: e.target.value }))
              }
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Date de paiement
            </label>
            <input
              type="date"
              value={markPaidData.paidAt}
              onChange={(e) =>
                setMarkPaidData((prev) => ({ ...prev, paidAt: e.target.value }))
              }
              className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
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
