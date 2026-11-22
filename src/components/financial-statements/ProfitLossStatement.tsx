import type { ProfitLossStatement as ProfitLossStatementModel } from "@/types/financialStatements";
import { TaxBreakdownCard } from "./TaxBreakdownCard";
import {
  StatementLines,
  StatementPanel,
} from "./StatementPrimitives";

export function ProfitLossStatement({
  statement,
}: {
  statement: ProfitLossStatementModel;
}) {
  return (
    <div className="space-y-4">
      {statement.isBaselineSnapshot && (
        <p
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
          role="note"
        >
          Age {statement.age} is the opening snapshot. No annual activity has
          elapsed yet, so the statement shows zero income, tax, and spending
          for this baseline.
        </p>
      )}

      <StatementPanel
        description={`Annual household income for the year starting at age ${statement.periodStartAge}.`}
        title="Income"
      >
        <StatementLines
          lines={[
            { label: "Employment income", amount: statement.income.employmentIncome },
            {
              label: "Second employment income",
              amount: statement.income.secondEmploymentIncome,
            },
            { label: "Rental income", amount: statement.income.rentalIncome },
            {
              label: "State Pension",
              amount: statement.income.statePensionIncome,
            },
            {
              label: "Private pension drawdown",
              amount: statement.income.pensionDrawdown,
              note: "Treated as taxable pension income by the existing model.",
            },
            {
              label: "Interest income / (expense)",
              amount: statement.income.interestIncome,
            },
            { label: "Dividend income", amount: statement.income.dividendIncome },
            {
              label: "Other taxable income",
              amount: statement.income.otherTaxableIncome,
            },
            {
              label: "Gross income",
              amount: statement.income.grossIncome,
              emphasis: "subtotal",
            },
            {
              label: "Taxable income total",
              amount: statement.income.taxableIncomeTotal,
              emphasis: "total",
            },
          ]}
        />
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Not separately modeled: {statement.income.unsupportedSources.join(", ")}.
          Include any relevant amounts in an available income input if
          appropriate for your plan.
        </p>
      </StatementPanel>

      <StatementPanel
        description="Capital withdrawals are shown separately from taxable income."
        title="Tax-Free Income & Withdrawals"
      >
        <StatementLines
          lines={[
            { label: "Cash savings withdrawals", amount: statement.taxFreeWithdrawals.cash },
            { label: "ISA withdrawals", amount: statement.taxFreeWithdrawals.isa },
            {
              label: "Total tax-free withdrawals",
              amount: statement.taxFreeWithdrawals.total,
              emphasis: "total",
            },
            {
              label: "GIA disposal proceeds",
              amount: statement.taxFreeWithdrawals.giaDisposalProceeds,
              note: "Disposal proceeds are not income; realized gains are reported separately for tax.",
            },
          ]}
        />
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Not separately modeled:{" "}
          {statement.taxFreeWithdrawals.unsupportedSources.join(", ")}.
        </p>
      </StatementPanel>

      <TaxBreakdownCard tax={statement.tax} />

      <StatementPanel title="Spending">
        <StatementLines
          lines={[
            {
              label: "Planned spending (aggregate)",
              amount: statement.spending.plannedSpending,
            },
            {
              label: "Mortgage payments",
              amount: statement.spending.mortgagePayments,
            },
            {
              label: "Total spending",
              amount: statement.spending.totalSpending,
              emphasis: "total",
            },
          ]}
        />
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          The projection does not expose a breakdown into essential,
          discretionary, travel, healthcare, or other spending categories.
        </p>
      </StatementPanel>

      <StatementPanel
        description="Net surplus or deficit is taken directly from the selected projection year."
        title="Net Surplus / (Deficit)"
      >
        <StatementLines
          lines={[
            { label: "Gross income", amount: statement.grossIncome },
            { label: "Less: total tax", amount: -statement.tax.totalTax },
            {
              label: "Less: planned spending and mortgage",
              amount: -statement.spending.totalSpending,
            },
            {
              label: "Net surplus / (deficit)",
              amount: statement.netSurplusDeficit,
              emphasis: "total",
            },
          ]}
        />
        {statement.unfundedShortfall > 0 && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            The model reports an unfunded shortfall of{" "}
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
              maximumFractionDigits: 0,
            }).format(statement.unfundedShortfall)}{" "}
            for this year.
          </p>
        )}
      </StatementPanel>
    </div>
  );
}
