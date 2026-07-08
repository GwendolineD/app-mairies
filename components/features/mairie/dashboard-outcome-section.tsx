"use client";

import { useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  getCategoryLabel,
  getCategoryColorHex,
} from "@/lib/constants/announcement-categories";
import {
  getInitiativeCategoryLabel,
  getInitiativeCategoryColorHex,
} from "@/lib/constants/initiative-categories";
import type {
  OutcomeSummary,
  OutcomeSection,
  CategoryBreakdown,
} from "@/lib/queries/dashboard-charts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type PieSection = {
  title: string;
  section: OutcomeSection;
  fulfilledColor: string;
  unfulfilledColor: string;
  fulfilledPopoverLabel: (count: number) => string;
  unfulfilledPopoverLabel: (count: number) => string;
  labelResolver: (slug: string) => string;
  colorResolver: (slug: string) => string;
};

function successRate(fulfilled: number, unfulfilled: number): string {
  const total = fulfilled + unfulfilled;
  if (total === 0) return "—";
  return `${Math.round((fulfilled / total) * 100)} %`;
}

function OutcomePieCard({
  title,
  section,
  fulfilledColor,
  unfulfilledColor,
  fulfilledPopoverLabel,
  unfulfilledPopoverLabel,
  labelResolver,
  colorResolver,
}: PieSection) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const total = section.fulfilled + section.unfulfilled;

  const pieData = [
    { name: "fulfilled", value: section.fulfilled },
    { name: "unfulfilled", value: section.unfulfilled },
  ].filter((d) => d.value > 0);

  const colors = {
    fulfilled: fulfilledColor,
    unfulfilled: unfulfilledColor,
  };

  const chartConfig: ChartConfig = {
    fulfilled: { label: "Réussi", color: fulfilledColor },
    unfulfilled: { label: "Non réussi", color: unfulfilledColor },
  };

  const fulfilledCategories = section.byCategory.filter((c) => c.fulfilled > 0);
  const unfulfilledCategories = section.byCategory.filter(
    (c) => c.unfulfilled > 0,
  );

  if (total === 0) return null;

  const chart = (
    <ChartContainer
      config={chartConfig}
      initialDimension={{ width: 120, height: 120 }}
      className="aspect-square w-full md:mx-auto md:size-[140px]"
    >
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius="88%"
          strokeWidth={1}
          stroke="var(--surface)"
          className="outline-none"
        >
          {pieData.map((entry) => (
            <Cell
              key={entry.name}
              fill={colors[entry.name as keyof typeof colors]}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );

  return (
    <Card className="flex flex-col gap-2 max-md:rounded-none max-md:border-0 max-md:p-0 max-md:!bg-transparent max-md:!shadow-none md:gap-3 md:rounded-lg md:border md:border-border/60 md:bg-surface md:p-5 md:shadow-card">
      <div className="flex w-full items-baseline justify-center gap-2">
        <p className="shrink-0 text-xl font-bold leading-none text-text md:text-2xl">
          {successRate(section.fulfilled, section.unfulfilled)}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
      </div>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="block w-full cursor-pointer rounded-sm border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-purple/30 md:mx-auto md:w-auto"
              aria-label={`${title} — voir les détails`}
            />
          }
        >
          {chart}
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="w-64 gap-3 p-3">
          <p className="text-center text-[10px] font-medium text-muted">
            Sur un total de {total} retour{total > 1 ? "s" : ""}
          </p>

          {section.fulfilled > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-text">
                {fulfilledPopoverLabel(section.fulfilled)}
              </p>
              {fulfilledCategories.length > 0 ? (
                <CategoryCountList
                  categories={fulfilledCategories}
                  countKey="fulfilled"
                  labelResolver={labelResolver}
                  colorResolver={colorResolver}
                />
              ) : null}
            </div>
          ) : null}

          {section.unfulfilled > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-text">
                {unfulfilledPopoverLabel(section.unfulfilled)}
              </p>
              {unfulfilledCategories.length > 0 ? (
                <CategoryCountList
                  categories={unfulfilledCategories}
                  countKey="unfulfilled"
                  labelResolver={labelResolver}
                  colorResolver={colorResolver}
                />
              ) : null}
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </Card>
  );
}

function CategoryCountList({
  categories,
  countKey,
  labelResolver,
  colorResolver,
}: {
  categories: CategoryBreakdown[];
  countKey: "fulfilled" | "unfulfilled";
  labelResolver: (slug: string) => string;
  colorResolver: (slug: string) => string;
}) {
  return (
    <ul className="space-y-1.5">
      {categories.map((cat) => (
        <li
          key={cat.categorySlug}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorResolver(cat.categorySlug) }}
            />
            <span className="font-medium text-text">
              {labelResolver(cat.categorySlug)}
            </span>
          </div>
          <span className="shrink-0 tabular-nums text-muted">
            {cat[countKey]}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  stats: OutcomeSummary;
};

export function DashboardOutcomeSection({ stats }: Props) {
  const demandeTotal =
    stats.announcementDemande.fulfilled + stats.announcementDemande.unfulfilled;
  const offreTotal =
    stats.announcementOffre.fulfilled + stats.announcementOffre.unfulfilled;
  const eventTotal = stats.events.fulfilled + stats.events.unfulfilled;

  const hasAnyData = demandeTotal + offreTotal + eventTotal > 0;
  if (!hasAnyData) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">
          Impact de l&apos;entraide
        </h2>
        <p className="text-sm font-medium text-muted max-md:mb-6">
          Cliquez sur un graphique pour voir les détails
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {demandeTotal > 0 ? (
          <OutcomePieCard
            title="Demandes satisfaites"
            section={stats.announcementDemande}
            fulfilledColor="var(--coral)"
            unfulfilledColor="var(--border)"
            fulfilledPopoverLabel={(count) =>
              `${count} demande${count > 1 ? "s" : ""} satisfaite${count > 1 ? "s" : ""}`
            }
            unfulfilledPopoverLabel={(count) =>
              `${count} demande${count > 1 ? "s" : ""} non satisfaite${count > 1 ? "s" : ""}`
            }
            labelResolver={getCategoryLabel}
            colorResolver={getCategoryColorHex}
          />
        ) : null}
        {offreTotal > 0 ? (
          <OutcomePieCard
            title="Offres utiles"
            section={stats.announcementOffre}
            fulfilledColor="var(--turquoise)"
            unfulfilledColor="var(--border)"
            fulfilledPopoverLabel={(count) =>
              `${count} offre${count > 1 ? "s" : ""} utile${count > 1 ? "s" : ""}`
            }
            unfulfilledPopoverLabel={(count) =>
              `${count} offre${count > 1 ? "s" : ""} non utile${count > 1 ? "s" : ""}`
            }
            labelResolver={getCategoryLabel}
            colorResolver={getCategoryColorHex}
          />
        ) : null}
        {eventTotal > 0 ? (
          <OutcomePieCard
            title="Événements tenus"
            section={stats.events}
            fulfilledColor="var(--orange)"
            unfulfilledColor="var(--border)"
            fulfilledPopoverLabel={(count) =>
              `${count} événement${count > 1 ? "s" : ""} tenu${count > 1 ? "s" : ""}`
            }
            unfulfilledPopoverLabel={(count) =>
              `${count} événement${count > 1 ? "s" : ""} non tenu${count > 1 ? "s" : ""}`
            }
            labelResolver={getInitiativeCategoryLabel}
            colorResolver={getInitiativeCategoryColorHex}
          />
        ) : null}
      </div>
    </div>
  );
}
