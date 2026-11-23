import type {
  HealthAssessment,
  HealthRating,
  InsightInput,
  PlanningAnalysis,
  PlanningInsight,
  PlanningMetric,
  PlanningRisk,
  ReadinessAssessment,
  ReadinessDimension,
} from "@/types/insights";
import { createPlanningFacts } from "./planningFacts";
import { ruleBasedInsights } from "./ruleBasedInsights";
import type { PlanningFacts } from "@/lib/insights/planningFacts";

function ratingForScore(score: number): HealthRating {
  if (score >= 85) {
    return "excellent";
  }
  if (score >= 70) {
    return "good";
  }
  if (score >= 50) {
    return "fair";
  }
  return "poor";
}

function clampScore(score: number): number {
  return Math.round(Math.max(0, Math.min(100, score)));
}

function assessHealth(facts: PlanningFacts): HealthAssessment[] {
  const estateScore =
    facts.estateMultiple === null
      ? facts.projection.summary.finalEstateValue > 0
        ? 100
        : 20
      : facts.estateMultiple >= 1
        ? 100
        : facts.estateMultiple >= 0.5
          ? 75
          : facts.estateMultiple > 0
            ? 55
            : 20;
  const cashflowScore = clampScore(facts.cashflowCoverageRatio * 100);
  const isaShare = facts.isaShareAtRetirement ?? 0;
  const taxFlexibilityScore =
    facts.isaShareAtRetirement === null
      ? 40
      : isaShare >= 0.3
        ? 100
        : isaShare >= 0.15
          ? 80
          : isaShare > 0
            ? 60
            : 35;
  const withdrawalScore = clampScore(facts.retirementFundingRatio * 100);
  const flexibilityScore =
    facts.yearsAheadOfTarget === null
      ? 20
      : facts.yearsAheadOfTarget >= 5
        ? 100
        : facts.yearsAheadOfTarget >= 3
          ? 85
          : facts.yearsAheadOfTarget >= 1
            ? 70
            : facts.yearsAheadOfTarget === 0
              ? 60
              : Math.max(10, 60 + facts.yearsAheadOfTarget * 10);

  const assessments: HealthAssessment[] = [
    {
      id: "assets",
      title: "Assets",
      score: clampScore(estateScore),
      rating: ratingForScore(estateScore),
      description:
        "A view of the projected final estate compared with modeled retirement spending.",
      calculation:
        facts.estateMultiple === null
          ? "The planner has no positive total retirement-spending estimate to compare."
          : `Final estate divided by total retirement spending: ${facts.estateMultiple.toFixed(1)}×.`,
      dataSource:
        "RetirementSummary.finalEstateValue and RetirementSummary.totalRetirementSpending.",
    },
    {
      id: "cashflow",
      title: "Cashflow",
      score: cashflowScore,
      rating: ratingForScore(cashflowScore),
      description:
        "The share of projected retirement years with no modeled unfunded shortfall.",
      calculation: `${facts.retirementYears.length - facts.shortfallYears} of ${facts.retirementYears.length} retirement years have no unfunded shortfall.`,
      dataSource: "ProjectionYear.unfundedShortfall during retirement.",
    },
    {
      id: "tax-efficiency",
      title: "Tax efficiency",
      score: clampScore(taxFlexibilityScore),
      rating: ratingForScore(taxFlexibilityScore),
      description:
        "A proxy for tax flexibility based on the projected ISA share at retirement, not a full tax-efficiency comparison.",
      calculation:
        facts.isaShareAtRetirement === null
          ? "No retirement-year ISA share is available."
          : `ISA balance is ${(facts.isaShareAtRetirement * 100).toFixed(1)}% of ISA, pension, GIA, and cash balances at retirement.`,
      dataSource:
        "ProjectionYear.isaValue, totalInvestedAssets, and cashValue at retirement.",
    },
    {
      id: "withdrawal-sustainability",
      title: "Withdrawal sustainability",
      score: withdrawalScore,
      rating: ratingForScore(withdrawalScore),
      description:
        "How many of the planned retirement years are covered before the first projected shortfall.",
      calculation: `${facts.fundedRetirementYears} of ${facts.plannedRetirementYears} planned retirement years are covered in the projection.`,
      dataSource:
        "RetirementSummary.ageAssetsRunOut and the plan's retirement age and life expectancy.",
    },
    {
      id: "retirement-flexibility",
      title: "Retirement flexibility",
      score: clampScore(flexibilityScore),
      rating: ratingForScore(flexibilityScore),
      description:
        "Whether the model reaches its financial-independence milestone before your planned retirement age.",
      calculation:
        facts.yearsAheadOfTarget === null
          ? "Financial independence was not reached within the projection."
          : facts.yearsAheadOfTarget >= 0
            ? `Financial independence is reached ${facts.yearsAheadOfTarget} years before or at the planned retirement age.`
            : `Financial independence is reached ${Math.abs(facts.yearsAheadOfTarget)} years after the planned retirement age.`,
      dataSource:
        "RetirementSummary.financialIndependenceAge and RetirementPlan.personalDetails.retirementAge.",
    },
  ];

  return assessments;
}

function assessReadiness(health: HealthAssessment[]): ReadinessAssessment {
  const weights: Record<string, number> = {
    assets: 25,
    cashflow: 20,
    "tax-efficiency": 15,
    "withdrawal-sustainability": 25,
    "retirement-flexibility": 15,
  };
  const dimensions: ReadinessDimension[] = health.map((assessment) => ({
    id: assessment.id,
    label: assessment.title,
    score: assessment.score,
    weight: weights[assessment.id] ?? 0,
  }));
  const score = Math.round(
    dimensions.reduce(
      (total, dimension) =>
        total + (dimension.score * dimension.weight) / 100,
      0,
    ),
  );

  return {
    score,
    rating: ratingForScore(score),
    explanation:
      "An educational indicator weighted across projected assets, cashflow coverage, ISA flexibility, funding horizon, and financial-independence timing. It is not a probability of success or financial advice.",
    dimensions,
  };
}

function formatPercent(value: number | null): string {
  return value === null ? "Not available" : `${(value * 100).toFixed(1)}%`;
}

function createMetrics(facts: PlanningFacts): PlanningMetric[] {
  const yearsBeforeTarget =
    facts.yearsAheadOfTarget !== null && facts.yearsAheadOfTarget > 0
      ? `${facts.yearsAheadOfTarget} ${facts.yearsAheadOfTarget === 1 ? "year" : "years"}`
      : "Not before target";
  const fundedYears = `${facts.fundedRetirementYears} of ${facts.plannedRetirementYears} years`;
  const estateMultiple =
    facts.estateMultiple === null
      ? "Not available"
      : `${facts.estateMultiple.toFixed(1)}×`;

  return [
    {
      id: "years-before-fi",
      label: "Years before target",
      value: yearsBeforeTarget,
      explanation:
        "Difference between your planned retirement age and the model's financial-independence age.",
    },
    {
      id: "retirement-years-funded",
      label: "Retirement years funded",
      value: fundedYears,
      explanation:
        "Projected years from the planned retirement age to the first funding shortfall, capped at your planning horizon.",
    },
    {
      id: "average-withdrawal-rate",
      label: "Average withdrawal rate",
      value: formatPercent(facts.averageWithdrawalRate),
      explanation:
        "Average annual withdrawals from cash, GIA, ISA, and pension divided by the opening investable balance for each retirement year. This is descriptive, not a safe-withdrawal rule.",
    },
    {
      id: "income-replacement-ratio",
      label: "Income replacement ratio",
      value: formatPercent(facts.incomeReplacementRatio),
      explanation:
        "Projected total income at retirement compared with total income in the preceding projected year.",
    },
    {
      id: "projected-estate-multiple",
      label: "Final net worth / projected spending",
      value: estateMultiple,
      explanation:
        "Projected net worth at the end of the planning period divided by the model's total projected retirement spending.",
    },
    {
      id: "retirement-income",
      label: "Projected total income before tax at retirement",
      value: facts.retirementYear
        ? facts.retirementYear.totalIncome.toLocaleString("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0,
          })
        : "Not available",
      explanation:
        "Total income recorded in the projected year at your planned retirement age.",
    },
  ];
}

function riskLevelForInflation(rate: number): "low" | "moderate" | "high" {
  if (rate >= 0.05) {
    return "high";
  }
  if (rate >= 0.03) {
    return "moderate";
  }
  return "low";
}

function createRisks(facts: PlanningFacts): PlanningRisk[] {
  const assetsRunOutAge = facts.projection.summary.ageAssetsRunOut;
  const longevityLevel =
    assetsRunOutAge === null
      ? "low"
      : assetsRunOutAge < facts.lifeExpectancy
        ? "high"
        : "moderate";
  const liquidityLevel =
    facts.cashReserveYears === null
      ? "not-assessed"
      : facts.cashReserveYears < 0.25
        ? "high"
        : facts.cashReserveYears < 0.5
          ? "moderate"
          : "low";

  return [
    {
      id: "longevity",
      title: "Longevity risk",
      level: longevityLevel,
      description:
        assetsRunOutAge === null
          ? `No shortfall is projected before the planning horizon at age ${facts.lifeExpectancy}.`
          : `The first shortfall is projected at age ${assetsRunOutAge}; your planning horizon ends at age ${facts.lifeExpectancy}.`,
      explanation:
        "This rating compares the modeled first shortfall age with your selected life expectancy; it does not assess living beyond that age.",
      dataSource: "RetirementSummary.ageAssetsRunOut and life expectancy.",
    },
    {
      id: "inflation",
      title: "Inflation risk",
      level: riskLevelForInflation(facts.plan.assumptions.inflationRate),
      description: `Your general inflation assumption is ${(facts.plan.assumptions.inflationRate * 100).toFixed(1)}% per year.`,
      explanation:
        "The Low, Moderate, and High labels are review thresholds for the input assumption, not a forecast of inflation.",
      dataSource: "RetirementPlan.assumptions.inflationRate.",
    },
    {
      id: "sequence",
      title: "Sequence risk",
      level: "not-assessed",
      description:
        "This deterministic projection does not test the effect of poor returns early in retirement.",
      explanation:
        "A separate return-order or stochastic stress test would be needed to assess sequence risk.",
      dataSource: "No sequence-of-returns simulation is included in ProjectionResult.",
    },
    {
      id: "liquidity",
      title: "Liquidity risk",
      level: liquidityLevel,
      description:
        facts.cashReserveYears === null
          ? "A cash reserve comparison is unavailable because projected retirement spending is zero or no retirement year exists."
          : `Projected cash covers about ${facts.cashReserveYears.toFixed(1)} years of spending and mortgage payments at retirement.`,
      explanation:
        "This is a cash-only proxy. It does not evaluate account access rules, market conditions, or other liquid assets.",
      dataSource:
        "ProjectionYear.cashValue, spending, and mortgagePayment at retirement.",
    },
    {
      id: "concentration",
      title: "Concentration risk",
      level: "not-assessed",
      description:
        "The planner tracks account types, but not the underlying investments held inside them.",
      explanation:
        "Investment concentration cannot be rated without security- or fund-level holdings.",
      dataSource:
        "No underlying investment allocation data is available in RetirementPlan.",
    },
  ];
}

export function analyzePlanning(input: InsightInput): PlanningAnalysis {
  const facts = createPlanningFacts(input);
  const health = assessHealth(facts);
  const readiness = assessReadiness(health);
  const insights = ruleBasedInsights(facts);

  return {
    insights,
    health,
    readiness,
    metrics: createMetrics(facts),
    risks: createRisks(facts),
    opportunities: insights.filter(
      (insight) => insight.category === "opportunity",
    ),
  };
}

export function generateInsights(input: InsightInput): PlanningInsight[] {
  return ruleBasedInsights(createPlanningFacts(input));
}
