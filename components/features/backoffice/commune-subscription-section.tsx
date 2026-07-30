"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  Euro,
  Plus,
  RefreshCw,
  Scale,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  createCommuneSubscriptionPeriod,
  updateCommuneSubscriptionPeriod,
  markSubscriptionPaid,
  markSubscriptionUnpaid,
  deleteSubscriptionPeriod,
} from "@/lib/actions/platform";
import { cn } from "@/lib/utils/cn";
import { clampEndDate, formatCompactShortDate, formatShortDate } from "@/lib/datetime";
import { formatEuros } from "@/lib/utils/format-currency";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormField, Input, Select } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { CancellationBadge } from "@/components/features/subscription/cancellation-badge";
import type { SubscriptionPeriod } from "@/lib/queries/commune-subscription";

type CancellationInfo = {
  createdAt: string;
  requesterName: string | null;
  comment: string;
};

type PaymentFormState = {
  isUnpaid: boolean;
  paidAt: string;
  paymentMethod: string;
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
  excludeId?: string,
): boolean {
  return existingPeriods.some(
    (p) =>
      p.id !== excludeId &&
      newStart <= p.ends_at &&
      newEnd >= p.starts_at,
  );
}

function PaymentStatusBadge({
  status,
  onOpenPayment,
}: {
  status: "paid" | "unpaid";
  onOpenPayment?: () => void;
}) {
  if (status === "unpaid") {
    return (
      <button
        type="button"
        onClick={onOpenPayment}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-90",
          "bg-orange/15 text-orange",
        )}
        aria-label="Marquer comme payé"
      >
        <Euro className="size-3.5 shrink-0" aria-hidden />
        En attente
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenPayment}
      className={cn(
        "inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-90",
        "bg-mint/15 text-mint",
      )}
      aria-label="Modifier le paiement"
    >
      Payé
    </button>
  );
}

function UnpaidCheckbox({
  checked,
  onToggle,
  disabled,
}: {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-text">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onToggle(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer rounded-sm accent-purple disabled:cursor-not-allowed disabled:opacity-50"
      />
      Non payé
    </label>
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
  onOpenPayment,
  onEditPeriod,
  onDelete,
}: {
  period: SubscriptionPeriod;
  cancellation?: CancellationInfo;
  isPending: boolean;
  onOpenPayment: (period: SubscriptionPeriod) => void;
  onEditPeriod: (period: SubscriptionPeriod) => void;
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
          onOpenPayment={() => onOpenPayment(period)}
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

      <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => onEditPeriod(period)}
        >
          Modifier
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => onDelete(period.id)}
          className="gap-1.5 text-coral"
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

  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodEditTarget, setPeriodEditTarget] =
    useState<SubscriptionPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState({
    startsAt: "",
    endsAt: "",
    amountCents: "",
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<SubscriptionPeriod | null>(
    null,
  );
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    isUnpaid: false,
    paidAt: getTodayString(),
    paymentMethod: "",
  });
  const [paymentInitialForm, setPaymentInitialForm] =
    useState<PaymentFormState | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const periodAmountCents = Math.round(Number(periodForm.amountCents) * 100);
  const hasValidPeriodFields =
    Boolean(periodForm.startsAt) &&
    Boolean(periodForm.endsAt) &&
    periodForm.endsAt >= periodForm.startsAt &&
    periodForm.amountCents.trim() !== "" &&
    !isNaN(periodAmountCents) &&
    periodAmountCents >= 0;

  const hasPeriodChanges =
    !periodEditTarget ||
    periodForm.startsAt !== periodEditTarget.starts_at ||
    periodForm.endsAt !== periodEditTarget.ends_at ||
    periodAmountCents !== periodEditTarget.amount_cents;

  const canSavePeriod =
    hasValidPeriodFields &&
    !periodsOverlap(
      periodForm.startsAt,
      periodForm.endsAt,
      periods,
      periodEditTarget?.id,
    ) &&
    hasPeriodChanges;

  const isPeriodEditMode = periodEditTarget !== null;

  const hasValidPaymentFields =
    paymentForm.isUnpaid ||
    (Boolean(paymentForm.paidAt) && paymentForm.paymentMethod.trim().length > 0);

  const hasPaymentChanges =
    !paymentInitialForm ||
    paymentForm.isUnpaid !== paymentInitialForm.isUnpaid ||
    paymentForm.paidAt !== paymentInitialForm.paidAt ||
    paymentForm.paymentMethod !== paymentInitialForm.paymentMethod;

  const canConfirmPayment = hasValidPaymentFields && hasPaymentChanges;

  const isPaymentEditMode = paymentTarget?.payment_status === "paid";

  useEffect(() => {
    if (!periodModalOpen || periodEditTarget) return;

    if (periods.length > 0) {
      const sortedPeriods = [...periods].sort(
        (a, b) => b.ends_at.localeCompare(a.ends_at),
      );
      const lastEndsAt = sortedPeriods[0].ends_at;
      const nextStartsAt = addOneDay(lastEndsAt);
      const nextEndsAt = addOneYearMinusOneDay(nextStartsAt);
      setPeriodForm({
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        amountCents: "",
      });
    } else {
      setPeriodForm({ startsAt: "", endsAt: "", amountCents: "" });
    }
  }, [periodModalOpen, periodEditTarget, periods]);

  function openCreatePeriodModal() {
    setPeriodEditTarget(null);
    setError(null);
    setPeriodModalOpen(true);
  }

  function openEditPeriodModal(period: SubscriptionPeriod) {
    setPeriodEditTarget(period);
    setPeriodForm({
      startsAt: period.starts_at,
      endsAt: period.ends_at,
      amountCents: String(period.amount_cents / 100),
    });
    setError(null);
    setPeriodModalOpen(true);
  }

  function closePeriodModal() {
    setPeriodModalOpen(false);
    setPeriodEditTarget(null);
    setPeriodForm({ startsAt: "", endsAt: "", amountCents: "" });
    setError(null);
  }

  function handleSavePeriod() {
    setError(null);
    if (!canSavePeriod) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    startTransition(async () => {
      const payload = {
        startsAt: periodForm.startsAt,
        endsAt: periodForm.endsAt,
        amountCents: periodAmountCents,
      };

      const result = periodEditTarget
        ? await updateCommuneSubscriptionPeriod(periodEditTarget.id, payload)
        : await createCommuneSubscriptionPeriod(communeId, payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      closePeriodModal();
      router.refresh();
    });
  }

  function openPaymentModal(period: SubscriptionPeriod) {
    const initialForm: PaymentFormState =
      period.payment_status === "paid"
        ? {
            isUnpaid: false,
            paidAt: period.paid_at ?? getTodayString(),
            paymentMethod: period.payment_method ?? "",
          }
        : {
            isUnpaid: false,
            paidAt: getTodayString(),
            paymentMethod: "",
          };

    setPaymentTarget(period);
    setPaymentForm(initialForm);
    setPaymentInitialForm(initialForm);
    setError(null);
    setPaymentModalOpen(true);
  }

  function handleUnpaidToggle(checked: boolean) {
    if (checked) {
      setPaymentForm({ isUnpaid: true, paidAt: "", paymentMethod: "" });
    } else {
      setPaymentForm((prev) => ({
        ...prev,
        isUnpaid: false,
        paidAt: prev.paidAt || getTodayString(),
      }));
    }
  }

  function handlePaidAtChange(paidAt: string) {
    setPaymentForm((prev) => ({ ...prev, paidAt, isUnpaid: false }));
  }

  function handlePaymentMethodChange(paymentMethod: string) {
    setPaymentForm((prev) => ({ ...prev, paymentMethod, isUnpaid: false }));
  }

  function closePaymentModal() {
    setPaymentModalOpen(false);
    setPaymentTarget(null);
    setPaymentInitialForm(null);
    setError(null);
  }

  function handlePaymentSubmit() {
    if (!paymentTarget || !canConfirmPayment) return;
    setError(null);

    startTransition(async () => {
      const result = paymentForm.isUnpaid
        ? await markSubscriptionUnpaid(paymentTarget.id)
        : await markSubscriptionPaid(
            paymentTarget.id,
            paymentForm.paidAt,
            paymentForm.paymentMethod,
          );

      if (!result.success) {
        setError(result.error);
        return;
      }

      closePaymentModal();
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
          onClick={openCreatePeriodModal}
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
                  onOpenPayment={openPaymentModal}
                  onEditPeriod={openEditPeriodModal}
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
                            onOpenPayment={() => openPaymentModal(period)}
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
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => openEditPeriodModal(period)}
                              className="text-xs"
                            >
                              Modifier
                            </Button>
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

      <Modal
        open={periodModalOpen}
        onClose={closePeriodModal}
        title={isPeriodEditMode ? "Modifier la période" : "Ajouter une période"}
      >
        <div className="space-y-4">
          <FormField label="Date de début">
            <DatePickerField
              value={periodForm.startsAt}
              onChange={(startsAt) => {
                setPeriodForm((prev) => ({
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
              value={periodForm.endsAt}
              onChange={(endsAt) =>
                setPeriodForm((prev) => ({
                  ...prev,
                  endsAt: clampEndDate(endsAt, prev.startsAt),
                }))
              }
              minDate={periodForm.startsAt || undefined}
              className="w-full"
              placeholder="Choisir une date"
            />
          </FormField>
          <FormField label="Montant">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="1"
                min="0"
                value={periodForm.amountCents}
                onChange={(event) =>
                  setPeriodForm((prev) => ({
                    ...prev,
                    amountCents: event.target.value,
                  }))
                }
                placeholder="500"
                className="w-1/4 min-w-24"
              />
              <span className="text-sm font-medium text-text">€</span>
            </div>
          </FormField>
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
              onClick={closePeriodModal}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending || !canSavePeriod}
              onClick={handleSavePeriod}
            >
              {isPeriodEditMode ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={paymentModalOpen}
        onClose={closePaymentModal}
        title={isPaymentEditMode ? "Modifier le paiement" : "Marquer comme payé"}
      >
        <div className="space-y-4">
          <UnpaidCheckbox
            checked={paymentForm.isUnpaid}
            onToggle={handleUnpaidToggle}
            disabled={isPending}
          />

          <FormField label="Date de paiement">
            <DatePickerField
              value={paymentForm.paidAt}
              onChange={handlePaidAtChange}
              className="w-full"
              placeholder="Choisir une date"
            />
          </FormField>

          <FormField label="Moyen de paiement">
            <Select
              value={paymentForm.paymentMethod}
              onChange={(event) =>
                handlePaymentMethodChange(event.target.value)
              }
            >
              <option value="">Choisir un moyen</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </FormField>

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
              onClick={closePaymentModal}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending || !canConfirmPayment}
              onClick={handlePaymentSubmit}
            >
              {isPaymentEditMode ? "Enregistrer" : "Confirmer"}
            </Button>
          </div>
        </div>
      </Modal>

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
