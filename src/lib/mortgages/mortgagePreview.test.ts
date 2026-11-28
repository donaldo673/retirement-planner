import assert from "node:assert/strict";
import test from "node:test";
import { createSampleRetirementPlan } from "../../data/sample-plan";
import {
  calculateNetMonthlyRentalProfit,
  estimateMortgagePayoffAge,
  getAssumedFutureMortgageRate,
} from "./mortgagePreview";
import { savedPlanSchema } from "../validation/retirement-plan-schema";

test("legacy saved plans receive mortgage and property defaults", () => {
  const legacyWithdrawalOrder = ["gia", "cash", "pension", "isa"];
  const legacyPlan = Object.fromEntries(
    Object.entries(createSampleRetirementPlan()).filter(
      ([key]) =>
        key !== "mortgageConfiguration" && key !== "propertyInformation",
    ),
  );
  legacyPlan.taxSettings = { jurisdiction: "england" };
  legacyPlan.withdrawalOrder = legacyWithdrawalOrder;
  legacyPlan.people.person1.income.secondEmployment = {
    ...legacyPlan.people.person1.income.secondEmployment,
  };
  delete legacyPlan.people.person1.income.secondEmployment.startAtRetirementAge;
  const [essential, legacyTravel, ...remainingBuckets] =
    legacyPlan.spending.buckets;
  legacyPlan.spending.buckets = [
    essential,
    { ...legacyTravel },
    ...remainingBuckets,
  ];
  delete legacyPlan.spending.buckets[1].classification;
  delete legacyPlan.spending.buckets[1].startAge;
  delete legacyPlan.spending.discretionaryReductionAfterRetirement;
  delete legacyPlan.spending.discretionarySpendingAdjustmentPercent;

  const parsed = savedPlanSchema.parse({
    version: 1,
    savedAt: new Date().toISOString(),
    plan: legacyPlan,
  });

  assert.equal(parsed.plan.mortgageConfiguration.name, "Main residence");
  assert.equal(parsed.plan.mortgageConfiguration.repaymentType, "repayment");
  assert.equal(parsed.plan.propertyInformation.estimatedValue, 300_000);
  assert.equal(parsed.plan.taxSettings.minimumCashReserve, 10_000);
  assert.equal(
    parsed.plan.people.person1.income.secondEmployment.startAtRetirementAge,
    true,
  );
  assert.equal(parsed.plan.people.person1.income.secondEmployment.startAge, 45);
  assert.equal(
    parsed.plan.spending.buckets[1].classification,
    "discretionary",
  );
  assert.equal(parsed.plan.spending.buckets[1].startAge, 45);
  assert.equal(parsed.plan.spending.discretionarySpendingAdjustmentPercent, 100);
  const legacySpendingWithReduction = { ...legacyPlan.spending };
  delete legacySpendingWithReduction.discretionarySpendingAdjustmentPercent;
  const legacyAdjustment = savedPlanSchema.parse({
    version: 1,
    savedAt: new Date().toISOString(),
    plan: {
      ...legacyPlan,
      spending: {
        ...legacySpendingWithReduction,
        discretionaryReductionAfterRetirement: 25,
      },
    },
  });
  assert.equal(
    legacyAdjustment.plan.spending.discretionarySpendingAdjustmentPercent,
    75,
  );
  assert.deepEqual(
    parsed.plan.taxSettings.withdrawalPriority,
    legacyWithdrawalOrder,
  );
});

test("future mortgage rate respects remortgage and rate method selections", () => {
  const plan = createSampleRetirementPlan();
  const mortgage = plan.assets.mortgage;
  const configuration = plan.mortgageConfiguration;

  configuration.assumeRemortgage = false;
  assert.equal(
    getAssumedFutureMortgageRate(mortgage, configuration),
    mortgage.interestRate,
  );

  configuration.assumeRemortgage = true;
  assert.equal(
    getAssumedFutureMortgageRate(mortgage, configuration),
    configuration.baseRate + configuration.margin,
  );

  configuration.futureRateMethod = "manual-rate";
  assert.equal(
    getAssumedFutureMortgageRate(mortgage, configuration),
    configuration.futureMortgageRate,
  );
});

test("illustrative payoff estimate includes overpayments and excludes interest-only", () => {
  const plan = createSampleRetirementPlan();
  const mortgage = {
    outstandingBalance: 100_000,
    interestRate: 0.03,
    monthlyPayment: 1_000,
    mortgageEndAge: 80,
  };
  const configuration = {
    ...plan.mortgageConfiguration,
    currentFixedRate: 0.03,
    fixedMonthsRemaining: 0,
    assumeRemortgage: false,
    annualMortgageOverpaymentTarget: 3_000,
    repaymentType: "repayment" as const,
  };
  const payoffWithoutOverpayments = estimateMortgagePayoffAge(
    mortgage,
    configuration,
    40,
    false,
  );
  const payoffWithOverpayments = estimateMortgagePayoffAge(
    mortgage,
    configuration,
    40,
    true,
  );

  assert.ok(payoffWithoutOverpayments !== null);
  assert.ok(payoffWithOverpayments !== null);
  assert.ok(payoffWithOverpayments < payoffWithoutOverpayments);
  assert.equal(
    estimateMortgagePayoffAge(
      mortgage,
      { ...configuration, repaymentType: "interest-only" },
      40,
      true,
    ),
    null,
  );
});

test("buy-to-let net profit deducts void allowance and operating costs", () => {
  const configuration = {
    ...createSampleRetirementPlan().mortgageConfiguration,
    rentalIncome: 1_500,
    managementCosts: 150,
    maintenanceCosts: 100,
    voidPeriodAllowance: 0.1,
  };

  assert.equal(calculateNetMonthlyRentalProfit(configuration), 1_100);
});
