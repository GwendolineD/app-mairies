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
import {
  POPULATION_BRACKET_LABELS,
  type PopulationStatsResult,
} from "@/lib/queries/backoffice-users-list.types";

const chartConfig = {
  avgMembers: {
    label: "Adhérent·es (moy.)",
    color: "var(--purple)",
  },
  avgPendingInvites: {
    label: "Invitations en cours (moy.)",
    color: "var(--orange)",
  },
} satisfies ChartConfig;

type UtilisateursStatsChartProps = {
  stats: PopulationStatsResult;
};

export function UtilisateursStatsChart({ stats }: UtilisateursStatsChartProps) {
  const hasPopulationData = stats.brackets.some(
    (bracket) => bracket.communeCount > 0,
  );

  const chartData = stats.brackets.map((bracket) => ({
    bracket: POPULATION_BRACKET_LABELS[bracket.bracket],
    avgMembers: bracket.avgMembers,
    avgPendingInvites: bracket.avgPendingInvites,
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
            Nombre moyen d&apos;adhérent·es actif·ves et d&apos;invitations en
            cours, par tranche de population.
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
              dataKey="avgMembers"
              fill="var(--color-avgMembers)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="avgPendingInvites"
              fill="var(--color-avgPendingInvites)"
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
