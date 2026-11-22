import type { InsightInput, PlanningInsight } from "@/types/insights";

export type FutureAIInsightsProvider = (
  input: InsightInput,
) => Promise<PlanningInsight[]>;
