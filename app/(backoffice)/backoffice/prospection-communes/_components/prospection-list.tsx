"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ProspectCommuneListItem } from "@/lib/prospect-communes/types";
import {
  buildProspectCommunesQuery,
  mergeProspectCommunesParams,
  type ProspectCommunesListParams,
} from "@/lib/prospect-communes/filter-params";
import { Card } from "@/components/ui/card";
import {
  getPopulationBucket,
  POPULATION_COLOR_HEX,
} from "@/lib/prospect-communes/population-buckets";
import { formatHorairesDisplay } from "@/lib/prospect-communes/format-horaires-display";
import { cn } from "@/lib/utils/cn";

type Props = {
  params: ProspectCommunesListParams;
  items: ProspectCommuneListItem[];
};

const BUCKET_BORDER_CLASS: Record<string, string> = {
  mint: "border-l-mint",
  turquoise: "border-l-turquoise",
  aqua: "border-l-aqua",
  sun: "border-l-sun",
  orange: "border-l-orange",
  coral: "border-l-coral",
};

export function ProspectionList({ params, items }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function openDetail(id: string) {
    startTransition(() => {
      router.push(
        `${pathname}${buildProspectCommunesQuery(
          mergeProspectCommunesParams(params, { detailId: id }),
        )}`,
      );
    });
  }

  if (items.length === 0) {
    return (
      <Card className="rounded-xl p-8 text-center text-sm font-medium text-muted">
        Aucune commune ne correspond — élargissez les filtres.
      </Card>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const bucket = getPopulationBucket(item.population);
        const hasCoords =
          item.latitude != null &&
          item.longitude != null &&
          item.geocode_source !== "failed";

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => openDetail(item.id)}
            className={cn(
              "cursor-pointer rounded-xl border border-border/70 border-l-4 bg-surface p-4 text-left shadow-card transition hover:border-purple/30",
              BUCKET_BORDER_CLASS[bucket.colorToken],
              params.detailId === item.id && "ring-2 ring-purple/30",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{item.commune}</p>
                <p className="text-xs text-muted">
                  Dept. {item.departement}
                  {item.postcode ? ` · ${item.postcode}` : null}
                </p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  color: POPULATION_COLOR_HEX[bucket.colorToken],
                  backgroundColor: `${POPULATION_COLOR_HEX[bucket.colorToken]}22`,
                }}
              >
                {item.population.toLocaleString("fr-FR")} hab.
              </span>
            </div>

            <p className="mt-2 text-sm text-muted">
              Maire : {item.maire ?? "—"}
            </p>

            <p className="mt-1 text-xs leading-5 text-subtle">
              {formatHorairesDisplay(item.horaires_ouverture)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {!hasCoords ? (
                <span className="rounded-full bg-warm px-2 py-0.5 text-[10px] font-semibold text-muted">
                  Position inconnue
                </span>
              ) : null}
              {item.emails.length === 0 ? (
                <span className="rounded-full bg-warm px-2 py-0.5 text-[10px] font-semibold text-muted">
                  Sans email
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
