import type {
  Mortgage,
  MortgageConfiguration,
} from "@/types/retirement";

interface MortgageImpactInsightsProps {
  mortgage: Mortgage;
  configuration: MortgageConfiguration;
  currentAge: number;
  retirementAge: number;
  mortgageFreeAge: number | null;
  estimatedPayoffAge: number | null;
  estimatedPayoffAgeWithOverpayments: number | null;
}

export function MortgageImpactInsights({
  mortgage,
  configuration,
  currentAge,
  retirementAge,
  mortgageFreeAge,
  estimatedPayoffAge,
  estimatedPayoffAgeWithOverpayments,
}: MortgageImpactInsightsProps) {
  const overpaymentsConfigured =
    configuration.monthlyOverpayment > 0 ||
    configuration.annualLumpSumOverpayment > 0;
  const estimatedYearsSaved =
    estimatedPayoffAge !== null &&
    estimatedPayoffAgeWithOverpayments !== null
      ? estimatedPayoffAge - estimatedPayoffAgeWithOverpayments
      : 0;
  const entries: {
    id: string;
    tone: "success" | "information" | "warning";
    message: string;
  }[] = [];

  if (mortgage.outstandingBalance <= 0) {
    entries.push({
      id: "already-paid",
      tone: "success",
      message: "There is no outstanding mortgage balance in this plan.",
    });
  } else if (mortgageFreeAge !== null && mortgageFreeAge <= retirementAge) {
    entries.push({
      id: "paid-before-retirement",
      tone: "success",
      message: `Mortgage repaid before retirement (projected age ${mortgageFreeAge}).`,
    });
  } else if (mortgageFreeAge !== null) {
    entries.push({
      id: "payments-end",
      tone: "information",
      message: `Mortgage costs fall away at age ${mortgageFreeAge} in the existing projection.`,
    });
  } else {
    entries.push({
      id: "not-cleared",
      tone: "warning",
      message:
        "The existing projection does not show the mortgage being cleared within the planning horizon.",
    });
  }

  if (configuration.repaymentType === "interest-only") {
    entries.push({
      id: "interest-only",
      tone: "warning",
      message:
        "Interest-only selected: a true interest-only balance needs a separate repayment plan. This selection does not change the existing projection’s repayment calculation.",
    });
  }

  if (
    configuration.repaymentType === "repayment" &&
    overpaymentsConfigured &&
    estimatedYearsSaved > 0
  ) {
    entries.push({
      id: "overpayment-impact",
      tone: "success",
      message: `Overpayments could reduce the illustrative mortgage term by about ${estimatedYearsSaved} ${estimatedYearsSaved === 1 ? "year" : "years"} (estimated payoff at age ${estimatedPayoffAgeWithOverpayments}, versus age ${estimatedPayoffAge} without them).`,
    });
  }

  return (
    <section
      aria-labelledby="mortgage-impact-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      id="mortgage-impact"
    >
      <div className="mb-3">
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          id="mortgage-impact-heading"
        >
          Retirement Impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Insights based on the existing projection and clearly marked
          illustrative payoff estimates.
        </p>
      </div>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            className={`rounded-xl border px-3 py-2.5 text-xs leading-5 ${
              entry.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                : entry.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            }`}
            key={entry.id}
          >
            <span aria-hidden="true" className="mr-1.5">
              {entry.tone === "success"
                ? "✓"
                : entry.tone === "warning"
                  ? "!"
                  : "i"}
            </span>
            {entry.message}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
        Current age {currentAge}; retirement age {retirementAge}. Advanced
        assumptions do not alter the retirement projection.
      </p>
    </section>
  );
}
