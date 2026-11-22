import type { PlanningInsight } from "@/types/insights";
import type { PlanningFacts } from "@/lib/insights/planningFacts";

export function ruleBasedInsights(
  facts: PlanningFacts,
): PlanningInsight[] {
  const { plan, projection, yearsAheadOfTarget } = facts;
  const insights: PlanningInsight[] = [];

  if (facts.firstShortfall) {
    const shortfallAge = facts.firstShortfall.age;
    insights.push(
      ({
        id: "projected-funding-shortfall",
        title: "A funding shortfall appears in the projection",
        description: `The projection first shows an unfunded amount at age ${shortfallAge}. This is a prompt to review assumptions, spending, or timing—not a prediction of what will happen.`,
        category: "warning",
        priority: 10,
        suggestedAction:
          "Review the spending plan, retirement timing, and return assumptions together.",
        explanation: {
          calculation: `The first year with an unfunded shortfall is age ${shortfallAge}; the projected shortfall is ${facts.firstShortfall.unfundedShortfall.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}.`,
          dataSource:
            "ProjectionYear.unfundedShortfall and ProjectionYear.age.",
          interpretation:
            "The deterministic projection cannot fully fund its modeled spending in that year under the current inputs.",
        },
      }),
    );
  } else {
    insights.push(
      ({
        id: "funded-through-life-expectancy",
        title: "No funding shortfall is projected through your planning horizon",
        description: `The current projection meets modeled spending through age ${facts.lifeExpectancy}.`,
        category: "success",
        priority: 8,
        explanation: {
          calculation:
            "No projected year has an unfunded shortfall greater than zero.",
          dataSource:
            "ProjectionYear.unfundedShortfall through the configured life expectancy.",
          interpretation:
            "This result depends on the plan's assumptions and is not a guarantee.",
        },
      }),
    );
  }

  if (yearsAheadOfTarget !== null && yearsAheadOfTarget > 0) {
    insights.push(
      ({
        id: "financial-independence-before-target",
        title: "Your projection reaches financial independence before your target",
        description: `The model reaches its financial-independence milestone ${yearsAheadOfTarget} ${yearsAheadOfTarget === 1 ? "year" : "years"} before your planned retirement age.`,
        category: "opportunity",
        priority: 7,
        suggestedAction:
          "Explore an earlier retirement age in a separate scenario before changing your plan.",
        explanation: {
          calculation: `Planned retirement age ${facts.retirementAge} minus projected financial-independence age ${facts.financialIndependenceAge}.`,
          dataSource:
            "RetirementPlan.personalDetails.retirementAge and RetirementSummary.financialIndependenceAge.",
          interpretation:
            "The financial-independence milestone uses this planner's assumptions; it does not determine whether an earlier retirement is right for you.",
        },
      }),
    );
  }

  if (
    facts.estateMultiple !== null &&
    facts.estateMultiple >= 1.5 &&
    projection.summary.finalEstateValue > 0
  ) {
    insights.push(
      ({
        id: "estate-above-retirement-spending",
        title: "Your projected estate is larger than modeled retirement spending",
        description:
          "Your final projected estate is at least one and a half times the planner's total retirement-spending estimate.",
        category: "opportunity",
        priority: 5,
        suggestedAction:
          "Consider whether your balance between spending, flexibility, and legacy goals still fits your priorities.",
        explanation: {
          calculation: `Final estate divided by total projected retirement spending is ${facts.estateMultiple.toFixed(1)}×.`,
          dataSource:
            "RetirementSummary.finalEstateValue and RetirementSummary.totalRetirementSpending.",
          interpretation:
            "This comparison is sensitive to assumptions and does not account for every future cost or personal goal.",
        },
      }),
    );
  }

  if (facts.isaShareAtRetirement !== null && facts.isaShareAtRetirement < 0.1) {
    insights.push(
      ({
        id: "limited-isa-balance",
        title: "Your projected ISA balance is a small part of retirement savings",
        description:
          "The ISA balance is less than 10% of projected ISA, pension, GIA, and cash balances at retirement, so there may be limited tax-free withdrawal flexibility in this projection.",
        category: "opportunity",
        priority: 4,
        suggestedAction:
          "Review whether your planned ISA contributions and withdrawal mix match your goals.",
        explanation: {
          calculation: `Projected ISA balance is ${(facts.isaShareAtRetirement * 100).toFixed(1)}% of projected ISA, pension, GIA, and cash balances at retirement.`,
          dataSource:
            "ProjectionYear.isaValue, totalInvestedAssets, and cashValue at the planned retirement age.",
          interpretation:
            "This is an account-mix observation, not a recommendation to contribute to a particular account.",
        },
      }),
    );
  }

  if (facts.pensionIncomeShare !== null && facts.pensionIncomeShare >= 0.6) {
    insights.push(
      ({
        id: "pension-income-reliance",
        title: "A large share of projected retirement income comes from pension drawdown",
        description: `Pension drawdown provides ${(facts.pensionIncomeShare * 100).toFixed(0)}% of modeled total income during the retirement years.`,
        category: "warning",
        priority: 6,
        suggestedAction:
          "Review how pension withdrawals affect taxable income and the flexibility of your other accounts.",
        explanation: {
          calculation:
            "Total projected pension drawdown income divided by total projected income over retirement years.",
          dataSource:
            "ProjectionYear.pensionDrawdownIncome and ProjectionYear.totalIncome.",
          interpretation:
            "Pension access and tax treatment depend on personal circumstances and current rules.",
        },
      }),
    );
  }

  if (plan.scenario === "optimistic") {
    insights.push(
      ({
        id: "optimistic-scenario",
        title: "Your current view uses the optimistic scenario",
        description:
          "This scenario increases the plan's real-return assumptions, so the results may be higher than the expected or conservative views.",
        category: "warning",
        priority: 6,
        suggestedAction:
          "Compare the conservative and expected scenarios before relying on this result.",
        explanation: {
          calculation:
            "The selected scenario is optimistic; the projection applies its configured return adjustment.",
          dataSource: "RetirementPlan.scenario and ProjectionResult.scenario.",
          interpretation:
            "The scenario is a planning sensitivity, not a forecast of market returns.",
        },
      }),
    );
  }

  if (plan.assumptions.inflationRate >= 0.05) {
    insights.push(
      ({
        id: "high-inflation-assumption",
        title: "Your inflation assumption is relatively high",
        description: `The plan uses ${(plan.assumptions.inflationRate * 100).toFixed(1)}% annual inflation, which can increase projected future spending.`,
        category: "warning",
        priority: 6,
        suggestedAction:
          "Check that the general inflation assumption and individual spending-bucket assumptions reflect your intended scenario.",
        explanation: {
          calculation:
            "The configured general inflation assumption is at least 5% per year.",
          dataSource:
            "RetirementPlan.assumptions.inflationRate and spending bucket inflation rates.",
          interpretation:
            "Inflation is uncertain; this threshold is a review prompt, not a forecast.",
        },
      }),
    );
  }

  if (projection.summary.finalEstateValue > 0) {
    insights.push(
      ({
        id: "positive-final-estate",
        title: "Your plan projects a positive estate at the end of the horizon",
        description: `The model shows ${projection.summary.finalEstateValue.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })} remaining at age ${facts.lifeExpectancy}.`,
        category: "success",
        priority: 5,
        explanation: {
          calculation:
            "The final projected net-worth value is greater than zero.",
          dataSource:
            "RetirementSummary.finalEstateValue and RetirementPlan.personalDetails.lifeExpectancy.",
          interpretation:
            "The figure reflects the current model assumptions and is not a guaranteed estate value.",
        },
      }),
    );
  }

  if (facts.retirementYear && facts.retirementYear.isaValue > 0) {
    insights.push(
      ({
        id: "isa-withdrawal-flexibility",
        title: "Your projected plan includes ISA savings at retirement",
        description:
          "An ISA balance can provide a source of tax-free withdrawal flexibility under current UK rules.",
        category: "success",
        priority: 3,
        explanation: {
          calculation: `Projected ISA balance at retirement is ${facts.retirementYear.isaValue.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })}.`,
          dataSource: "ProjectionYear.isaValue at the planned retirement age.",
          interpretation:
            "Tax treatment can change; this observation does not assess personal tax advice.",
        },
      }),
    );
  }

  insights.push(
    ({
      id: "fixed-return-projection",
      title: "The projection uses fixed return assumptions",
      description:
        "Investment returns can vary, and this deterministic projection does not model the order of market gains and losses.",
      category: "information",
      priority: 2,
      suggestedAction:
        "Compare scenarios and revisit your plan as circumstances change.",
      explanation: {
        calculation:
          "The projection applies the selected scenario's return assumptions year by year.",
        dataSource: "ProjectionResult.effectiveAssumptions and scenario.",
        interpretation:
          "Actual returns may differ, particularly over short periods.",
      },
    }),
  );

  insights.push(
    ({
      id: "pension-tax-information",
      title: "Pension drawdown may affect taxable income",
      description:
        "The planner includes modeled pension withdrawals in taxable income; actual tax depends on your full circumstances and current rules.",
      category: "information",
      priority: 1,
      explanation: {
        calculation:
          "Pension drawdown is included in projected annual income and tax estimates.",
        dataSource:
          "ProjectionYear.pensionDrawdownIncome and ProjectionYear.tax.",
        interpretation:
          "Use this as a planning prompt, not personal tax advice.",
      },
    }),
  );

  return insights.sort(
    (first, second) =>
      second.priority - first.priority || first.id.localeCompare(second.id),
  );
}
