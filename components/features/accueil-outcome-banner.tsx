import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

type Props = {
  fulfilledCount: number;
};

export function AccueilOutcomeBanner({ fulfilledCount }: Props) {
  if (fulfilledCount <= 0) return null;

  const label =
    fulfilledCount === 1
      ? "1 voisin a trouvé l'aide qu'il cherchait cette semaine"
      : `${fulfilledCount} voisins ont trouvé l'aide qu'ils cherchaient cette semaine`;

  return (
    <Card className="flex items-start gap-3 border-mint/30 bg-mint/5 p-4 md:p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint/15">
        <Sparkles className="size-5 text-mint" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="text-sm font-medium text-muted">
          Votre commune s&apos;entraide — merci à tou·tes celles et ceux qui
          participent !
        </p>
      </div>
    </Card>
  );
}
