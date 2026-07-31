"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ContentPopulationStatsResult } from "@/lib/queries/backoffice-contenus";
import { POPULATION_BRACKET_LABELS } from "@/lib/queries/backoffice-users-list.types";

const chartConfig = {
  avgAnnouncements: {
    label: "Annonces (moy.)",
    color: "var(--coral)",
  },
  avgInitiatives: {
    label: "Initiatives (moy.)",
    color: "var(--mint)",
  },
  avgEvents: {
    label: "Événements (moy.)",
    color: "var(--orange)",
  },
} satisfies ChartConfig;

type ContenusStatsChartProps = {
  stats: ContentPopulationStatsResult;
};

export function ContenusStatsChart({ stats }: ContenusStatsChartProps) {
  const hasPopulationData = stats.brackets.some(
    (bracket) => bracket.communeCount > 0,
  );

  const chartData = stats.brackets.map((bracket) => ({
    bracket: POPULATION_BRACKET_LABELS[bracket.bracket],
    avgAnnouncements: bracket.avgAnnouncements,
    avgInitiatives: bracket.avgInitiatives,
    avgEvents: bracket.avgEvents,
    communeCount: bracket.communeCount,
  }));

  if (!hasPopulationData) {
    return (
      <Card className="rounded-xl p-6 text-sm font-medium text-muted">
        Aucune commune n&apos;a de population renseignée. Modifiez les
        informations de chaque commune pour visualiser les statistiques.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-4 rounded-xl p-5">
        <div>
          <h2 className="text-lg font-semibold leading-7 text-text">
            Moyennes par taille de commune
          </h2>
          <p className="text-sm font-medium text-muted">
            Nombre moyen de contenus publiés par type, par tranche de
            population.
          </p>
        </div>

        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart
            data={chartData}
            accessibilityLayer
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="bracket"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals
              width={28}
              tickMargin={4}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="avgAnnouncements"
              fill="var(--color-avgAnnouncements)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="avgInitiatives"
              fill="var(--color-avgInitiatives)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="avgEvents"
              fill="var(--color-avgEvents)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </Card>

      {stats.communesWithoutPopulation > 0 ? (
        <p className="text-sm font-medium text-muted">
          {stats.communesWithoutPopulation} commune
          {stats.communesWithoutPopulation > 1 ? "s" : ""} sans population
          renseignée — non incluse
          {stats.communesWithoutPopulation > 1 ? "s" : ""} dans le calcul.
        </p>
      ) : null}
    </div>
  );
}
