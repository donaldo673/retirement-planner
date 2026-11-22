import type { PlanningRisk, RiskLevel } from "@/types/insights";

interface RiskMonitorProps {
  risks: PlanningRisk[];
}

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  "not-assessed":
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "not-assessed": "Not assessed",
};

export function RiskMonitor({ risks }: RiskMonitorProps) {
  return (
    <section
      aria-labelledby="risk-review-heading"
      className="mt-8"
      id="risk-review"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
          Planning considerations
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
          id="risk-review-heading"
        >
          Risk review
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
          Ratings are simple indicators based on available data. “Not assessed”
          means the projection does not contain enough information to rate it.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {risks.map((risk) => (
          <article
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            key={risk.id}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {risk.title}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${riskStyles[risk.level]}`}
              >
                {riskLabels[risk.level]}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
              {risk.description}
            </p>
            <details className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
              <summary className="min-h-8 cursor-pointer text-xs font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-300">
                Why this rating?
              </summary>
              <p className="mt-2 break-words text-xs leading-5 text-slate-600 dark:text-slate-400">
                {risk.explanation}
              </p>
              <p className="mt-2 break-words text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                Source: {risk.dataSource}
              </p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
