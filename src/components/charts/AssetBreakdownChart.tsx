"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatCompactChartCurrency } from "@/lib/charts/formatChartCurrency";
import type { AssetAllocationPoint } from "@/types/charts";

interface AssetBreakdownChartProps {
  data: AssetAllocationPoint[];
}

const accounts = [
  { dataKey: "pension", name: "Pension", color: "var(--chart-pension)" },
  { dataKey: "isa", name: "ISA", color: "var(--chart-isa)" },
  { dataKey: "gia", name: "GIA", color: "var(--chart-gia)" },
  { dataKey: "cash", name: "Cash", color: "var(--chart-cash)" },
] as const;

export function AssetBreakdownChart({ data }: AssetBreakdownChartProps) {
  return (
    <ChartCard
      description="How your projected pension, ISA, GIA and cash balances change over time."
      title="Asset Allocation Through Retirement"
    >
      <div className="h-72 min-w-0 sm:h-80">
        <ResponsiveContainer height="100%" minWidth={0} width="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 12, right: 12, left: 8, bottom: 4 }}
          >
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="age"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickLine={false}
              tickCount={7}
              type="number"
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickFormatter={formatCompactChartCurrency}
              tickLine={false}
              width={64}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {value}
                </span>
              )}
              verticalAlign="top"
            />
            {accounts.map((account) => (
              <Area
                animationDuration={650}
                dataKey={account.dataKey}
                fill={account.color}
                fillOpacity={0.68}
                isAnimationActive
                key={account.dataKey}
                name={account.name}
                stackId="assets"
                stroke={account.color}
                type="monotone"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
