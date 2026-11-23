import type { ScenarioRecommendation } from "@/types/scenarios";

interface ScenarioRecommendationsProps {
  recommendations: ScenarioRecommendation[];
}

export function ScenarioRecommendations({
  recommendations,
}: ScenarioRecommendationsProps) {
  return (
    <section
      aria-labelledby="scenario-recommendations-heading"
      className="mt-8"
      id="scenario-recommendations"
    >
      <div className="mb-3">
        <h2
          className="text-lg font-semibold text-slate-950 dark:text-white"
          id="scenario-recommendations-heading"
        >
          Scenario observations
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
          These comparisons describe trade-offs in the modeled results; they do
          not recommend a particular retirement decision.
        </p>
      </div>
      {recommendations.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {recommendations.map((recommendation) => (
            <li
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              key={recommendation.id}
            >
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                {recommendation.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {recommendation.description}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          Save another scenario to receive a side-by-side trade-off summary.
        </p>
      )}
    </section>
  );
}
