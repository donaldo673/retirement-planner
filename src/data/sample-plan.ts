import type { RetirementPlan, Scenario } from "@/types/retirement";

export const SCENARIO_OPTIONS: readonly Scenario[] = [
  { name: "conservative", returnAdjustment: -0.02 },
  { name: "expected", returnAdjustment: 0 },
  { name: "optimistic", returnAdjustment: 0.02 },
];

export function createSampleRetirementPlan(): RetirementPlan {
  return {
    personalDetails: {
      currentAge: 45,
      retirementAge: 67,
      lifeExpectancy: 95,
      statePensionAge: 67,
      householdType: "single",
    },
    assets: {
      isa: { currentValue: 85_000, monthlyContribution: 500 },
      pension: { currentValue: 220_000, monthlyContribution: 1_200 },
      gia: { currentValue: 40_000, monthlyContribution: 100 },
      cash: { currentValue: 25_000 },
      otherAssets: { currentValue: 20_000 },
      mortgage: {
        outstandingBalance: 120_000,
        interestRate: 0.0425,
        monthlyPayment: 1_100,
        mortgageEndAge: 60,
      },
    },
    income: {
      employment: {
        currentSalary: 65_000,
        annualSalaryGrowthRate: 0.03,
        workUntilAge: 67,
      },
      otherIncome: {
        rentalIncome: 0,
        otherIncome: 0,
      },
      statePension: {
        annualAmount: 11_973,
      },
    },
    spending: {
      buckets: [
        {
          id: "essential",
          name: "Essential spending",
          annualAmount: 30_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
        {
          id: "travel",
          name: "Travel",
          annualAmount: 6_000,
          inflationRate: 0.025,
          startAge: 67,
          endAge: 80,
        },
        {
          id: "vehicle",
          name: "Vehicle costs",
          annualAmount: 3_500,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 85,
        },
        {
          id: "property-maintenance",
          name: "Property maintenance",
          annualAmount: 2_500,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
        {
          id: "healthcare",
          name: "Healthcare",
          annualAmount: 2_000,
          inflationRate: 0.025,
          startAge: 65,
          endAge: 95,
        },
        {
          id: "lifestyle",
          name: "Lifestyle",
          annualAmount: 8_000,
          inflationRate: 0.025,
          startAge: 67,
          endAge: 95,
        },
        {
          id: "other",
          name: "Other",
          annualAmount: 3_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
      ],
    },
    assumptions: {
      isaReturn: 0.05,
      pensionReturn: 0.05,
      giaReturn: 0.05,
      cashReturn: 0.02,
      inflationRate: 0.025,
    },
    scenario: "expected",
    withdrawalOrder: ["cash", "gia", "isa", "pension"],
  };
}
