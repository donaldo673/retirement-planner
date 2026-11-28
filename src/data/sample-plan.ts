import type { RetirementPlan, Scenario } from "@/types/retirement";

export const SCENARIO_OPTIONS: readonly Scenario[] = [
  { name: "conservative", returnAdjustment: -0.02 },
  { name: "expected", returnAdjustment: 0 },
  { name: "optimistic", returnAdjustment: 0.02 },
];

export function createSampleRetirementPlan(): RetirementPlan {
  return {
    personalDetails: {
      retirementAge: 67,
      lifeExpectancy: 95,
      householdType: "single",
    },
    assets: {
      gia: { currentValue: 40_000, costBasis: 40_000, monthlyContribution: 100 },
      cash: { currentValue: 25_000 },
      otherAssets: { currentValue: 20_000 },
      mortgage: {
        outstandingBalance: 120_000,
        interestRate: 0.0425,
        monthlyPayment: 1_100,
        mortgageEndAge: 60,
      },
    },
    mortgageConfiguration: {
      name: "Main residence",
      type: "residential",
      currentFixedRate: 0.0425,
      fixedMonthsRemaining: 0,
      assumeRemortgage: true,
      futureRateMethod: "base-plus-margin",
      baseRate: 0.0475,
      margin: 0.005,
      futureMortgageRate: 0.0575,
      monthlyOverpayment: 0,
      annualLumpSumOverpayment: 0,
      repaymentType: "repayment",
      repaymentStrategy: "sale-of-property",
      rentalIncome: 0,
      managementCosts: 0,
      maintenanceCosts: 0,
      voidPeriodAllowance: 0.05,
    },
    propertyInformation: {
      estimatedValue: 300_000,
      type: "main-residence",
      expectedGrowthRate: 0.025,
      futureSaleAge: 0,
      downsizeAge: 0,
      equityReleaseAge: 0,
      notes: "",
    },
    people: {
      person1: {
        income: {
          currentAge: 45,
          statePensionAge: 67,
          employment: {
            currentSalary: 65_000,
            annualSalaryGrowthRate: 0.03,
          },
          secondEmployment: {
            currentSalary: 0,
            annualSalaryGrowthRate: 0,
            startAge: 45,
            startAtRetirementAge: true,
            endAge: 67,
          },
          otherIncome: {
            rentalIncome: 0,
            otherIncome: 0,
          },
          statePension: {
            annualAmount: 11_973,
          },
        },
        assets: {
          isa: { currentValue: 85_000, monthlyContribution: 500 },
          pension: { currentValue: 220_000, monthlyContribution: 1_200 },
        },
      },
      person2: {
        income: {
          currentAge: 43,
          statePensionAge: 67,
          employment: {
            currentSalary: 0,
            annualSalaryGrowthRate: 0,
          },
          secondEmployment: {
            currentSalary: 0,
            annualSalaryGrowthRate: 0,
            startAge: 43,
            startAtRetirementAge: true,
            endAge: 67,
          },
          otherIncome: {
            rentalIncome: 0,
            otherIncome: 0,
          },
          statePension: {
            annualAmount: 0,
          },
        },
        assets: {
          isa: { currentValue: 0, monthlyContribution: 0 },
          pension: { currentValue: 0, monthlyContribution: 0 },
        },
      },
    },
    spending: {
      buckets: [
        {
          id: "essential",
          name: "Essential spending",
          classification: "essential",
          annualAmount: 30_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
        {
          id: "travel",
          name: "Travel",
          classification: "discretionary",
          annualAmount: 6_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 80,
        },
        {
          id: "vehicle",
          name: "Vehicle costs",
          classification: "essential",
          annualAmount: 3_500,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 85,
        },
        {
          id: "property-maintenance",
          name: "Property maintenance",
          classification: "essential",
          annualAmount: 2_500,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
        {
          id: "healthcare",
          name: "Healthcare",
          classification: "essential",
          annualAmount: 2_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
        {
          id: "lifestyle",
          name: "Lifestyle",
          classification: "discretionary",
          annualAmount: 8_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
        {
          id: "other",
          name: "Other",
          classification: "essential",
          annualAmount: 3_000,
          inflationRate: 0.025,
          startAge: 45,
          endAge: 95,
        },
      ],
      discretionarySpendingAdjustmentPercent: 100,
    },
    assumptions: {
      isaRealReturn: 0.025,
      pensionRealReturn: 0.025,
      giaInterestRealYield: 0,
      giaDividendRealYield: 0.015,
      giaCapitalGrowthRealYield: 0.01,
      cashInterestRealYield: -0.005,
      inflationRate: 0.025,
    },
    taxSettings: {
      jurisdiction: "england",
      minimumCashReserve: 10_000,
      optimiseTaxAutomatically: true,
      accumulationPriority: ["pension", "isa", "gia", "cash"],
      withdrawalPriority: ["cash", "gia", "isa", "pension"],
    },
    scenario: "expected",
  };
}
