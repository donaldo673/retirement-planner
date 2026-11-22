import type { Scenario, ScenarioRecord } from "@/types/scenarios";
import type { RetirementPlan } from "@/types/retirement";
import { calculateProjection } from "../calculations/retirement-engine";
import { transformTaxData } from "../charts/transformTaxData";
import { analyzePlanning } from "../insights/generateInsights";
import { createScenarioIdForNewScenario } from "./ScenarioStorage";

export function createScenarioRecord(
  plan: RetirementPlan,
  name: string,
  description?: string,
): ScenarioRecord {
  return {
    id: createScenarioIdForNewScenario(),
    name,
    description,
    createdAt: new Date().toISOString(),
    inputs: { plan: structuredClone(plan) },
  };
}

export function calculateScenario(
  record: ScenarioRecord,
  projection = calculateProjection(record.inputs.plan),
  analysis = analyzePlanning({
    plan: record.inputs.plan,
    projection,
  }),
): Scenario {
  const plannedYears = Math.max(
    0,
    record.inputs.plan.personalDetails.lifeExpectancy -
      record.inputs.plan.personalDetails.retirementAge,
  );
  const yearsFunded =
    projection.summary.ageAssetsRunOut === null
      ? plannedYears
      : Math.max(
          0,
          Math.min(
            plannedYears,
            projection.summary.ageAssetsRunOut -
              record.inputs.plan.personalDetails.retirementAge,
          ),
        );
  return {
    ...record,
    results: {
      projection,
      analysis,
      lifetimeTax: transformTaxData(projection.yearlyResults).totalTax,
      yearsFunded,
      successProbability: null,
    },
  };
}
