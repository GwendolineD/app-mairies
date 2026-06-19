"use client";

import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyMembersRow } from "@/lib/queries/dashboard-charts";

const chartConfig = {
  inscrits: { label: "Habitants inscrits", color: "var(--turquoise)" },
} satisfies ChartConfig;

export function DashboardMembersChart({
  data,
}: {
  data: WeeklyMembersRow[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <AreaChart data={data} accessibilityLayer>
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
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillInscrits" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-inscrits)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-inscrits)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="inscrits"
          stroke="var(--color-inscrits)"
          strokeWidth={2}
          fill="url(#fillInscrits)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
