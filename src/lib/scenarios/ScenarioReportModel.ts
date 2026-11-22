import type { Scenario, ScenarioReportModel } from "@/types/scenarios";

export function createScenarioReportModel(
  scenarios: Scenario[],
): ScenarioReportModel {
  const scenarioValues = (
    selector: (scenario: Scenario) => number | null,
  ) =>
    Object.fromEntries(
      scenarios.map((scenario) => [scenario.id, selector(scenario)]),
    );

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    scenarios: scenarios.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      createdAt: scenario.createdAt,
      inputs: scenario.inputs,
      outputs: {
        retirementAge: scenario.inputs.plan.personalDetails.retirementAge,
        financialIndependenceAge:
          scenario.results.projection.summary.financialIndependenceAge,
        finalEstateValue:
          scenario.results.projection.summary.finalEstateValue,
        retirementNetWorth:
          scenario.results.projection.summary.retirementNetWorth,
        lifetimeTax: scenario.results.lifetimeTax,
        readinessScore: scenario.results.analysis.readiness.score,
        successProbability: scenario.results.successProbability,
      },
      insightSummaries: scenario.results.analysis.insights.map(
        (insight) => insight.title,
      ),
    })),
    comparisonMetrics: [
      {
        id: "final-estate",
        label: "Final estate",
        values: scenarioValues(
          (scenario) =>
            scenario.results.projection.summary.finalEstateValue,
        ),
      },
      {
        id: "lifetime-tax",
        label: "Lifetime tax",
        values: scenarioValues((scenario) => scenario.results.lifetimeTax),
      },
      {
        id: "readiness",
        label: "Readiness score",
        values: scenarioValues(
          (scenario) => scenario.results.analysis.readiness.score,
        ),
      },
      {
        id: "financial-independence-age",
        label: "Financial independence age",
        values: scenarioValues(
          (scenario) =>
            scenario.results.projection.summary.financialIndependenceAge,
        ),
      },
    ],
  };
}
