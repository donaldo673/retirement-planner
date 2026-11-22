import type {
  ProjectionStatus,
  ProjectionYear,
  RetirementSummary,
} from "@/types/retirement";
import { FIProgress } from "./FIProgress";
import { KPICard, type KPITone } from "./KPICard";
import { RetirementStatus } from "./RetirementStatus";

interface DashboardSummaryProps {
  summary: RetirementSummary;
  currentAge: number;
  retirementAge: number;
  firstProjectionYear: ProjectionYear;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function statusTone(status: ProjectionStatus): KPITone {
  if (status === "red") {
    return "red";
  }
  if (status === "amber") {
    return "amber";
  }
  return "green";
}

export function DashboardSummary({
  summary,
  currentAge,
  retirementAge,
  firstProjectionYear,
}: DashboardSummaryProps) {
  const outcomeTone = statusTone(summary.status);
  const yearsToFI =
    summary.financialIndependenceAge === null
      ? null
      : summary.financialIndependenceAge - currentAge;
  const isFIReached = yearsToFI !== null && yearsToFI <= 0;

  return (
    <div className="space-y-4">
      <RetirementStatus status={summary.status} />

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          icon="wallet"
          label="Current net worth"
          statusLabel="Today"
          supportingText="After your mortgage and other liabilities"
          tone="teal"
          value={formatCurrency(summary.currentNetWorth)}
        />
        <KPICard
          icon="chart"
          label="Retirement pot at retirement"
          statusLabel={summary.status === "green" ? "On track" : "Review"}
          supportingText={`Projected at age ${retirementAge}`}
          tone={outcomeTone}
          value={formatCurrency(summary.retirementNetWorth)}
        />
        <KPICard
          icon="target"
          label="Financial independence age"
          statusLabel={
            isFIReached ? "Reached" : summary.financialIndependenceAge === null ? "Not reached" : "Projected"
          }
          supportingText={
            summary.financialIndependenceAge === null
              ? "Not reached within this projection"
              : isFIReached
                ? "Your projected FI milestone has been reached"
                : `${yearsToFI} ${yearsToFI === 1 ? "year" : "years"} from your current age`
          }
          tone={
            summary.financialIndependenceAge === null
              ? "amber"
              : isFIReached
                ? "green"
                : "teal"
          }
          value={
            summary.financialIndependenceAge === null
              ? "Not reached"
              : `Age ${summary.financialIndependenceAge}`
          }
        />
        <KPICard
          icon="calendar"
          label="Retirement age"
          statusLabel="Your target"
          supportingText="The age your retirement plan begins"
          tone="slate"
          value={`Age ${retirementAge}`}
        />
        <KPICard
          icon="home"
          label="Final estate"
          statusLabel={
            summary.status === "green"
              ? "On track"
              : summary.status === "amber"
                ? "Worth reviewing"
                : "At risk"
          }
          supportingText="Projected at the end of your planning horizon"
          tone={outcomeTone}
          value={formatCurrency(summary.finalEstateValue)}
        />
        <KPICard
          icon="alert"
          label="Assets depleted age"
          statusLabel={summary.ageAssetsRunOut === null ? "Not projected" : "At risk"}
          supportingText={
            summary.ageAssetsRunOut === null
              ? "No spending shortfall is projected"
              : "A shortfall is projected from this age"
          }
          tone={summary.ageAssetsRunOut === null ? "green" : "red"}
          value={
            summary.ageAssetsRunOut === null
              ? "Not projected"
              : `Age ${summary.ageAssetsRunOut}`
          }
        />
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-2 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total projected retirement spending
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(summary.totalRetirementSpending)}
          </p>
        </div>
        <div className="sm:border-l sm:border-slate-200 sm:pl-5 dark:sm:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Estimated tax ({firstProjectionYear.taxYear}/
            {String(firstProjectionYear.taxYear + 1).slice(-2)})
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(firstProjectionYear.tax.totalTax)}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Income tax {formatCurrency(firstProjectionYear.tax.incomeTax)} · NI{" "}
            {formatCurrency(firstProjectionYear.tax.nationalInsurance)} · CGT{" "}
            {formatCurrency(firstProjectionYear.tax.capitalGainsTax)}
          </p>
        </div>
      </div>

      <FIProgress
        currentAge={currentAge}
        financialIndependenceAge={summary.financialIndependenceAge}
        retirementAge={retirementAge}
      />
      <p className="px-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Tax estimates include generated GIA interest, dividends, realized gains,
        and taxable pension withdrawals. Estimates do not include fees or
        investment volatility.
      </p>
    </div>
  );
}
