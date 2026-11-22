import type { PlanningAnalysis } from "@/types/insights";
import type { ProjectionResult, RetirementPlan } from "@/types/retirement";
import type { ProjectionPoint } from "@/types/charts";

export interface ScenarioInput {
  plan: RetirementPlan;
}

export interface ScenarioResult {
  projection: ProjectionResult;
  analysis: PlanningAnalysis;
  lifetimeTax: number;
  yearsFunded: number;
  successProbability: null;
}

export interface ScenarioRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  inputs: ScenarioInput;
}

export interface Scenario extends ScenarioRecord {
  results: ScenarioResult;
}

export interface ScenarioComparison {
  scenarios: Scenario[];
  currentScenarioId: string;
  selectedScenarioId: string;
}

export interface ScenarioChartSeries {
  id: string;
  name: string;
  color: string;
  data: ProjectionPoint[];
}

export type ScenarioTemplateId =
  | "retire-earlier"
  | "retire-later"
  | "spend-more"
  | "spend-less"
  | "conservative-returns"
  | "higher-inflation";

export interface ScenarioRecommendation {
  id: string;
  title: string;
  description: string;
  tone: "balanced" | "positive" | "caution";
}

export interface ScenarioRankingWeights {
  readiness: number;
  sustainability: number;
  taxEfficiency: number;
  flexibility: number;
}

export interface ScenarioReportModel {
  version: 1;
  generatedAt: string;
  scenarios: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    inputs: ScenarioInput;
    outputs: {
      retirementAge: number;
      financialIndependenceAge: number | null;
      finalEstateValue: number;
      retirementNetWorth: number;
      lifetimeTax: number;
      readinessScore: number;
      successProbability: null;
    };
    insightSummaries: string[];
  }[];
  comparisonMetrics: {
    id: string;
    label: string;
    values: Record<string, number | null>;
  }[];
}
