import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  hasFilters: boolean;
  clearFiltersHref?: string;
};

export function InitiativesEmptyState({
  hasFilters,
  clearFiltersHref,
}: Props) {
  if (!hasFilters) {
    return (
      <Card className="rounded-xl p-5 text-center text-sm font-medium text-muted">
        Soyez les premiers voisin·es à proposer une idée pour votre commune.
      </Card>
    );
  }

  return (
    <Card className="rounded-xl p-5 text-center">
      <p className="text-sm font-semibold text-text">
        Aucune initiative ne correspond à vos filtres
      </p>
      <p className="mt-1.5 text-sm font-medium text-muted">
        Modifiez ou effacez vos filtres pour découvrir d&apos;autres initiatives
        près de chez vous.
      </p>
      {clearFiltersHref ? (
        <div className="mt-4 flex justify-center">
          <Button
            href={clearFiltersHref}
            variant="secondary"
            size="xs"
            className="h-auto w-fit border-purple/40 px-3 py-1 font-semibold text-purple hover:border-purple/30 hover:bg-surface"
          >
            Effacer tous les filtres
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
