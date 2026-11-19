import assert from "node:assert/strict";
import test from "node:test";
import { createSampleRetirementPlan } from "../../data/sample-plan";
import { calculateProjection } from "./retirement-engine";

test("projection includes an opening snapshot and all ages through life expectancy", () => {
  const plan = createSampleRetirementPlan();
  const projection = calculateProjection(plan);

  assert.equal(
    projection.yearlyResults.length,
    plan.personalDetails.lifeExpectancy - plan.personalDetails.currentAge + 1,
  );
  assert.equal(projection.yearlyResults[0].age, plan.personalDetails.currentAge);
  assert.equal(
    projection.yearlyResults[0].netWorth,
    projection.summary.currentNetWorth,
  );
  assert.equal(
    projection.yearlyResults[projection.yearlyResults.length - 1].age,
    plan.personalDetails.lifeExpectancy,
  );
});

test("deficits use the configured withdrawal order and report any shortfall", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    currentAge: 65,
    retirementAge: 66,
    lifeExpectancy: 68,
    statePensionAge: 120,
    householdType: "single",
  };
  plan.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 500, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 1_000 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 68,
  };
  plan.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    workUntilAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [
    {
      id: "essential",
      name: "Essential spending",
      annualAmount: 1_700,
      inflationRate: 0,
      startAge: 65,
      endAge: 68,
    },
  ];
  plan.assumptions = {
    isaReturn: 0,
    pensionReturn: 0,
    giaReturn: 0,
    cashReturn: 0,
    inflationRate: 0,
  };

  const projection = calculateProjection(plan);
  const firstRetirementYear = projection.yearlyResults[1];

  assert.equal(firstRetirementYear.withdrawals.cashWithdrawal, 1_000);
  assert.equal(firstRetirementYear.withdrawals.giaWithdrawal, 500);
  assert.equal(firstRetirementYear.unfundedShortfall, 200);
  assert.equal(projection.summary.ageAssetsRunOut, 66);
  assert.equal(projection.summary.status, "red");
});

test("mortgage maturity clears the remaining balance and charges the payoff", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    currentAge: 65,
    retirementAge: 66,
    lifeExpectancy: 67,
    statePensionAge: 120,
    householdType: "single",
  };
  plan.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 2_000 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 1_000,
    interestRate: 0,
    monthlyPayment: 100,
    mortgageEndAge: 66,
  };
  plan.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    workUntilAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [];
  plan.assumptions = {
    isaReturn: 0,
    pensionReturn: 0,
    giaReturn: 0,
    cashReturn: 0,
    inflationRate: 0,
  };

  const yearAtAge66 = calculateProjection(plan).yearlyResults[1];

  assert.equal(yearAtAge66.mortgagePayment, 1_000);
  assert.equal(yearAtAge66.mortgageBalance, 0);
  assert.equal(yearAtAge66.cashValue, 1_000);
});

test("scenarios adjust returns without mutating plan assumptions", () => {
  const plan = createSampleRetirementPlan();
  const projection = calculateProjection(plan, "conservative");

  assert.ok(Math.abs(projection.effectiveAssumptions.isaReturn - 0.03) < 1e-12);
  assert.equal(plan.assumptions.isaReturn, 0.05);
});

test("non-salary income is uprated with inflation from the current age", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    currentAge: 65,
    retirementAge: 66,
    lifeExpectancy: 67,
    statePensionAge: 66,
    householdType: "single",
  };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 67,
  };
  plan.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    workUntilAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 100, otherIncome: 100 };
  plan.income.statePension = { annualAmount: 100 };
  plan.spending.buckets = [];
  plan.assumptions = {
    isaReturn: 0,
    pensionReturn: 0,
    giaReturn: 0,
    cashReturn: 0,
    inflationRate: 0.1,
  };

  const projection = calculateProjection(plan);
  const yearAtAge67 = projection.yearlyResults[2];

  assert.ok(Math.abs(yearAtAge67.rentalIncome - 110) < 1e-12);
  assert.ok(Math.abs(yearAtAge67.otherIncome - 110) < 1e-12);
  assert.ok(Math.abs(yearAtAge67.statePensionIncome - 110) < 1e-12);
});

test("final estate below £50,000 is amber; exactly £50,000 is green", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    currentAge: 65,
    retirementAge: 66,
    lifeExpectancy: 67,
    statePensionAge: 120,
    householdType: "single",
  };
  plan.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 49_999 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 67,
  };
  plan.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    workUntilAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [];
  plan.assumptions = {
    isaReturn: 0,
    pensionReturn: 0,
    giaReturn: 0,
    cashReturn: 0,
    inflationRate: 0,
  };

  assert.equal(calculateProjection(plan).summary.status, "amber");
  plan.assets.cash.currentValue = 50_000;
  assert.equal(calculateProjection(plan).summary.status, "green");
});

test("invalid age ordering is rejected", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails.retirementAge = plan.personalDetails.currentAge;

  assert.throws(() => calculateProjection(plan), /current age < retirement age/);
});
