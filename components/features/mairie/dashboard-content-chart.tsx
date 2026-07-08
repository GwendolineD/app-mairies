"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyContentRow } from "@/lib/queries/dashboard-charts";

const chartConfig = {
  annonces: { label: "Annonces", color: "var(--purple)" },
  initiatives: { label: "Initiatives", color: "var(--mint)" },
  evenements: { label: "Événements", color: "var(--orange)" },
} satisfies ChartConfig;

export function DashboardContentChart({
  data,
}: {
  data: WeeklyContentRow[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <LineChart
        data={data}
        accessibilityLayer
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={24}
          tickMargin={4}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="annonces"
          stroke="var(--color-annonces)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="initiatives"
          stroke="var(--color-initiatives)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="evenements"
          stroke="var(--color-evenements)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
