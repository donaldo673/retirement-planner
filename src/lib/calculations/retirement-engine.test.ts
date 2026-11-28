import assert from "node:assert/strict";
import test from "node:test";
import { createSampleRetirementPlan } from "../../data/sample-plan";
import { calculateProjection } from "./retirement-engine";

test("projection includes an opening snapshot and all ages through life expectancy", () => {
  const plan = createSampleRetirementPlan();
  const projection = calculateProjection(plan);

  assert.equal(
    projection.yearlyResults.length,
    plan.personalDetails.lifeExpectancy -
      plan.people.person1.income.currentAge +
      1,
  );
  assert.equal(
    projection.yearlyResults[0].age,
    plan.people.person1.income.currentAge,
  );
  assert.equal(
    projection.yearlyResults[0].netWorth,
    projection.summary.currentNetWorth,
  );
  assert.equal(
    projection.yearlyResults[projection.yearlyResults.length - 1].age,
    plan.personalDetails.lifeExpectancy,
  );
});

test("employment income ends at retirement age while post-retirement income continues", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 65,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 64;
  plan.people.person1.income.employment = {
    currentSalary: 50_000,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 10_000,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 67,
  };
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = {
    currentValue: 0,
    monthlyContribution: 0,
  };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash.currentValue = 0;
  plan.assets.otherAssets.currentValue = 0;
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 67,
  };
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

  const projection = calculateProjection(plan);

  assert.equal(projection.yearlyResults[1].salaryIncome, 50_000);
  assert.equal(projection.yearlyResults[2].salaryIncome, 0);
  assert.equal(projection.yearlyResults[2].secondSalaryIncome, 10_000);
});

test("projection reports account-level contributions and investment income", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment = {
    currentSalary: 30_000,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 66,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
  plan.people.person1.assets.isa = {
    currentValue: 1_000,
    monthlyContribution: 10,
  };
  plan.people.person1.assets.pension = {
    currentValue: 2_000,
    monthlyContribution: 20,
  };
  plan.assets.gia = {
    currentValue: 3_000,
    costBasis: 3_000,
    monthlyContribution: 30,
  };
  plan.assets.cash.currentValue = 4_000;
  plan.taxSettings.minimumCashReserve = 0;
  plan.taxSettings.optimiseTaxAutomatically = false;
  plan.assets.otherAssets.currentValue = 0;
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 66,
  };
  plan.spending.buckets = [];
  plan.assumptions = {
    isaRealReturn: 0.1,
    pensionRealReturn: 0.2,
    giaInterestRealYield: 0.01,
    giaDividendRealYield: 0.02,
    giaCapitalGrowthRealYield: 0.03,
    cashInterestRealYield: 0.04,
    inflationRate: 0,
  };

  const year = calculateProjection(plan).yearlyResults[1];

  assert.ok(Math.abs(year.accountInvestmentIncome.isa - 100) < 1e-8);
  assert.ok(Math.abs(year.accountInvestmentIncome.pension - 400) < 1e-8);
  assert.ok(Math.abs(year.accountInvestmentIncome.gia - 180) < 1e-8);
  assert.ok(Math.abs(year.accountInvestmentIncome.cash - 160) < 1e-8);
  assert.equal(year.accountNetContributions.isa, 120);
  assert.equal(year.accountNetContributions.pension, 240);
  assert.equal(year.accountNetContributions.gia, 360);
  assert.ok(year.accountNetContributions.cash > 0);
});

test("deficits use the configured withdrawal order and report any shortfall", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 66,
    lifeExpectancy: 68,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 500, costBasis: 500, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 1_000 };
  plan.taxSettings.minimumCashReserve = 0;
  plan.taxSettings.optimiseTaxAutomatically = false;
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 68,
  };
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
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
  assert.equal(firstRetirementYear.accountNetContributions.cash, -1_000);
  assert.equal(firstRetirementYear.accountNetContributions.gia, -500);
  assert.equal(firstRetirementYear.unfundedShortfall, 200);
  assert.equal(projection.summary.ageAssetsRunOut, 66);
  assert.equal(projection.summary.status, "red");
});

test("mortgage maturity clears the remaining balance and charges the payoff", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 2_000 };
  plan.taxSettings.minimumCashReserve = 0;
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 1_000,
    interestRate: 0,
    monthlyPayment: 100,
    mortgageEndAge: 66,
  };
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
  plan.taxSettings.optimiseTaxAutomatically = false;
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

test("configured mortgage overpayments reduce future interest and balance", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 41,
    lifeExpectancy: 42,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 40;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.statePension.annualAmount = 0;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = {
    currentValue: 0,
    monthlyContribution: 0,
  };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash.currentValue = 100_000;
  plan.assets.mortgage = {
    outstandingBalance: 100_000,
    interestRate: 0.12,
    monthlyPayment: 1_000,
    mortgageEndAge: 42,
  };
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

  const baseline = calculateProjection(plan).yearlyResults;
  plan.mortgageConfiguration.monthlyOverpayment = 500;
  plan.mortgageConfiguration.annualLumpSumOverpayment = 5_000;
  const projected = calculateProjection(plan).yearlyResults;
  const withoutOverpayments = baseline[1];
  const withOverpayments = projected[1];

  assert.ok(withOverpayments.mortgagePayment > withoutOverpayments.mortgagePayment);
  assert.ok(withOverpayments.mortgageBalance < withoutOverpayments.mortgageBalance);
  const baselineInterest =
    baseline[2].mortgagePayment -
    (baseline[1].mortgageBalance - baseline[2].mortgageBalance);
  const overpaidInterest =
    projected[2].mortgagePayment -
    (projected[1].mortgageBalance - projected[2].mortgageBalance);
  assert.ok(overpaidInterest < baselineInterest);
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
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 66;
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 67,
  };
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.otherIncome = {
    rentalIncome: 100,
    otherIncome: 100,
  };
  plan.people.person1.income.statePension = { annualAmount: 100 };
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
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 49_999 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 67,
  };
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
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
  plan.personalDetails.retirementAge = plan.people.person1.income.currentAge;

  assert.throws(() => calculateProjection(plan), /current age < retirement age/);
});

test("second / post retirement employment and generated investment income flow through tax", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 41,
    lifeExpectancy: 42,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 40;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
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
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 20_000,
    annualSalaryGrowthRate: 0,
    startAge: 40,
    endAge: 41,
  };
  plan.taxSettings.optimiseTaxAutomatically = false;
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
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
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = {
    currentValue: 30_000,
    monthlyContribution: 0,
  };
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
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 65,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
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
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
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
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 65,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
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
  plan.taxSettings.withdrawalPriority = ["gia", "cash", "isa", "pension"];
  plan.taxSettings.minimumCashReserve = 0;
  plan.taxSettings.optimiseTaxAutomatically = false;

  const year = calculateProjection(plan).yearlyResults[1];

  assert.ok(year.realizedCapitalGains > 5_000);
  assert.ok(year.tax.capitalGainsTax > 360);
  assert.equal(year.unfundedShortfall, 0);
});

test("negative real cash yields are accepted and reduce projected cash", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = {
    currentValue: 0,
    costBasis: 0,
    monthlyContribution: 0,
  };
  plan.assets.cash = { currentValue: 1_000 };
  plan.taxSettings.minimumCashReserve = 0;
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 67,
  };
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 65,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
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

test("joint households calculate tax separately and advance each person's age", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 41,
    lifeExpectancy: 42,
    householdType: "joint",
  };
  plan.people.person1.income.currentAge = 40;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment.currentSalary = 20_000;
  plan.taxSettings.optimiseTaxAutomatically = false;
  plan.people.person2.income.currentAge = 38;
  plan.people.person2.income.statePensionAge = 120;
  plan.people.person2.income.employment.currentSalary = 30_000;
  plan.people.person1.assets.isa = { currentValue: 10_000, monthlyContribution: 0 };
  plan.people.person2.assets.isa = { currentValue: 20_000, monthlyContribution: 0 };
  plan.people.person1.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person2.assets.pension = { currentValue: 0, monthlyContribution: 0 };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 0 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 42,
  };
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

  const projection = calculateProjection(plan);
  const firstYear = projection.yearlyResults[1];

  assert.equal(firstYear.personIncomes.person1.age, 40);
  assert.equal(firstYear.personIncomes.person2.age, 38);
  assert.equal(projection.yearlyResults[2].personIncomes.person1.age, 41);
  assert.equal(projection.yearlyResults[2].personIncomes.person2.age, 39);
  assert.equal(firstYear.personTaxes.person1.grossIncome, 20_000);
  assert.equal(firstYear.personTaxes.person2.grossIncome, 30_000);
  assert.equal(firstYear.tax.grossIncome, 50_000);
  assert.equal(firstYear.personIsaValues.person1, 10_000);
  assert.equal(firstYear.personIsaValues.person2, 20_000);
  assert.equal(
    firstYear.tax.totalTax,
    firstYear.personTaxes.person1.totalTax +
      firstYear.personTaxes.person2.totalTax,
  );
});

test("joint pension withdrawals are allocated proportionally and taxed per person", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 41,
    lifeExpectancy: 42,
    householdType: "joint",
  };
  plan.people.person1.income.currentAge = 40;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment.currentSalary = 0;
  plan.people.person1.income.statePension.annualAmount = 0;
  plan.people.person2.income.currentAge = 38;
  plan.people.person2.income.statePensionAge = 120;
  plan.people.person2.income.employment.currentSalary = 0;
  plan.people.person2.income.statePension.annualAmount = 0;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person2.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = {
    currentValue: 10_000,
    monthlyContribution: 0,
  };
  plan.people.person2.assets.pension = {
    currentValue: 10_000,
    monthlyContribution: 0,
  };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash = { currentValue: 0 };
  plan.assets.otherAssets = { currentValue: 0 };
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 42,
  };
  plan.spending.buckets = [
    {
      id: "essential",
      name: "Essential spending",
      annualAmount: 18_000,
      inflationRate: 0,
      startAge: 40,
      endAge: 41,
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

  assert.ok(
    Math.abs(year.withdrawals.byPerson.person1.pensionWithdrawal - 9_000) <
      0.01,
  );
  assert.ok(
    Math.abs(year.withdrawals.byPerson.person2.pensionWithdrawal - 9_000) <
      0.01,
  );
  assert.equal(year.personTaxes.person1.incomeTax, 0);
  assert.equal(year.personTaxes.person2.incomeTax, 0);
  assert.equal(year.unfundedShortfall, 0);
});

test("automatic accumulation uses pension tax relief and account priority", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 66,
    lifeExpectancy: 67,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 65;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment = {
    currentSalary: 30_000,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.secondEmployment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
    startAge: 65,
    endAge: 66,
  };
  plan.people.person1.income.otherIncome = { rentalIncome: 0, otherIncome: 0 };
  plan.people.person1.income.statePension = { annualAmount: 0 };
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = {
    currentValue: 0,
    monthlyContribution: 0,
  };
  plan.assets.gia = { currentValue: 0, costBasis: 0, monthlyContribution: 0 };
  plan.assets.cash.currentValue = 0;
  plan.assets.otherAssets.currentValue = 0;
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 66,
  };
  plan.spending.buckets = [];
  plan.taxSettings.minimumCashReserve = 0;
  plan.taxSettings.accumulationPriority = ["pension", "isa", "gia", "cash"];
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

  assert.ok(year.contributions.pensionContribution > 25_000);
  assert.equal(year.tax.incomeTax, 0);
  assert.equal(
    year.pensionValue,
    year.contributions.pensionContribution,
  );
});

test("withdrawals preserve the minimum cash reserve before using other accounts", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 46,
    lifeExpectancy: 47,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 45;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.statePension.annualAmount = 0;
  plan.people.person1.assets.isa = { currentValue: 0, monthlyContribution: 0 };
  plan.people.person1.assets.pension = {
    currentValue: 0,
    monthlyContribution: 0,
  };
  plan.assets.gia = {
    currentValue: 20_000,
    costBasis: 20_000,
    monthlyContribution: 0,
  };
  plan.assets.cash.currentValue = 15_000;
  plan.assets.otherAssets.currentValue = 0;
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 47,
  };
  plan.spending.buckets = [
    {
      id: "essential",
      name: "Essential spending",
      annualAmount: 7_000,
      inflationRate: 0,
      startAge: 45,
      endAge: 45,
    },
  ];
  plan.taxSettings.minimumCashReserve = 10_000;
  plan.taxSettings.optimiseTaxAutomatically = false;
  plan.taxSettings.withdrawalPriority = ["cash", "gia", "isa", "pension"];
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

  assert.equal(year.withdrawals.cashWithdrawal, 5_000);
  assert.equal(year.withdrawals.giaWithdrawal, 2_000);
  assert.equal(year.cashValue, 10_000);
  assert.equal(year.unfundedShortfall, 0);
});

test("automatic withdrawal selection avoids unnecessary taxable GIA gains", () => {
  const plan = createSampleRetirementPlan();
  plan.personalDetails = {
    retirementAge: 46,
    lifeExpectancy: 47,
    householdType: "single",
  };
  plan.people.person1.income.currentAge = 45;
  plan.people.person1.income.statePensionAge = 120;
  plan.people.person1.income.employment = {
    currentSalary: 0,
    annualSalaryGrowthRate: 0,
  };
  plan.people.person1.income.statePension.annualAmount = 0;
  plan.people.person1.assets.isa = {
    currentValue: 10_000,
    monthlyContribution: 0,
  };
  plan.people.person1.assets.pension = {
    currentValue: 0,
    monthlyContribution: 0,
  };
  plan.assets.gia = {
    currentValue: 10_000,
    costBasis: 0,
    monthlyContribution: 0,
  };
  plan.assets.cash.currentValue = 0;
  plan.assets.otherAssets.currentValue = 0;
  plan.assets.mortgage = {
    outstandingBalance: 0,
    interestRate: 0,
    monthlyPayment: 0,
    mortgageEndAge: 47,
  };
  plan.spending.buckets = [
    {
      id: "essential",
      name: "Essential spending",
      annualAmount: 10_000,
      inflationRate: 0,
      startAge: 45,
      endAge: 45,
    },
  ];
  plan.taxSettings.minimumCashReserve = 0;
  plan.taxSettings.optimiseTaxAutomatically = true;
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

  assert.equal(year.withdrawals.isaWithdrawal, 10_000);
  assert.equal(year.withdrawals.giaWithdrawal, 0);
  assert.equal(year.tax.capitalGainsTax, 0);
});
