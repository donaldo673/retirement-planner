import type { Scenario } from "@/types/scenarios";

interface ScenarioTabsProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelect: (id: string) => void;
}

export function ScenarioTabs({
  scenarios,
  selectedScenarioId,
  onSelect,
}: ScenarioTabsProps) {
  return (
    <div
      aria-label="Scenario views"
      className="flex flex-wrap gap-2"
      role="tablist"
    >
      {scenarios.map((scenario) => (
        <button
          aria-selected={selectedScenarioId === scenario.id}
          aria-controls={`scenario-panel-${scenario.id}`}
          className={`min-h-10 max-w-full rounded-xl border px-3 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
            selectedScenarioId === scenario.id
              ? "border-teal-700 bg-teal-700 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-slate-950"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
          id={`scenario-tab-${scenario.id}`}
          key={scenario.id}
          onClick={() => onSelect(scenario.id)}
          role="tab"
          type="button"
        >
          <span className="block truncate">{scenario.name}</span>
        </button>
      ))}
    </div>
  );
}
