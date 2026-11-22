"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatCompactChartCurrency } from "@/lib/charts/formatChartCurrency";
import type { CashflowPoint } from "@/types/charts";

interface CashflowChartProps {
  data: CashflowPoint[];
}

export function CashflowChart({ data }: CashflowChartProps) {
  return (
    <ChartCard
      description="Annual income, tax and spending after your planned retirement age."
      title="Annual Retirement Cashflow"
    >
      {data.length > 0 ? (
        <div className="h-72 min-w-0 sm:h-80">
          <ResponsiveContainer height="100%" minWidth={0} width="100%">
            <BarChart
              accessibilityLayer
              data={data}
              margin={{ top: 12, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeDasharray="3 5"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="age"
                tick={{ fill: "var(--chart-label)", fontSize: 11 }}
                tickLine={false}
                tickCount={7}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "var(--chart-label)", fontSize: 11 }}
                tickFormatter={formatCompactChartCurrency}
                tickLine={false}
                width={64}
              />
              <Tooltip
                content={
                  <ChartTooltip context="Spending includes mortgage payments." />
                }
                cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.35 }}
              />
              <Bar
                animationDuration={550}
                dataKey="income"
                fill="var(--chart-income)"
                isAnimationActive
                name="Income"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                animationDuration={550}
                dataKey="tax"
                fill="var(--chart-tax)"
                isAnimationActive
                name="Tax"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                animationDuration={550}
                dataKey="spending"
                fill="var(--chart-spending)"
                isAnimationActive
                name="Spending"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                animationDuration={550}
                dataKey="netCashflow"
                isAnimationActive
                name="Surplus / deficit"
                radius={[3, 3, 0, 0]}
              >
                {data.map((point) => (
                  <Cell
                    fill={
                      point.netCashflow >= 0
                        ? "var(--chart-surplus)"
                        : "var(--chart-deficit)"
                    }
                    key={point.age}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          No projected years fall at or after the selected retirement age.
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-surplus)" }}
          />
          Surplus
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: "var(--chart-deficit)" }}
          />
          Deficit
        </span>
      </div>
    </ChartCard>
  );
}
