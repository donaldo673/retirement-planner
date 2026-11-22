import type { PlanningInsight } from "@/types/insights";
import { InsightCard } from "@/components/insights/InsightCard";

interface PotentialImprovementsProps {
  opportunities: PlanningInsight[];
}

export function PotentialImprovements({
  opportunities,
}: PotentialImprovementsProps) {
  return (
    <section
      aria-labelledby="potential-improvements-heading"
      className="mt-8"
      id="potential-improvements"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
          Data-backed ideas
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
          id="potential-improvements-heading"
        >
          Potential improvements
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          These are options to explore, not recommendations to change your plan.
        </p>
      </div>
      {opportunities.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {opportunities.map((opportunity) => (
            <InsightCard insight={opportunity} key={opportunity.id} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          No specific improvement opportunities were identified from the
          current projection. You can revisit this section after changing your
          assumptions or goals.
        </p>
      )}
    </section>
  );
}
