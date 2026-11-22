"use client";

import { useMemo, useState } from "react";
import { AgeSelector } from "@/components/financial-statements/AgeSelector";
import { AccountMovements } from "@/components/financial-statements/AccountMovements";
import { BalanceSheet } from "@/components/financial-statements/BalanceSheet";
import { CashflowWaterfall } from "@/components/financial-statements/CashflowWaterfall";
import { NetWorthReconciliation } from "@/components/financial-statements/NetWorthReconciliation";
import { PensionAnalysis } from "@/components/financial-statements/PensionAnalysis";
import { ProfitLossStatement } from "@/components/financial-statements/ProfitLossStatement";
import { StatementViewToggle } from "@/components/financial-statements/StatementViewToggle";
import { buildAnnualStatement } from "@/lib/financial-statements/buildAnnualStatement";
import type {
  ProjectionResult,
  RetirementPlan,
} from "@/types/retirement";
import type { StatementView } from "@/types/financialStatements";

interface FinancialStatementsPageProps {
  plan: RetirementPlan | null;
  projection: ProjectionResult | null;
}

export function FinancialStatementsPage({
  plan,
  projection,
}: FinancialStatementsPageProps) {
  const [selectedAgeState, setSelectedAge] = useState<number | null>(null);
  const [view, setView] = useState<StatementView>("combined");
  const ages = useMemo(
    () => projection?.yearlyResults.map((year) => year.age) ?? [],
    [projection],
  );
  const currentAge = ages[0] ?? 0;
  const selectedAge =
    selectedAgeState !== null && ages.includes(selectedAgeState)
      ? selectedAgeState
      : currentAge;
  const statement = useMemo(
    () =>
      projection && plan && ages.length > 0
        ? buildAnnualStatement(projection, plan, selectedAge)
        : null,
    [ages.length, plan, projection, selectedAge],
  );

  function printStatements() {
    window.print();
  }

  return (
    <section
      aria-labelledby="financial-statements-heading"
      className="mb-8 mt-10 min-w-0 scroll-mt-24"
      id="financial-statements"
    >
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
            Annual model detail
          </p>
          <h2
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
            id="financial-statements-heading"
          >
            Financial Statements
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Review the existing retirement projection year by year. Items the
            model does not calculate separately are labeled, not estimated.
          </p>
        </div>
        <button
          className="print:hidden min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-teal-300"
          onClick={printStatements}
          type="button"
        >
          Print / Save as PDF
        </button>
      </header>

      {statement ? (
        <div className="space-y-4">
          <div className="print:hidden flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between dark:border-slate-800 dark:bg-slate-900">
            <AgeSelector
              ages={ages}
              currentAge={currentAge}
              onChange={setSelectedAge}
              selectedAge={selectedAge}
            />
            <StatementViewToggle onChange={setView} view={view} />
          </div>

          <div className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            {statement.isBaselineSnapshot
              ? `Opening snapshot at age ${statement.age}`
              : `Year starting age ${statement.periodStartAge}, ending age ${statement.age}`}{" "}
            · Tax year {statement.taxYear}
          </div>

          {(view === "profit-loss" || view === "combined") && (
            <ProfitLossStatement statement={statement.profitLoss} />
          )}

          {(view === "balance-sheet" || view === "combined") && (
            <div className="space-y-4">
              <BalanceSheet balanceSheet={statement.balanceSheet} />
              <NetWorthReconciliation
                reconciliation={statement.reconciliation}
              />
              <AccountMovements movements={statement.accountMovements} />
              <PensionAnalysis analysis={statement.pensionAnalysis} />
            </div>
          )}

          {(view === "profit-loss" || view === "combined") && (
            <CashflowWaterfall waterfall={statement.cashflowWaterfall} />
          )}
        </div>
      ) : (
        <p
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          Complete the highlighted plan fields to generate financial
          statements.
        </p>
      )}
    </section>
  );
}
