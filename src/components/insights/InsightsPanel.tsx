import type { InsightCategory, PlanningInsight } from "@/types/insights";
import { InsightCard } from "@/components/insights/InsightCard";

interface InsightsPanelProps {
  insights: PlanningInsight[];
}

const groups: {
  category: InsightCategory;
  title: string;
  description: string;
}[] = [
  {
    category: "warning",
    title: "Projected pressure points",
    description: "Outputs that may change when assumptions change.",
  },
  {
    category: "success",
    title: "Projection observations",
    description: "Numerical outcomes in the current projection.",
  },
  {
    category: "information",
    title: "Planning notes",
    description: "Useful context about how to interpret the results.",
  },
];

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <section
      aria-labelledby="planning-insights-heading"
      className="mt-8"
      id="planning-insights"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          Calculation-based observations
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
          id="planning-insights-heading"
        >
          Key observations from your projection
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          These factual outputs are generated from your current inputs and projection.
          Expand an item to see its calculation and source.
        </p>
      </div>
      <div className="space-y-5">
        {groups.map((group) => {
          const categoryInsights = insights.filter(
            (insight) => insight.category === group.category,
          );
          if (categoryInsights.length === 0) {
            return null;
          }

          return (
            <div key={group.category}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {group.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {group.description}
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {categoryInsights.map((insight) => (
                  <InsightCard insight={insight} key={insight.id} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
