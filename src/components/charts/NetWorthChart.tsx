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
import type { ScenarioChartSeries } from "@/types/scenarios";

interface NetWorthChartProps {
  data: ProjectionPoint[];
  currentAge: number;
  retirementAge: number;
  financialIndependenceAge: number | null;
  lifeExpectancy: number;
  scenarioSeries?: ScenarioChartSeries[];
}

interface NetWorthChartPoint {
  age: number;
  netWorth?: number;
  [key: string]: number | undefined;
}

function getScenarioDataKey(index: number): string {
  return `scenario_${index}`;
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
  scenarioSeries = [],
}: NetWorthChartProps) {
  const [range, setRange] = useState<ChartRange>("all");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<
    string[] | null
  >(null);
  const visibleScenarioIds =
    selectedScenarioIds ?? scenarioSeries.slice(0, 2).map(({ id }) => id);
  const chartData = useMemo(() => {
    const pointsByAge = new Map<number, NetWorthChartPoint>();
    const addPoint = (age: number, dataKey: string, value: number) => {
      const point = pointsByAge.get(age) ?? { age };
      point[dataKey] = value;
      pointsByAge.set(age, point);
    };

    data.forEach((point) => addPoint(point.age, "netWorth", point.netWorth));
    scenarioSeries.forEach((scenario, index) => {
      scenario.data.forEach((point) =>
        addPoint(point.age, getScenarioDataKey(index), point.netWorth),
      );
    });

    return [...pointsByAge.values()].sort((first, second) => first.age - second.age);
  }, [data, scenarioSeries]);
  const visibleData = useMemo(() => {
    if (range === "all" || chartData.length === 0) {
      return chartData;
    }

    const finalAge = currentAge + Number(range);
    return chartData.filter(
      (point) => point.age >= currentAge && point.age <= finalAge,
    );
  }, [chartData, currentAge, range]);
  const minAge = visibleData[0]?.age ?? currentAge;
  const maxAge = visibleData.at(-1)?.age ?? currentAge;
  const visibleNetWorthValues = visibleData
    .map((point) => point.netWorth)
    .filter((value): value is number => value !== undefined);
  const canShowMarker = (age: number) => age >= minAge && age <= maxAge;
  const selectedSeries = scenarioSeries
    .map((scenario, index) => ({
      ...scenario,
      dataKey: getScenarioDataKey(index),
    }))
    .filter((scenario) => visibleScenarioIds.includes(scenario.id));

  return (
    <ChartCard
      className="h-full"
      controls={
        <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end">
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
          {scenarioSeries.length > 0 && (
            <fieldset className="basis-full rounded-lg border border-slate-200 px-2 py-1.5 dark:border-slate-700">
              <legend className="px-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Compare scenarios
              </legend>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {scenarioSeries.map((scenario) => (
                  <label
                    className="flex min-h-7 max-w-full items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200"
                    key={scenario.id}
                  >
                    <input
                      checked={visibleScenarioIds.includes(scenario.id)}
                      onChange={(event) =>
                        setSelectedScenarioIds((current) => {
                          const selected =
                            current ??
                            scenarioSeries.slice(0, 2).map(({ id }) => id);
                          return event.target.checked
                            ? [...selected, scenario.id]
                            : selected.filter((id) => id !== scenario.id);
                        })
                      }
                      type="checkbox"
                    />
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <span className="max-w-40 truncate">{scenario.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
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
              name="Current Plan"
              stroke="none"
              type="monotone"
            />
            <Line
              animationDuration={650}
              dataKey="netWorth"
              dot={false}
              isAnimationActive
              legendType="line"
              name="Current Plan"
              stroke="var(--chart-primary-line)"
              strokeWidth={2.5}
              type="monotone"
            />
            {selectedSeries.map((scenario) => (
              <Line
                animationDuration={650}
                connectNulls={false}
                dataKey={scenario.dataKey}
                dot={false}
                isAnimationActive
                key={scenario.id}
                name={scenario.name}
                stroke={scenario.color}
                strokeWidth={2}
                type="monotone"
              />
            ))}
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
          Math.min(...visibleNetWorthValues, 0),
        )}{" "}
        to{" "}
        {formatChartCurrency(
          Math.max(...visibleNetWorthValues, 0),
        )}
        . Vertical markers show today, financial independence when reached,
        retirement, and life expectancy when they are within the selected range.
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Horizontal axis: age · Vertical axis: projected net worth in GBP
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Inflation-adjusted values are not available yet.
      </p>
    </ChartCard>
  );
}
