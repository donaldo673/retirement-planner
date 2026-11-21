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
  plan.assets.gia = { currentValue: 500, costBasis: 500, monthlyContribution: 0 };
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
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: 0,
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
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
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
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: 0,
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

  assert.ok(Math.abs(projection.effectiveAssumptions.isaRealReturn - 0.005) < 1e-12);
  assert.equal(plan.assumptions.isaRealReturn, 0.025);
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
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: 0,
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
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
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
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: 0,
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

test("second employment and generated investment income flow through tax", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    currentAge: 40,
    retirementAge: 41,
    lifeExpectancy: 42,
    statePensionAge: 120,
    householdType: "single",
  };
  plan.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = {
    currentValue: 20_000,
    costBasis: 20_000,
    monthlyContribution: 0,
  };
  plan.assets.cash = { currentValue: 0 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 42,
  };
  plan.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    workUntilAge: 40,
  };
  plan.income.secondEmployment = {
    currentSalary: 20_000,
    annualSalaryGrowthRate: 0,
    startAge: 40,
    endAge: 41,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [];
  plan.assumptions = {
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0.01,
    giaDividendRealYield: 0.02,
    giaCapitalGrowthRealYield: 0.03,
    cashInterestRealYield: 0,
    inflationRate: 0,
  };

  const year = calculateProjection(plan).yearlyResults[1];

  assert.equal(year.secondSalaryIncome, 20_000);
  assert.ok(Math.abs(year.interestIncome - 200) < 1e-10);
  assert.ok(Math.abs(year.dividendIncome - 400) < 1e-10);
  assert.equal(year.giaValue, 20_600);
  assert.ok(Math.abs(year.tax.nationalInsurance - 594.4) < 1e-10);
  assert.ok(year.tax.totalTax > year.tax.nationalInsurance);
});

test("pension withdrawals gross up to cover spending after income tax", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    currentAge: 65,
    retirementAge: 66,
    lifeExpectancy: 67,
    statePensionAge: 120,
    householdType: "single",
  };
  plan.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.pension = { currentValue: 30_000, monthlyContribution: 0 };
  plan.assets.gia = {
    currentValue: 0,
    costBasis: 0,
    monthlyContribution: 0,
  };
  plan.assets.cash = { currentValue: 0 };
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
  plan.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [
    {
      id: "essential",
      name: "Essential spending",
      annualAmount: 20_000,
      inflationRate: 0,
      startAge: 65,
      endAge: 66,
    },
  ];
  plan.assumptions = {
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: 0,
    inflationRate: 0,
  };

  const year = calculateProjection(plan).yearlyResults[1];

  assert.ok(Math.abs(year.pensionDrawdownIncome - 21_857.5) < 0.01);
  assert.ok(Math.abs(year.tax.incomeTax - 1_857.5) < 0.01);
  assert.ok(Math.abs(year.netCashflow) < 0.01);
  assert.equal(year.unfundedShortfall, 0);
});

test("selling GIA investments realizes proportional gains and includes CGT", () => {
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
  plan.assets.gia = {
    currentValue: 20_000,
    costBasis: 10_000,
    monthlyContribution: 0,
  };
  plan.assets.cash = { currentValue: 0 };
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
  plan.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [
    {
      id: "essential",
      name: "Essential spending",
      annualAmount: 10_000,
      inflationRate: 0,
      startAge: 65,
      endAge: 66,
    },
  ];
  plan.assumptions = {
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: 0,
    inflationRate: 0,
  };
  plan.withdrawalOrder = ["gia", "cash", "isa", "pension"];

  const year = calculateProjection(plan).yearlyResults[1];

  assert.ok(year.realizedCapitalGains > 5_000);
  assert.ok(year.tax.capitalGainsTax > 360);
  assert.equal(year.unfundedShortfall, 0);
});

test("negative real cash yields are accepted and reduce projected cash", () => {
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
  plan.assets.gia = {
    currentValue: 0,
    costBasis: 0,
    monthlyContribution: 0,
  };
  plan.assets.cash = { currentValue: 1_000 };
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
  plan.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 65,
  };
  plan.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.income.statePension = { annualAmount: 0 };
  plan.spending.buckets = [];
  plan.assumptions = {
    isaRealReturn: 0,
    pensionRealReturn: 0,
    giaInterestRealYield: 0,
    giaDividendRealYield: 0,
    giaCapitalGrowthRealYield: 0,
    cashInterestRealYield: -0.05,
    inflationRate: 0.025,
  };

  const year = calculateProjection(plan).yearlyResults[1];

  assert.ok(Math.abs(year.interestIncome + 26.25) < 1e-10);
  assert.ok(Math.abs(year.cashValue - 973.75) < 1e-6);
  assert.equal(year.tax.totalTax, 0);
});
