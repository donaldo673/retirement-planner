import type { PlanningInsight } from "@/types/insights";
import { InsightIcon } from "@/components/insights/InsightIcon";

interface InsightCardProps {
  insight: PlanningInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <article
      aria-labelledby={`insight-${insight.id}`}
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
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
          </div>
          <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {insight.description}
          </p>

          <details className="group mt-3 border-t border-slate-200/80 pt-2 dark:border-slate-700/80">
            <summary className="min-h-8 cursor-pointer list-none text-xs font-semibold text-slate-600 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-details-marker]:hidden dark:text-slate-300 dark:hover:text-white">
              <span className="inline-flex items-center gap-2">
                Calculation and source
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
            </dl>
          </details>
        </div>
      </div>
    </article>
  );
}
