"use client";

import { useMemo, useState } from "react";
import type {
  Scenario,
  ScenarioRankingWeights,
} from "@/types/scenarios";

interface ScenarioRankingProps {
  scenarios: Scenario[];
}

const defaultWeights: ScenarioRankingWeights = {
  readiness: 40,
  sustainability: 25,
  taxEfficiency: 20,
  flexibility: 15,
};

const weightLabels: {
  key: keyof ScenarioRankingWeights;
  label: string;
}[] = [
  { key: "readiness", label: "Readiness calculation" },
  { key: "sustainability", label: "Funding duration calculation" },
  { key: "taxEfficiency", label: "Tax calculation" },
  { key: "flexibility", label: "Retirement age calculation" },
];

function getHealthScore(scenario: Scenario, id: string): number {
  return (
    scenario.results.analysis.health.find((item) => item.id === id)?.score ?? 0
  );
}

export function ScenarioRanking({ scenarios }: ScenarioRankingProps) {
  const [weights, setWeights] =
    useState<ScenarioRankingWeights>(defaultWeights);
  const rankedScenarios = useMemo(() => {
    const totalWeight =
      Object.values(weights).reduce((total, weight) => total + weight, 0) || 1;
    return scenarios
      .map((scenario) => {
        const score =
          (scenario.results.analysis.readiness.score * weights.readiness +
            getHealthScore(scenario, "withdrawal-sustainability") *
              weights.sustainability +
            getHealthScore(scenario, "tax-efficiency") *
              weights.taxEfficiency +
            getHealthScore(scenario, "retirement-flexibility") *
              weights.flexibility) /
          totalWeight;
        return { scenario, score: Math.round(score) };
      })
      .sort(
        (first, second) =>
          second.score - first.score ||
          first.scenario.name.localeCompare(second.scenario.name),
      );
  }, [scenarios, weights]);

  const bestConservative = rankedScenarios.find(
    ({ scenario }) => scenario.inputs.plan.scenario === "conservative",
  )?.scenario.id;
  const highestEstateId = scenarios.reduce<string | null>(
    (bestId, scenario) => {
      if (!bestId) {
        return scenario.id;
      }
      const bestScenario = scenarios.find((item) => item.id === bestId);
      return bestScenario &&
        scenario.results.projection.summary.finalEstateValue >
          bestScenario.results.projection.summary.finalEstateValue
        ? scenario.id
        : bestId;
    },
    null,
  );

  return (
    <section
      aria-labelledby="scenario-ranking-heading"
      className="mt-8"
      id="scenario-ranking"
    >
      <div className="mb-3">
        <h2
          className="text-lg font-semibold text-slate-950 dark:text-white"
          id="scenario-ranking-heading"
        >
          Weighted scenario comparison
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
          Adjust the weights applied to existing mathematical outputs. The
          resulting order is not a recommendation or probability of success.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        {weightLabels.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
                htmlFor={`scenario-weight-${key}`}
              >
                {label}
              </label>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {weights[key]}
              </span>
            </div>
            <input
              className="mt-2 w-full accent-teal-600"
              id={`scenario-weight-${key}`}
              max={100}
              min={0}
              onChange={(event) =>
                setWeights((current) => ({
                  ...current,
                  [key]: Number(event.target.value),
                }))
              }
              type="range"
              value={weights[key]}
            />
          </div>
        ))}
      </div>

      {rankedScenarios.length > 0 ? (
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {rankedScenarios.map(({ scenario, score }, index) => (
            <li
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              key={scenario.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                    {index === 0
                      ? "Highest weighted score"
                      : `Weighted position ${index + 1}`}
                  </p>
                  <h3 className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white">
                    {scenario.name}
                  </h3>
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {score}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scenario.id === bestConservative && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Lower-return assumption
                  </span>
                )}
                {scenario.id === highestEstateId && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Highest estate
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          No scenarios are available to rank.
        </p>
      )}
    </section>
  );
}
