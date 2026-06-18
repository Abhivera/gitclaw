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
import type { SeverityBreakdown } from "../server/queries";

const chartConfig = {
  issue: {
    label: "Issues",
    color: "var(--chart-1)",
  },
  suggestion: {
    label: "Suggestions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function SeverityChart({ data }: { data: SeverityBreakdown[] }) {
  const formatted = data.map((d) => ({
    name: d.severity === "issue" ? "Issues" : "Suggestions",
    count: d.count,
    fill:
      d.severity === "issue"
        ? "var(--color-issue)"
        : "var(--color-suggestion)",
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={formatted} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
