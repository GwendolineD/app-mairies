import { Card } from "@/components/ui/card";
import { CategoryTag } from "@/components/ui/category-tag";
import type { Commune } from "@/lib/types";

const STATUS_LABEL: Record<Commune["access_status"], string> = {
  inactive: "Inactif",
  trial: "Période d'essai",
  active: "Actif",
};

const STATUS_STYLE: Record<Commune["access_status"], string> = {
  inactive: "bg-warm text-muted",
  trial: "bg-sun/15 text-orange",
  active: "bg-mint/15 text-mint",
};

export function SubscriptionCard({ commune }: { commune: Commune }) {
  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Statut
          </p>
          <h2 className="text-xl font-semibold leading-7 text-text">
            {commune.name}
          </h2>
        </div>
        <CategoryTag
          label={STATUS_LABEL[commune.access_status]}
          className={STATUS_STYLE[commune.access_status]}
        />
      </div>
    </Card>
  );
}
