import type { HealthAssessment } from "@/types/insights";

interface RetirementHealthProps {
  assessments: HealthAssessment[];
}

const ratingStyles = {
  poor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  fair: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  good: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  excellent:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

const ratingLabels = {
  poor: "Poor",
  fair: "Fair",
  good: "Good",
  excellent: "Excellent",
};

export function RetirementHealth({
  assessments,
}: RetirementHealthProps) {
  return (
    <section
      aria-labelledby="retirement-health-heading"
      className="mt-6"
      id="retirement-health"
    >
      <div className="mb-3">
        <h2
          className="text-lg font-semibold text-slate-950 dark:text-white"
          id="retirement-health-heading"
        >
          Retirement health
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
          These ratings are transparent indicators based on the current
          projection, not guarantees or professional advice.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {assessments.map((assessment) => (
          <article
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            key={assessment.id}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {assessment.title}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${ratingStyles[assessment.rating]}`}
              >
                {ratingLabels[assessment.rating]}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
              {assessment.description}
            </p>
            <details className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
              <summary className="min-h-8 cursor-pointer text-xs font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-300">
                How this is rated
              </summary>
              <p className="mt-2 break-words text-xs leading-5 text-slate-600 dark:text-slate-400">
                {assessment.calculation}
              </p>
              <p className="mt-2 break-words text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                Source: {assessment.dataSource}
              </p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
