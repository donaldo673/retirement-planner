import type { ScenarioRecord } from "@/types/scenarios";
import {
  deleteScenario,
  duplicateScenario,
  loadScenarios,
  renameScenario,
  saveScenario,
} from "./ScenarioStorage";

export interface ScenarioRepository {
  loadAll(): Promise<ScenarioRecord[]>;
  save(scenario: ScenarioRecord): Promise<void>;
  duplicate(id: string): Promise<ScenarioRecord>;
  rename(id: string, name: string): Promise<ScenarioRecord>;
  delete(id: string): Promise<void>;
}

export class LocalStorageScenarioRepository implements ScenarioRepository {
  async loadAll(): Promise<ScenarioRecord[]> {
    return loadScenarios();
  }

  async save(scenario: ScenarioRecord): Promise<void> {
    saveScenario(scenario);
  }

  async duplicate(id: string): Promise<ScenarioRecord> {
    return duplicateScenario(id);
  }

  async rename(id: string, name: string): Promise<ScenarioRecord> {
    return renameScenario(id, name);
  }

  async delete(id: string): Promise<void> {
    deleteScenario(id);
  }
}

export const scenarioRepository: ScenarioRepository =
  new LocalStorageScenarioRepository();
