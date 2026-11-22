import type { Scenario } from "@/types/scenarios";
import { ScenarioCard } from "@/components/scenarios/ScenarioCard";

interface ScenarioListProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  editingScenarioId: string | null;
  isBusy: boolean;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onLoad: (id: string) => void;
}

export function ScenarioList({
  scenarios,
  activeScenarioId,
  editingScenarioId,
  isBusy,
  onDuplicate,
  onRename,
  onDelete,
  onLoad,
}: ScenarioListProps) {
  if (scenarios.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          No saved scenarios yet.
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Create your first retirement scenario to compare a different plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {scenarios.map((scenario) => (
        <ScenarioCard
          isActive={activeScenarioId === scenario.id}
          autoEdit={editingScenarioId === scenario.id}
          isBusy={isBusy}
          key={`${scenario.id}:${scenario.name}`}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onLoad={onLoad}
          onRename={onRename}
          scenario={scenario}
        />
      ))}
    </div>
  );
}
