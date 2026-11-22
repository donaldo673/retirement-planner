"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { formatChartCurrency } from "@/lib/charts/formatChartCurrency";
import type { TaxAnalysisData } from "@/types/charts";

interface TaxAnalysisChartProps {
  data: TaxAnalysisData;
}

export function TaxAnalysisChart({ data }: TaxAnalysisChartProps) {
  const nonZeroCategories = data.categories.filter(
    (category) => category.amount > 0,
  );

  return (
    <ChartCard
      description="Projected tax paid across the years included in your plan."
      title="Lifetime Tax Analysis"
    >
      {nonZeroCategories.length > 0 ? (
        <>
          <div className="relative h-64 min-w-0">
            <ResponsiveContainer height="100%" minWidth={0} width="100%">
              <PieChart accessibilityLayer>
                <Pie
                  animationDuration={650}
                  data={nonZeroCategories}
                  dataKey="amount"
                  innerRadius="62%"
                  isAnimationActive
                  nameKey="name"
                  outerRadius="84%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {nonZeroCategories.map((category) => (
                    <Cell fill={category.color} key={category.name} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip labelPrefix="" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Total tax
              </span>
              <span className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white">
                {formatChartCurrency(data.totalTax)}
              </span>
            </div>
          </div>
          <ul aria-label="Lifetime tax breakdown" className="mt-2 space-y-2">
            {nonZeroCategories.map((category) => {
              const share =
                data.totalTax > 0 ? (category.amount / data.totalTax) * 100 : 0;
              return (
                <li
                  className="flex items-center justify-between gap-3 text-xs"
                  key={category.name}
                >
                  <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </span>
                  <span className="shrink-0 text-right font-medium tabular-nums text-slate-800 dark:text-slate-100">
                    {formatChartCurrency(category.amount)}{" "}
                    <span className="text-slate-500 dark:text-slate-400">
                      ({share.toFixed(1)}%)
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          No tax is projected over the years included in this plan.
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Dividend tax is included in income tax by the projection model. It does
        not provide a separate dividend-tax or other-tax total.
      </p>
    </ChartCard>
  );
}
