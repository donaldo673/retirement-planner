import type { PlanningMetric } from "@/types/insights";

interface PlanningMetricsProps {
  metrics: PlanningMetric[];
}

export function PlanningMetrics({ metrics }: PlanningMetricsProps) {
  return (
    <section
      aria-labelledby="planning-metrics-heading"
      className="mt-6"
      id="planning-metrics"
    >
      <div className="mb-3">
        <h2
          className="text-lg font-semibold text-slate-950 dark:text-white"
          id="planning-metrics-heading"
        >
          Key planning metrics
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Additional measures derived from your existing projection.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <article
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            key={metric.id}
          >
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {metric.label}
            </h3>
            <p className="mt-2 break-words text-xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white">
              {metric.value}
            </p>
            <details className="mt-2">
              <summary className="min-h-8 cursor-pointer text-xs font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-300">
                How it is calculated
              </summary>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {metric.explanation}
              </p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
