import type { ProjectionResult, RetirementPlan } from "@/types/retirement";

export type InsightCategory =
  | "success"
  | "opportunity"
  | "warning"
  | "information";

export type HealthRating = "poor" | "fair" | "good" | "excellent";

export type RiskLevel = "low" | "moderate" | "high" | "not-assessed";

export interface InsightInput {
  plan: RetirementPlan;
  projection: ProjectionResult;
}

export interface InsightExplanation {
  calculation: string;
  dataSource: string;
  interpretation: string;
}

export interface PlanningInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  priority: number;
  suggestedAction?: string;
  explanation: InsightExplanation;
}

export interface HealthAssessment {
  id: string;
  title: string;
  rating: HealthRating;
  score: number;
  description: string;
  calculation: string;
  dataSource: string;
}

export interface ReadinessDimension {
  id: string;
  label: string;
  score: number;
  weight: number;
}

export interface ReadinessAssessment {
  score: number;
  rating: HealthRating;
  explanation: string;
  dimensions: ReadinessDimension[];
}

export interface PlanningMetric {
  id: string;
  label: string;
  value: string;
  explanation: string;
}

export interface PlanningRisk {
  id: string;
  title: string;
  level: RiskLevel;
  description: string;
  explanation: string;
  dataSource: string;
}

export interface PlanningAnalysis {
  insights: PlanningInsight[];
  health: HealthAssessment[];
  readiness: ReadinessAssessment;
  metrics: PlanningMetric[];
  risks: PlanningRisk[];
  opportunities: PlanningInsight[];
}
