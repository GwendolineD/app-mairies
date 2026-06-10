import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import { formatDay } from "@/lib/utils/date";
import type { Commune } from "@/lib/types";

const STATUS_LABEL: Record<Commune["subscription_status"], string> = {
  inactive: "Inactif",
  trial: "Période d'essai",
  active: "Actif",
  suspended: "Suspendu",
};

const STATUS_STYLE: Record<Commune["subscription_status"], string> = {
  inactive: "bg-warm text-muted",
  trial: "bg-sun/15 text-orange",
  active: "bg-mint/15 text-mint",
  suspended: "bg-coral/15 text-coral",
};

function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}

export function SubscriptionCard({ commune }: { commune: Commune }) {
  const remaining = daysUntil(commune.subscription_ends_at);
  const expired = remaining !== null && remaining < 0;

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Abonnement
          </p>
          <h2 className="text-xl font-semibold leading-7 text-text">
            {commune.name}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTag
            label={STATUS_LABEL[commune.subscription_status]}
            className={STATUS_STYLE[commune.subscription_status]}
          />
          <CategoryTag
            label={commune.subscription_paid ? "Payé" : "Non payé"}
            className={
              commune.subscription_paid
                ? "bg-mint/15 text-mint"
                : "bg-coral/15 text-coral"
            }
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Début
          </dt>
          <dd className="text-sm font-semibold text-text">
            {formatDay(commune.subscription_started_at)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Fin
          </dt>
          <dd className="text-sm font-semibold text-text">
            {formatDay(commune.subscription_ends_at)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Échéance
          </dt>
          <dd
            className={
              expired
                ? "text-sm font-semibold text-coral"
                : "text-sm font-semibold text-text"
            }
          >
            {remaining === null
              ? "—"
              : expired
                ? `Expiré (${Math.abs(remaining)} j)`
                : `${remaining} j restants`}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
