"use client";

import { useMemo } from "react";
import { AssetBreakdownChart } from "@/components/charts/AssetBreakdownChart";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { TaxAnalysisChart } from "@/components/charts/TaxAnalysisChart";
import { transformAssetAllocationData } from "@/lib/charts/transformAssetAllocationData";
import { transformCashflowData } from "@/lib/charts/transformCashflowData";
import { transformNetWorthData } from "@/lib/charts/transformNetWorthData";
import { transformTaxData } from "@/lib/charts/transformTaxData";
import type { ScenarioChartSeries } from "@/types/scenarios";
import type { ProjectionYear, RetirementSummary } from "@/types/retirement";

interface ChartDashboardProps {
  yearlyResults: ProjectionYear[];
  summary: RetirementSummary;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  scenarioSeries?: ScenarioChartSeries[];
  mode: "overview" | "explore";
  exploreTab: "wealth" | "income" | "tax" | "independence" | "risks";
}

export function ChartDashboard({
  yearlyResults,
  summary,
  currentAge,
  retirementAge,
  lifeExpectancy,
  scenarioSeries = [],
  mode,
  exploreTab,
}: ChartDashboardProps) {
  const netWorthData = useMemo(
    () => transformNetWorthData(yearlyResults),
    [yearlyResults],
  );
  const assetAllocationData = useMemo(
    () => transformAssetAllocationData(yearlyResults),
    [yearlyResults],
  );
  const cashflowData = useMemo(
    () => transformCashflowData(yearlyResults, retirementAge),
    [yearlyResults, retirementAge],
  );
  const taxData = useMemo(
    () => transformTaxData(yearlyResults),
    [yearlyResults],
  );
  const showNetWorth =
    mode === "overview" || (mode === "explore" && exploreTab === "wealth");
  const showAssets = mode === "explore" && exploreTab === "wealth";
  const showCashflow = mode === "explore" && exploreTab === "income";
  const showTax = mode === "explore" && exploreTab === "tax";
  const chartHeadingId = `projection-charts-heading-${mode}`;

  if (!showNetWorth && !showAssets && !showCashflow && !showTax) {
    return null;
  }

  return (
    <section
      aria-labelledby={chartHeadingId}
      className="mt-8 scroll-mt-24"
      id={`projection-charts-${mode}`}
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          {mode === "overview" ? "Projection overview" : "Explore your projection"}
        </p>
        <h2
          className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
          id={chartHeadingId}
        >
          {mode === "overview"
            ? "Projected net worth"
            : exploreTab === "wealth"
              ? "Wealth"
              : exploreTab === "income"
                ? "Income and spending"
                : "Tax estimates"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {mode === "overview"
            ? "Projected net worth over time, with key planning ages marked."
            : exploreTab === "wealth"
              ? "Explore projected net worth and how the main asset groups change over time."
              : exploreTab === "income"
                ? "Review projected income, spending, and annual cashflow."
                : "Tax outputs are estimates based on the rules and assumptions implemented in the model."}
        </p>
      </div>
      <div className="grid min-w-0 gap-4">
        {showNetWorth && (
          <NetWorthChart
            currentAge={currentAge}
            data={netWorthData}
            financialIndependenceAge={summary.financialIndependenceAge}
            lifeExpectancy={lifeExpectancy}
            retirementAge={retirementAge}
            scenarioSeries={scenarioSeries}
          />
        )}
        {showAssets && <AssetBreakdownChart data={assetAllocationData} />}
        {showCashflow && <CashflowChart data={cashflowData} />}
        {showTax && <TaxAnalysisChart data={taxData} />}
      </div>
    </section>
  );
}
