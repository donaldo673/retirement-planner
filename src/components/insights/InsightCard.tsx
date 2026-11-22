import type { PlanningInsight } from "@/types/insights";
import { InsightIcon } from "@/components/insights/InsightIcon";

interface InsightCardProps {
  insight: PlanningInsight;
}

const categoryStyles = {
  success:
    "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/70 dark:bg-emerald-950/20",
  opportunity:
    "border-blue-200 bg-blue-50/50 dark:border-blue-900/70 dark:bg-blue-950/20",
  warning:
    "border-amber-200 bg-amber-50/50 dark:border-amber-900/70 dark:bg-amber-950/20",
  information:
    "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30",
};

export function InsightCard({ insight }: InsightCardProps) {
  const priority = Math.max(1, Math.min(10, Math.round(insight.priority)));

  return (
    <article
      aria-labelledby={`insight-${insight.id}`}
      className={`min-w-0 rounded-2xl border p-4 ${categoryStyles[insight.category]}`}
    >
      <div className="flex items-start gap-3">
        <InsightIcon category={insight.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4
              className="text-sm font-semibold leading-5 text-slate-950 dark:text-white"
              id={`insight-${insight.id}`}
            >
              {insight.title}
            </h4>
            <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
              Priority {priority}/10
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {insight.description}
          </p>

          {insight.suggestedAction && (
            <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <span className="font-semibold">Consider: </span>
              {insight.suggestedAction}
            </p>
          )}

          <details className="group mt-3 border-t border-slate-200/80 pt-2 dark:border-slate-700/80">
            <summary className="min-h-8 cursor-pointer list-none text-xs font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-details-marker]:hidden dark:text-slate-300 dark:hover:text-white">
              <span className="inline-flex items-center gap-2">
                Why am I seeing this?
                <span
                  aria-hidden="true"
                  className="size-1.5 rotate-45 border-b border-r border-current transition-transform group-open:-rotate-[135deg]"
                />
              </span>
            </summary>
            <dl className="mt-2 space-y-2 break-words text-xs leading-5 text-slate-600 dark:text-slate-400">
              <div>
                <dt className="font-semibold text-slate-700 dark:text-slate-300">
                  Calculation
                </dt>
                <dd>{insight.explanation.calculation}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700 dark:text-slate-300">
                  Data source
                </dt>
                <dd>{insight.explanation.dataSource}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-700 dark:text-slate-300">
                  What it means
                </dt>
                <dd>{insight.explanation.interpretation}</dd>
              </div>
            </dl>
          </details>

          <div className="mt-2" role="progressbar"
            aria-label={`Priority ${priority} out of 10`}
            aria-valuemax={10}
            aria-valuemin={1}
            aria-valuenow={priority}
          >
            <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-slate-500 dark:bg-slate-300"
                style={{ width: `${priority * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
