"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import {
  formatChartCurrency,
  formatCompactChartCurrency,
} from "@/lib/charts/formatChartCurrency";
import type { ChartRange, ProjectionPoint } from "@/types/charts";

interface NetWorthChartProps {
  data: ProjectionPoint[];
  currentAge: number;
  retirementAge: number;
  financialIndependenceAge: number | null;
  lifeExpectancy: number;
}

const rangeOptions: { value: ChartRange; label: string }[] = [
  { value: "1", label: "1Y" },
  { value: "5", label: "5Y" },
  { value: "10", label: "10Y" },
  { value: "all", label: "All" },
];

export function NetWorthChart({
  data,
  currentAge,
  retirementAge,
  financialIndependenceAge,
  lifeExpectancy,
}: NetWorthChartProps) {
  const [range, setRange] = useState<ChartRange>("all");
  const visibleData = useMemo(() => {
    if (range === "all" || data.length === 0) {
      return data;
    }

    const finalAge = data[0].age + Number(range);
    return data.filter((point) => point.age <= finalAge);
  }, [data, range]);
  const minAge = visibleData[0]?.age ?? currentAge;
  const maxAge = visibleData.at(-1)?.age ?? currentAge;
  const canShowMarker = (age: number) => age >= minAge && age <= maxAge;

  return (
    <ChartCard
      className="h-full"
      controls={
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            aria-label="Projection range"
            className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
            role="group"
          >
            {rangeOptions.map((option) => (
              <button
                aria-pressed={range === option.value}
                className={`min-h-8 rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                  range === option.value
                    ? "bg-slate-900 text-white dark:bg-teal-400 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                key={option.value}
                onClick={() => setRange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <div
            aria-label="Value display"
            className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
            role="group"
          >
            <button
              aria-pressed="true"
              className="min-h-8 rounded-md bg-slate-900 px-2.5 text-xs font-medium text-white dark:bg-teal-400 dark:text-slate-950"
              type="button"
            >
              Nominal
            </button>
            <button
              className="min-h-8 cursor-not-allowed rounded-md px-2.5 text-xs font-medium text-slate-400 dark:text-slate-500"
              disabled
              title="Inflation-adjusted values are not available yet."
              type="button"
            >
              Inflation adjusted
            </button>
          </div>
        </div>
      }
      description="Projected net worth in future pounds, with key planning ages marked."
      title="Projected Net Worth"
    >
      <div className="h-72 min-w-0 sm:h-80">
        <ResponsiveContainer height="100%" minWidth={0} width="100%">
          <LineChart
            accessibilityLayer
            data={visibleData}
            margin={{ top: 12, right: 12, left: 8, bottom: 4 }}
          >
            <defs>
              <linearGradient id="net-worth-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--chart-primary-fill)"
                  stopOpacity={0.28}
                />
                <stop
                  offset="100%"
                  stopColor="var(--chart-primary-fill)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="age"
              domain={["dataMin", "dataMax"]}
              allowDecimals={false}
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
            <Area
              activeDot={false}
              animationDuration={650}
              dataKey="netWorth"
              fill="url(#net-worth-gradient)"
              isAnimationActive
              legendType="none"
              name="Net worth"
              stroke="none"
              type="monotone"
            />
            <Line
              animationDuration={650}
              dataKey="netWorth"
              dot={false}
              isAnimationActive
              legendType="line"
              name="Net worth"
              stroke="var(--chart-primary-line)"
              strokeWidth={2.5}
              type="monotone"
            />
            {canShowMarker(currentAge) && (
              <ReferenceLine
                label={{
                  fill: "var(--chart-label)",
                  fontSize: 10,
                  position: "insideTopLeft",
                  value: "Today",
                }}
                stroke="#64748b"
                strokeDasharray="3 4"
                x={currentAge}
              />
            )}
            {financialIndependenceAge !== null &&
              canShowMarker(financialIndependenceAge) && (
                <ReferenceLine
                  label={{
                    fill: "var(--chart-primary-line)",
                    fontSize: 10,
                    position: "insideTopRight",
                    value: "FI",
                  }}
                  stroke="var(--chart-primary-fill)"
                  strokeDasharray="5 4"
                  x={financialIndependenceAge}
                />
              )}
            {canShowMarker(retirementAge) && (
              <ReferenceLine
                label={{
                  fill: "#d97706",
                  fontSize: 10,
                  position: "insideTopRight",
                  value: "Retirement",
                }}
                stroke="#f59e0b"
                strokeDasharray="5 4"
                x={retirementAge}
              />
            )}
            {canShowMarker(lifeExpectancy) && (
              <ReferenceLine
                label={{
                  fill: "var(--chart-label)",
                  fontSize: 10,
                  position: "insideTopRight",
                  value: "Life expectancy",
                }}
                stroke="#94a3b8"
                strokeDasharray="2 4"
                x={lifeExpectancy}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Net worth values range from {formatChartCurrency(
          Math.min(...visibleData.map((point) => point.netWorth), 0),
        )}{" "}
        to{" "}
        {formatChartCurrency(
          Math.max(...visibleData.map((point) => point.netWorth), 0),
        )}
        . Vertical markers show today, financial independence when reached,
        retirement, and life expectancy when they are within the selected range.
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Inflation-adjusted values are not available yet.
      </p>
    </ChartCard>
  );
}
