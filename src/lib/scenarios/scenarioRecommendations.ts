import type { Scenario, ScenarioRecommendation } from "@/types/scenarios";

function sumPlannedSpending(scenario: Scenario): number {
  return scenario.inputs.plan.spending.buckets.reduce(
    (total, bucket) => total + bucket.annualAmount,
    0,
  );
}

function percentChange(base: number, next: number): number | null {
  return base === 0 ? null : ((next - base) / Math.abs(base)) * 100;
}

export function generateScenarioRecommendations(
  baseline: Scenario,
  scenarios: Scenario[],
): ScenarioRecommendation[] {
  const recommendations: ScenarioRecommendation[] = [];

  for (const scenario of scenarios) {
    if (scenario.id === baseline.id) {
      continue;
    }

    const retirementYearsEarlier =
      baseline.inputs.plan.personalDetails.retirementAge -
      scenario.inputs.plan.personalDetails.retirementAge;
    const estateChange = percentChange(
      baseline.results.projection.summary.finalEstateValue,
      scenario.results.projection.summary.finalEstateValue,
    );

    if (retirementYearsEarlier > 0) {
      const estateClause =
        estateChange === null
          ? "The baseline estate is zero, so a percentage comparison is unavailable."
          : estateChange === 0
            ? "The projected final estates are unchanged."
          : estateChange < 0
            ? `The projected estate is ${Math.abs(estateChange).toFixed(0)}% lower.`
            : `The projected estate is ${estateChange.toFixed(0)}% higher.`;
      recommendations.push({
        id: `retirement-tradeoff-${scenario.id}`,
        title: `${scenario.name}: earlier retirement trade-off`,
        description: `${scenario.name} targets retirement ${retirementYearsEarlier} ${retirementYearsEarlier === 1 ? "year" : "years"} earlier than ${baseline.name}. ${estateClause}`,
        tone: estateChange !== null && estateChange < 0 ? "caution" : "balanced",
      });
    }

    const spendingChange = percentChange(
      sumPlannedSpending(baseline),
      sumPlannedSpending(scenario),
    );
    if (
      spendingChange !== null &&
      spendingChange >= 15 &&
      scenario.results.projection.summary.ageAssetsRunOut === null
    ) {
      recommendations.push({
        id: `higher-spending-sustainable-${scenario.id}`,
        title: `${scenario.name}: higher modeled spending`,
        description: `Planned spending inputs are ${spendingChange.toFixed(0)}% higher than ${baseline.name}, while this projection shows no unfunded shortfall through the planning horizon. This remains assumption-dependent.`,
        tone: "positive",
      });
    }

    if (
      scenario.inputs.plan.scenario === "conservative" &&
      scenario.results.projection.summary.ageAssetsRunOut === null
    ) {
      recommendations.push({
        id: `conservative-resilience-${scenario.id}`,
        title: `${scenario.name}: conservative scenario`,
        description:
          "The plan shows no unfunded shortfall under its conservative return assumptions. This is a useful stress comparison, not a guarantee of resilience.",
        tone: "positive",
      });
    }
  }

  return recommendations;
}
