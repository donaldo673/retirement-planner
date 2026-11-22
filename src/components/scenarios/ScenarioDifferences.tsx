import type { Scenario } from "@/types/scenarios";

interface ScenarioDifferencesProps {
  baseline: Scenario;
  selected: Scenario | null;
}

type DifferenceValue = number | null;

interface DifferenceRow {
  id: string;
  label: string;
  before: DifferenceValue;
  after: DifferenceValue;
  format: (value: number) => string;
  unit?: string;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatDifference(value: number, format: (value: number) => string) {
  if (value === 0) {
    return "No change";
  }
  return `${value > 0 ? "+" : "−"}${format(Math.abs(value))}`;
}

function getPercentChange(before: number, after: number): string {
  if (before === 0) {
    return "Percentage change unavailable (baseline is zero)";
  }
  const percentage = ((after - before) / Math.abs(before)) * 100;
  return `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`;
}

export function ScenarioDifferences({
  baseline,
  selected,
}: ScenarioDifferencesProps) {
  if (!selected || selected.id === baseline.id) {
    return (
      <section
        aria-labelledby="scenario-differences-heading"
        className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <h3
          className="text-sm font-semibold text-slate-950 dark:text-white"
          id="scenario-differences-heading"
        >
          What changed?
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Select a saved scenario tab to see how it differs from Current Plan.
        </p>
      </section>
    );
  }

  const baselineSummary = baseline.results.projection.summary;
  const selectedSummary = selected.results.projection.summary;
  const baselineAge = baseline.inputs.plan.people.person1.income.currentAge;
  const selectedAge = selected.inputs.plan.people.person1.income.currentAge;
  const baselineFIAge = baselineSummary.financialIndependenceAge;
  const selectedFIAge = selectedSummary.financialIndependenceAge;
  const rows: DifferenceRow[] = [
    {
      id: "retirement-age",
      label: "Retirement age",
      before: baseline.inputs.plan.personalDetails.retirementAge,
      after: selected.inputs.plan.personalDetails.retirementAge,
      format: (value) => `${value} years`,
    },
    {
      id: "fi-age",
      label: "Financial independence age",
      before: baselineFIAge,
      after: selectedFIAge,
      format: (value) => `Age ${value}`,
    },
    {
      id: "years-to-fi",
      label: "Years to FI",
      before:
        baselineFIAge === null ? null : Math.max(0, baselineFIAge - baselineAge),
      after:
        selectedFIAge === null ? null : Math.max(0, selectedFIAge - selectedAge),
      format: (value) => `${value} years`,
    },
    {
      id: "estate",
      label: "Final estate",
      before: baselineSummary.finalEstateValue,
      after: selectedSummary.finalEstateValue,
      format: (value) => currencyFormatter.format(value),
    },
    {
      id: "retirement-net-worth",
      label: "Net worth at retirement",
      before: baselineSummary.retirementNetWorth,
      after: selectedSummary.retirementNetWorth,
      format: (value) => currencyFormatter.format(value),
    },
    {
      id: "lifetime-tax",
      label: "Lifetime tax",
      before: baseline.results.lifetimeTax,
      after: selected.results.lifetimeTax,
      format: (value) => currencyFormatter.format(value),
    },
    {
      id: "years-funded",
      label: "Retirement years funded",
      before: baseline.results.yearsFunded,
      after: selected.results.yearsFunded,
      format: (value) => `${value} years`,
    },
  ];

  return (
    <section
      aria-labelledby="scenario-differences-heading"
      className="mt-5"
      id="scenario-differences"
    >
      <div className="mb-3">
        <h3
          className="text-sm font-semibold text-slate-950 dark:text-white"
          id="scenario-differences-heading"
        >
          What changed: {selected.name} vs {baseline.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Changes are shown as selected scenario minus Current Plan. Percentage
          differences use Current Plan as the baseline.
        </p>
      </div>
      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const beforeText =
            row.before === null ? "Not reached" : row.format(row.before);
          const afterText =
            row.after === null ? "Not reached" : row.format(row.after);
          const difference =
            row.before === null || row.after === null
              ? null
              : row.after - row.before;
          const percentage =
            row.before === null || row.after === null
              ? "Not comparable"
              : getPercentChange(row.before, row.after);

          return (
            <div
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              key={row.id}
            >
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {row.label}
              </dt>
              <dd className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
                <span className="min-w-0 break-words font-medium text-slate-700 dark:text-slate-300">
                  {beforeText}
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  →
                </span>
                <span className="min-w-0 break-words text-right font-semibold text-slate-900 dark:text-slate-100">
                  {afterText}
                </span>
              </dd>
              <p className="mt-2 break-words text-xs font-semibold text-teal-800 dark:text-teal-300">
                Absolute change:{" "}
                {difference === null
                  ? "Not comparable"
                  : formatDifference(difference, row.format)}
              </p>
              <p className="mt-1 break-words text-[11px] text-slate-500 dark:text-slate-400">
                Relative change: {percentage}
              </p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
