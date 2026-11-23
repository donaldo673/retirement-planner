"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ScenarioComparison } from "@/components/scenarios/ScenarioComparison";
import { ScenarioDifferences } from "@/components/scenarios/ScenarioDifferences";
import { ScenarioManager } from "@/components/scenarios/ScenarioManager";
import { ScenarioRanking } from "@/components/scenarios/ScenarioRanking";
import { ScenarioRecommendations } from "@/components/scenarios/ScenarioRecommendations";
import { calculateScenario, createScenarioRecord } from "@/lib/scenarios/createScenarioResult";
import { generateScenarioRecommendations } from "@/lib/scenarios/scenarioRecommendations";
import { applyScenarioTemplate } from "@/lib/scenarios/scenarioTemplates";
import { scenarioRepository } from "@/lib/scenarios/ScenarioRepository";
import type { PlanningAnalysis } from "@/types/insights";
import type {
  Scenario,
  ScenarioChartSeries,
  ScenarioRecord,
  ScenarioTemplateId,
} from "@/types/scenarios";
import type { ProjectionResult, RetirementPlan } from "@/types/retirement";

const CURRENT_SCENARIO_ID = "current";
const SCENARIO_COLORS = ["#0f766e", "#7c3aed", "#2563eb", "#d97706", "#db2777"];

interface ScenarioWorkspaceProps {
  plan: RetirementPlan;
  projection: ProjectionResult;
  analysis: PlanningAnalysis;
  currentPlanChanged: boolean;
  isPlanLoading: boolean;
  onLoadPlan: (plan: RetirementPlan) => void;
  children: (content: {
    scenarioSeries: ScenarioChartSeries[];
    scenarioPanel: ReactNode;
  }) => ReactNode;
}

function getNextScenarioName(records: ScenarioRecord[]): string {
  const existingNames = new Set(records.map((record) => record.name));
  let index = 1;
  while (existingNames.has(`Scenario ${index}`)) {
    index += 1;
  }
  return `Scenario ${index}`;
}

export function ScenarioWorkspace({
  plan,
  projection,
  analysis,
  currentPlanChanged,
  isPlanLoading,
  onLoadPlan,
  children,
}: ScenarioWorkspaceProps) {
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState(CURRENT_SCENARIO_ID);
  useEffect(() => {
    let active = true;
    scenarioRepository
      .loadAll()
      .then((loadedRecords) => {
        if (active) {
          setSavedScenarios(loadedRecords.map((record) => calculateScenario(record)));
          setStorageError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStorageError(
            error instanceof Error
              ? error.message
              : "Saved scenarios could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const currentScenario = useMemo(
    () =>
      calculateScenario(
        {
          id: CURRENT_SCENARIO_ID,
          name: "Current Plan",
          createdAt: new Date(0).toISOString(),
          inputs: { plan },
        },
        projection,
        analysis,
      ),
    [analysis, plan, projection],
  );

  const scenarios = useMemo(
    () => [currentScenario, ...savedScenarios],
    [currentScenario, savedScenarios],
  );
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    currentScenario;
  const recommendations = useMemo(
    () => generateScenarioRecommendations(currentScenario, savedScenarios),
    [currentScenario, savedScenarios],
  );
  const comparison = useMemo(
    () => ({
      scenarios,
      currentScenarioId: CURRENT_SCENARIO_ID,
      selectedScenarioId,
    }),
    [scenarios, selectedScenarioId],
  );
  const scenarioSeries = useMemo(
    () =>
      savedScenarios.map((scenario, index) => ({
        id: scenario.id,
        name: scenario.name,
        color: SCENARIO_COLORS[index % SCENARIO_COLORS.length],
        data: scenario.results.projection.yearlyResults.map((year) => ({
          age: year.age,
          netWorth: year.netWorth,
        })),
      })),
    [savedScenarios],
  );

  async function saveRecord(record: ScenarioRecord): Promise<Scenario> {
    await scenarioRepository.save(record);
    const scenario = calculateScenario(record);
    setSavedScenarios((current) => [...current, scenario]);
    return scenario;
  }

  async function saveCurrent(): Promise<Scenario> {
    const record = createScenarioRecord(
      plan,
      getNextScenarioName(savedScenarios),
    );
    return saveRecord(record);
  }

  async function createTemplate(
    template: ScenarioTemplateId,
  ): Promise<Scenario> {
    const templateResult = applyScenarioTemplate(plan, template);
    const record = createScenarioRecord(
      templateResult.plan,
      templateResult.name,
      templateResult.description,
    );
    return saveRecord(record);
  }

  async function duplicate(id: string): Promise<Scenario> {
    const record = await scenarioRepository.duplicate(id);
    const scenario = calculateScenario(record);
    setSavedScenarios((current) => [...current, scenario]);
    return scenario;
  }

  async function rename(id: string, name: string): Promise<void> {
    const record = await scenarioRepository.rename(id, name);
    setSavedScenarios((current) =>
      current.map((item) =>
        item.id === id ? { ...item, name: record.name } : item,
      ),
    );
  }

  async function remove(id: string): Promise<void> {
    await scenarioRepository.delete(id);
    setSavedScenarios((current) =>
      current.filter((scenario) => scenario.id !== id),
    );
    if (selectedScenarioId === id) {
      setSelectedScenarioId(CURRENT_SCENARIO_ID);
    }
  }

  async function load(id: string, saveCurrentFirst: boolean): Promise<void> {
    const scenario = savedScenarios.find((item) => item.id === id);
    if (!scenario) {
      throw new Error("The selected scenario is no longer available.");
    }

    if (saveCurrentFirst) {
      const currentRecord = createScenarioRecord(
        plan,
        getNextScenarioName(savedScenarios),
      );
      await scenarioRepository.save(currentRecord);
      setSavedScenarios((current) => [
        ...current,
        calculateScenario(currentRecord),
      ]);
    }

    onLoadPlan(structuredClone(scenario.inputs.plan));
    setSelectedScenarioId(scenario.id);
  }

  const scenarioPanel = (
    <div className="mt-8">
      <ScenarioManager
        activeScenarioId={selectedScenarioId}
        currentPlanChanged={currentPlanChanged}
        isLoading={isLoading || isPlanLoading}
        onCreateTemplate={createTemplate}
        onDelete={remove}
        onDuplicate={duplicate}
        onLoad={load}
        onRename={rename}
        onSaveCurrent={saveCurrent}
        scenarios={savedScenarios}
        storageError={storageError}
      />
      <ScenarioComparison
        comparison={comparison}
        onSelectScenario={setSelectedScenarioId}
      />
      <ScenarioDifferences
        baseline={currentScenario}
        selected={selectedScenario}
      />
      <ScenarioRecommendations recommendations={recommendations} />
      <details className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <summary className="min-h-8 cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-slate-100">
          Advanced Comparison
        </summary>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Weighted outputs reflect the mathematical criteria and weights shown. They do not determine which scenario is suitable or recommend a course of action.
        </p>
        <ScenarioRanking scenarios={scenarios} />
      </details>
    </div>
  );

  return children({ scenarioSeries, scenarioPanel });
}
