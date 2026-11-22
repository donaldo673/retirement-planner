import type { RetirementPlan } from "@/types/retirement";
import type { ScenarioTemplateId } from "@/types/scenarios";
import { retirementPlanSchema } from "../validation/retirement-plan-schema";

export interface ScenarioTemplateResult {
  name: string;
  description: string;
  plan: RetirementPlan;
}

export const scenarioTemplates: {
  id: ScenarioTemplateId;
  label: string;
}[] = [
  { id: "retire-earlier", label: "Retire 5 years earlier" },
  { id: "retire-later", label: "Retire 5 years later" },
  { id: "spend-more", label: "Increase spending 20%" },
  { id: "spend-less", label: "Reduce spending 20%" },
  { id: "conservative-returns", label: "Conservative returns" },
  { id: "higher-inflation", label: "Higher inflation" },
];

export function applyScenarioTemplate(
  currentPlan: RetirementPlan,
  template: ScenarioTemplateId,
): ScenarioTemplateResult {
  const plan = structuredClone(currentPlan);
  const templateLabel =
    scenarioTemplates.find((item) => item.id === template)?.label;
  if (!templateLabel) {
    throw new Error("The selected scenario template is not available.");
  }

  switch (template) {
    case "retire-earlier":
    case "retire-later": {
      const direction = template === "retire-earlier" ? -5 : 5;
      const newRetirementAge =
        plan.personalDetails.retirementAge + direction;
      const currentAge = plan.people.person1.income.currentAge;
      if (
        newRetirementAge <= currentAge ||
        newRetirementAge >= plan.personalDetails.lifeExpectancy
      ) {
        throw new Error(
          `${templateLabel} is outside the valid age range for this plan.`,
        );
      }
      plan.personalDetails.retirementAge = newRetirementAge;
      break;
    }
    case "spend-more":
      if (plan.spending.buckets.length === 0) {
        throw new Error("Add a spending category before using this template.");
      }
      plan.spending.buckets = plan.spending.buckets.map((bucket) => ({
        ...bucket,
        annualAmount: bucket.annualAmount * 1.2,
      }));
      break;
    case "spend-less":
      if (plan.spending.buckets.length === 0) {
        throw new Error("Add a spending category before using this template.");
      }
      plan.spending.buckets = plan.spending.buckets.map((bucket) => ({
        ...bucket,
        annualAmount: bucket.annualAmount * 0.8,
      }));
      break;
    case "conservative-returns":
      if (plan.scenario === "conservative") {
        throw new Error("The current plan already uses conservative returns.");
      }
      plan.scenario = "conservative";
      break;
    case "higher-inflation":
      plan.assumptions.inflationRate += 0.01;
      plan.spending.buckets = plan.spending.buckets.map((bucket) => ({
        ...bucket,
        inflationRate: bucket.inflationRate + 0.01,
      }));
      break;
  }

  const validatedPlan = retirementPlanSchema.safeParse(plan);
  if (!validatedPlan.success) {
    throw new Error(
      `The ${templateLabel.toLowerCase()} template produced invalid plan inputs.`,
    );
  }

  return {
    name: templateLabel,
    description: `Scenario created from the “${templateLabel}” template.`,
    plan: validatedPlan.data,
  };
}
