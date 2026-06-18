"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ReviewsPerWeek } from "../server/queries";

const chartConfig = {
  count: {
    label: "Reviews",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ReviewsPerWeekChart({ data }: { data: ReviewsPerWeek[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.week.slice(5),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={formatted} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
