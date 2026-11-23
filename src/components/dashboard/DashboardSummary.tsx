import type { ProjectionYear, RetirementSummary } from "@/types/retirement";

interface DashboardSummaryProps {
  summary: RetirementSummary;
  retirementAge: number;
  lifeExpectancy: number;
  retirementYear?: ProjectionYear;
  lifeExpectancyYear?: ProjectionYear;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function DashboardSummary({
  summary,
  retirementAge,
  lifeExpectancy,
  retirementYear,
  lifeExpectancyYear,
}: DashboardSummaryProps) {
  const finalNetWorth =
    lifeExpectancyYear?.netWorth ?? summary.finalEstateValue;
  const metrics = [
    {
      label: "Projected net worth at retirement",
      value: formatCurrency(summary.retirementNetWorth),
      context: `At age ${retirementAge}, under current assumptions`,
    },
    {
      label: "Projected annual retirement income",
      value: retirementYear
        ? formatCurrency(retirementYear.totalIncome)
        : "Not available",
      context: retirementYear
        ? `Before tax at age ${retirementAge} · planned spending ${formatCurrency(retirementYear.spending)} · mortgage payment ${formatCurrency(retirementYear.mortgagePayment)}`
        : `Modelled total income before tax at age ${retirementAge}`,
    },
    {
      label: "First projected funding shortfall",
      value:
        summary.ageAssetsRunOut === null
          ? "No shortfall within projection period"
          : `Age ${summary.ageAssetsRunOut}`,
      context:
        summary.ageAssetsRunOut === null
          ? "No shortfall is shown in this projection"
          : "First year planned expenditure exceeds available funds",
    },
    {
      label: "Projected net worth at life expectancy",
      value: formatCurrency(finalNetWorth),
      context: `At selected age ${lifeExpectancy}`,
    },
  ];

  return (
    <div className="space-y-5">
      <p className="rounded-xl border-l-4 border-teal-700 bg-white px-4 py-3 text-sm leading-6 text-slate-700 dark:border-teal-400 dark:bg-slate-900 dark:text-slate-200">
        {summary.ageAssetsRunOut === null
          ? `Based on your current assumptions, projected assets cover planned expenditure through age ${lifeExpectancy}. This is an illustration, not a guarantee of future outcomes.`
          : `Based on your current assumptions, a funding shortfall is first projected at age ${summary.ageAssetsRunOut}. Actual outcomes may differ.`}
      </p>
      {summary.ageAssetsRunOut !== null &&
        finalNetWorth > 0 && (
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            A positive net worth can coexist with a projected funding shortfall:
            amounts recorded as Other Assets are included in net worth but are
            not used in modeled withdrawals. See Detailed Finances for the
            asset breakdown.
          </p>
        )}
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            className="min-w-0 border-b border-slate-200 pb-4 dark:border-slate-800"
            key={metric.label}
          >
            <dt className="text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
              {metric.label}
            </dt>
            <dd className="mt-1 break-words text-xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white">
              {metric.value}
            </dd>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {metric.context}
            </p>
          </div>
        ))}
      </dl>
    </div>
  );
}
