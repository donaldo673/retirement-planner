"use client";

import { useMemo } from "react";
import type { Scenario, ScenarioComparison as ScenarioComparisonModel } from "@/types/scenarios";
import { ScenarioTabs } from "@/components/scenarios/ScenarioTabs";

interface ScenarioComparisonProps {
  comparison: ScenarioComparisonModel;
  onSelectScenario: (id: string) => void;
}

interface MetricDefinition {
  id: string;
  label: string;
  badge?: string;
  direction: "higher" | "lower";
  value: (scenario: Scenario) => number | null;
  display: (scenario: Scenario) => string;
}

const moneyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function getYearsToFI(scenario: Scenario): number | null {
  const age = scenario.results.projection.summary.financialIndependenceAge;
  return age === null
    ? null
    : Math.max(0, age - scenario.inputs.plan.people.person1.income.currentAge);
}

const metrics: MetricDefinition[] = [
  {
    id: "retirement-age",
    label: "Retirement age",
    badge: "Lowest age",
    direction: "lower",
    value: (scenario) => scenario.inputs.plan.personalDetails.retirementAge,
    display: (scenario) =>
      `Age ${scenario.inputs.plan.personalDetails.retirementAge}`,
  },
  {
    id: "fi-age",
    label: "FI age",
    direction: "lower",
    value: (scenario) =>
      scenario.results.projection.summary.financialIndependenceAge,
    display: (scenario) =>
      scenario.results.projection.summary.financialIndependenceAge === null
        ? "Not reached"
        : `Age ${scenario.results.projection.summary.financialIndependenceAge}`,
  },
  {
    id: "years-to-fi",
    label: "Years to FI",
    direction: "lower",
    value: getYearsToFI,
    display: (scenario) => {
      const years = getYearsToFI(scenario);
      return years === null ? "Not reached" : `${years} years`;
    },
  },
  {
    id: "estate",
    label: "Projected final assets",
    badge: "Highest value",
    direction: "higher",
    value: (scenario) =>
      scenario.results.projection.summary.finalEstateValue,
    display: (scenario) =>
      moneyFormatter.format(
        scenario.results.projection.summary.finalEstateValue,
      ),
  },
  {
    id: "retirement-net-worth",
    label: "Net worth at retirement",
    direction: "higher",
    value: (scenario) =>
      scenario.results.projection.summary.retirementNetWorth,
    display: (scenario) =>
      moneyFormatter.format(
        scenario.results.projection.summary.retirementNetWorth,
      ),
  },
  {
    id: "lifetime-tax",
    label: "Estimated lifetime tax",
    badge: "Lowest estimate",
    direction: "lower",
    value: (scenario) => scenario.results.lifetimeTax,
    display: (scenario) =>
      moneyFormatter.format(scenario.results.lifetimeTax),
  },
  {
    id: "years-funded",
    label: "Retirement years funded",
    direction: "higher",
    value: (scenario) => scenario.results.yearsFunded,
    display: (scenario) =>
      `${scenario.results.yearsFunded} of ${Math.max(
        0,
        scenario.inputs.plan.personalDetails.lifeExpectancy -
          scenario.inputs.plan.personalDetails.retirementAge,
      )} years`,
  },
  {
    id: "assets-depleted",
    label: "Assets depleted",
    direction: "higher",
    value: (scenario) =>
      scenario.results.projection.summary.ageAssetsRunOut === null
        ? Number.POSITIVE_INFINITY
        : scenario.results.projection.summary.ageAssetsRunOut,
    display: (scenario) =>
      scenario.results.projection.summary.ageAssetsRunOut === null
        ? "No shortfall"
        : `Age ${scenario.results.projection.summary.ageAssetsRunOut}`,
  },
];

function getWinners(
  scenarios: Scenario[],
  metric: MetricDefinition,
): Set<string> {
  const available = scenarios
    .map((scenario) => ({ id: scenario.id, value: metric.value(scenario) }))
    .filter(
      (item): item is { id: string; value: number } =>
        item.value !== null && !Number.isNaN(item.value),
    );
  if (available.length === 0) {
    return new Set();
  }
  const best = available.reduce(
    (bestValue, item) =>
      metric.direction === "higher"
        ? Math.max(bestValue, item.value)
        : Math.min(bestValue, item.value),
    available[0].value,
  );
  return new Set(
    available.filter((item) => item.value === best).map((item) => item.id),
  );
}

export function ScenarioComparison({
  comparison,
  onSelectScenario,
}: ScenarioComparisonProps) {
  const { scenarios, selectedScenarioId } = comparison;
  const winnerIds = useMemo(
    () =>
      new Map(
        metrics.map((metric) => [metric.id, getWinners(scenarios, metric)]),
      ),
    [scenarios],
  );
  const selectedScenario = scenarios.find(
    (scenario) => scenario.id === selectedScenarioId,
  );
  return (
    <section
      aria-labelledby="scenario-comparison-heading"
      className="mt-8"
      id="scenario-comparison"
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          Side-by-side outcomes
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
          id="scenario-comparison-heading"
        >
          Compare scenarios
        </h2>
        <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
          Highlights identify the numerical extreme for each measure among the
          selected scenarios. They do not determine which scenario is suitable.
        </p>
      </div>

      <ScenarioTabs
        onSelect={onSelectScenario}
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
      />

      {scenarios.length < 2 ? (
        <div
          aria-labelledby={`scenario-tab-${selectedScenarioId}`}
          className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          id={`scenario-panel-${selectedScenarioId}`}
          role="tabpanel"
        >
          Save or generate a scenario to compare it with your current plan.
        </div>
      ) : (
        <div
          aria-labelledby={`scenario-tab-${selectedScenarioId}`}
          className="mt-3"
          id={`scenario-panel-${selectedScenarioId}`}
          role="tabpanel"
        >
          {selectedScenario && selectedScenario.id !== comparison.currentScenarioId && (
            <p className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              Viewing results for <strong>{selectedScenario.name}</strong>. The
              editable inputs below remain your Current Plan until you choose
              “Load scenario”.
            </p>
          )}
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {scenarios.map((scenario) => (
              <article
                aria-label={`${scenario.name} comparison`}
                className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
                  scenario.id === selectedScenarioId
                    ? "border-teal-400 ring-2 ring-teal-100 dark:border-teal-700 dark:ring-teal-950"
                    : "border-slate-200 dark:border-slate-800"
                }`}
                key={scenario.id}
              >
                <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {scenario.name}
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  {metrics.map((metric) => {
                    const isWinner =
                      winnerIds.get(metric.id)?.has(scenario.id) ?? false;
                    return (
                      <div
                        className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60"
                        key={metric.id}
                      >
                        <dt className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                          {metric.label}
                        </dt>
                        <dd
                          className={`mt-1 break-words text-sm font-semibold tabular-nums ${
                            isWinner
                              ? "text-emerald-800 dark:text-emerald-300"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {metric.display(scenario)}
                        </dd>
                        {isWinner && metric.badge && (
                          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {metric.badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                    <dt className="text-[11px] text-slate-500 dark:text-slate-400">
                      Success probability
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Not modeled
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
