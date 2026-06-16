"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatShortDate } from "@/lib/utils/format-date";
import { formatEuros } from "@/lib/utils/format-currency";
import { Button } from "@/components/ui/button";
import { CancellationRequestModal } from "./cancellation-request-modal";
import type { SubscriptionPeriod } from "@/lib/queries/commune-subscription";

export type CancellationInfo = {
  createdAt: string;
  requesterName: string | null;
  comment: string;
};

type Props = {
  communeId: string;
  periods: SubscriptionPeriod[];
  cancellationsBySubscription: Record<string, CancellationInfo>;
};

function PaymentStatusBadge({ status }: { status: "paid" | "unpaid" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "paid"
          ? "bg-mint/15 text-mint"
          : "bg-orange/15 text-orange",
      )}
    >
      {status === "paid" ? "Payé" : "En attente"}
    </span>
  );
}

export function SubscriptionPeriodsTable({
  communeId,
  periods,
  cancellationsBySubscription,
}: Props) {
  const [modalSubscriptionId, setModalSubscriptionId] = useState<string | null>(
    null,
  );

  const today = new Date().toISOString().slice(0, 10);
  const modalPeriod = periods.find((p) => p.id === modalSubscriptionId);

  if (periods.length === 0) {
    return (
      <p className="text-sm font-medium text-muted">
        Aucune période d&apos;abonnement enregistrée.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted">
              <th className="py-3 pr-4">Début</th>
              <th className="py-3 pr-4">Fin</th>
              <th className="py-3 pr-4">Montant</th>
              <th className="py-3 pr-4">Paiement</th>
              <th className="py-3 pr-4">Renouvellement</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => {
              const isActive = period.ends_at >= today;
              const cancellation = cancellationsBySubscription[period.id];

              return (
                <tr key={period.id} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium text-text">
                    {formatShortDate(period.starts_at)}
                  </td>
                  <td className="py-3 pr-4 text-text">
                    {formatShortDate(period.ends_at)}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-text">
                    {formatEuros(period.amount_cents)}
                  </td>
                  <td className="py-3 pr-4">
                    <PaymentStatusBadge status={period.payment_status} />
                  </td>
                  <td className="py-3 pr-4 text-muted">
                    {period.auto_renew ? "Auto" : "Non"}
                  </td>
                  <td className="py-3">
                    {cancellation ? (
                      <span className="block text-xs text-text">
                        <span className="block">
                          Résilié le {formatShortDate(cancellation.createdAt)}
                        </span>
                        {cancellation.requesterName ? (
                          <span className="block">
                            par {cancellation.requesterName}
                          </span>
                        ) : null}
                      </span>
                    ) : isActive ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setModalSubscriptionId(period.id)}
                        className="border-coral/30 bg-coral/10 text-xs text-coral hover:bg-coral/20"
                      >
                        Je résilie
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalPeriod ? (
        <CancellationRequestModal
          communeId={communeId}
          subscriptionId={modalPeriod.id}
          periodEndsAt={modalPeriod.ends_at}
          open={modalSubscriptionId !== null}
          onClose={() => setModalSubscriptionId(null)}
        />
      ) : null}
    </>
  );
}
