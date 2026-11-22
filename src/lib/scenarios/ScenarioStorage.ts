import { z } from "zod";
import type { ScenarioRecord } from "@/types/scenarios";
import { retirementPlanSchema } from "../validation/retirement-plan-schema";

export const SCENARIO_STORAGE_VERSION = 1;
export const SCENARIO_STORAGE_KEY = "retirement-planner:scenarios";

const scenarioRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  description: z.string().max(500).optional(),
  createdAt: z.iso.datetime(),
  inputs: z.object({ plan: retirementPlanSchema }),
});

const storageEnvelopeSchema = z.object({
  version: z.number().int(),
  scenarios: z.array(scenarioRecordSchema),
});

function getLocalStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Scenario storage is only available in a browser.");
  }
  return window.localStorage;
}

function readEnvelope(): ScenarioRecord[] {
  const serialized = getLocalStorage().getItem(SCENARIO_STORAGE_KEY);
  if (serialized === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error(
      "Saved scenarios could not be read. The stored data is not valid JSON.",
    );
  }

  const envelope = storageEnvelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    throw new Error(
      "Saved scenarios could not be validated. No scenario data was changed.",
    );
  }
  if (envelope.data.version !== SCENARIO_STORAGE_VERSION) {
    throw new Error(
      `Saved scenarios use storage version ${envelope.data.version}; this app supports version ${SCENARIO_STORAGE_VERSION}.`,
    );
  }

  return envelope.data.scenarios;
}

function writeEnvelope(scenarios: ScenarioRecord[]): void {
  getLocalStorage().setItem(
    SCENARIO_STORAGE_KEY,
    JSON.stringify({
      version: SCENARIO_STORAGE_VERSION,
      scenarios,
    }),
  );
}

function createScenarioId(): string {
  if (typeof crypto === "undefined" || !crypto.randomUUID) {
    throw new Error("This browser cannot create a unique scenario identifier.");
  }
  return crypto.randomUUID();
}

export function loadScenarios(): ScenarioRecord[] {
  return readEnvelope();
}

export function saveScenario(scenario: ScenarioRecord): void {
  const validatedScenario = scenarioRecordSchema.safeParse(scenario);
  if (!validatedScenario.success) {
    throw new Error("The scenario is invalid and could not be saved.");
  }

  const scenarios = readEnvelope();
  const existingIndex = scenarios.findIndex(
    (existing) => existing.id === validatedScenario.data.id,
  );
  if (existingIndex === -1) {
    scenarios.push(validatedScenario.data);
  } else {
    scenarios[existingIndex] = validatedScenario.data;
  }
  writeEnvelope(scenarios);
}

export function deleteScenario(scenarioId: string): void {
  const scenarios = readEnvelope();
  const remainingScenarios = scenarios.filter(
    (scenario) => scenario.id !== scenarioId,
  );
  if (remainingScenarios.length === scenarios.length) {
    throw new Error("The scenario could not be found and was not deleted.");
  }
  writeEnvelope(remainingScenarios);
}

export function duplicateScenario(scenarioId: string): ScenarioRecord {
  const scenarios = readEnvelope();
  const scenario = scenarios.find((item) => item.id === scenarioId);
  if (!scenario) {
    throw new Error("The scenario could not be found and was not duplicated.");
  }

  const copy: ScenarioRecord = {
    ...scenario,
    id: createScenarioId(),
    name: `${scenario.name.slice(0, 74)} copy`,
    createdAt: new Date().toISOString(),
    inputs: structuredClone(scenario.inputs),
  };
  scenarios.push(copy);
  writeEnvelope(scenarios);
  return copy;
}

export function renameScenario(
  scenarioId: string,
  name: string,
): ScenarioRecord {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 80) {
    throw new Error("Scenario names must be between 1 and 80 characters.");
  }

  const scenarios = readEnvelope();
  const scenario = scenarios.find((item) => item.id === scenarioId);
  if (!scenario) {
    throw new Error("The scenario could not be found and was not renamed.");
  }

  const renamedScenario = { ...scenario, name: normalizedName };
  saveScenario(renamedScenario);
  return renamedScenario;
}

export function createScenarioIdForNewScenario(): string {
  return createScenarioId();
}
