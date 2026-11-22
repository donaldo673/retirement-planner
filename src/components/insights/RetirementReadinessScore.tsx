import type { ReadinessAssessment } from "@/types/insights";

interface RetirementReadinessScoreProps {
  readiness: ReadinessAssessment;
}

const ratingLabels = {
  poor: "Needs attention",
  fair: "Fair",
  good: "Good",
  excellent: "Excellent",
};

export function RetirementReadinessScore({
  readiness,
}: RetirementReadinessScoreProps) {
  return (
    <section
      aria-labelledby="readiness-heading"
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <div
          aria-label={`Retirement readiness score: ${readiness.score} out of 100`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={readiness.score}
          className="mx-auto grid size-36 place-items-center rounded-full"
          role="progressbar"
          style={{
            background: `conic-gradient(var(--chart-primary-fill) ${readiness.score}%, var(--chart-grid) ${readiness.score}% 100%)`,
          }}
        >
          <div className="grid size-28 place-content-center rounded-full bg-white text-center dark:bg-slate-900">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white">
              {readiness.score}
              <span className="text-base text-slate-500 dark:text-slate-400">
                {" "}
                / 100
              </span>
            </span>
            <span className="mt-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
              {ratingLabels[readiness.rating]}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
            Planning overview
          </p>
          <h2
            className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
            id="readiness-heading"
          >
            Retirement readiness
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {readiness.explanation}
          </p>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {readiness.dimensions.map((dimension) => (
          <li
            className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"
            key={dimension.id}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {dimension.label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {dimension.score}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <div
                className="h-full rounded-full bg-teal-600 dark:bg-teal-400"
                style={{ width: `${dimension.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              Weight {dimension.weight}%
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
