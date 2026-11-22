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
}

export function ChartDashboard({
  yearlyResults,
  summary,
  currentAge,
  retirementAge,
  lifeExpectancy,
  scenarioSeries = [],
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

  return (
    <section
      aria-labelledby="projection-charts-heading"
      className="mt-8 scroll-mt-24"
      id="projection-charts"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          Explore your projection
        </p>
        <h2
          className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
          id="projection-charts-heading"
        >
          Your plan, visualised
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          See how your projected wealth, account balances, retirement cashflow
          and taxes may change over time.
        </p>
      </div>
      <div className="grid min-w-0 gap-4">
        <NetWorthChart
          currentAge={currentAge}
          data={netWorthData}
          financialIndependenceAge={summary.financialIndependenceAge}
          lifeExpectancy={lifeExpectancy}
          retirementAge={retirementAge}
          scenarioSeries={scenarioSeries}
        />
        <AssetBreakdownChart data={assetAllocationData} />
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <CashflowChart data={cashflowData} />
          <TaxAnalysisChart data={taxData} />
        </div>
      </div>
    </section>
  );
}
