import type {
  Assumptions,
  ContributionBreakdown,
  ProjectionResult,
  ProjectionYear,
  RetirementPlan,
  RetirementSummary,
  ScenarioType,
  WithdrawalBreakdown,
  WithdrawalSource,
} from "@/types/retirement";

const MONTHS_PER_YEAR = 12;
const MONEY_EPSILON = 0.000001;
const SMALL_ESTATE_THRESHOLD = 50_000;
const FINANCIAL_INDEPENDENCE_MULTIPLE = 25;

const SCENARIO_RETURN_ADJUSTMENTS: Record<ScenarioType, number> = {
  conservative: -0.02,
  expected: 0,
  optimistic: 0.02,
};

interface AccountBalances {
  isa: number;
  pension: number;
  gia: number;
  cash: number;
}

interface MortgageYear {
  balance: number;
  payment: number;
}

interface AnnualIncome {
  salary: number;
  rental: number;
  other: number;
  statePension: number;
}

function assertFiniteNonNegative(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite, non-negative number.`);
  }
}

function assertAnnualRate(label: string, value: number): void {
  if (!Number.isFinite(value) || value < -1) {
    throw new RangeError(`${label} must be a finite rate greater than or equal to -100%.`);
  }
}

function assertAge(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative whole number.`);
  }
}

export function validateRetirementPlan(plan: RetirementPlan): void {
  const { personalDetails, assets, income, spending, assumptions, withdrawalOrder } =
    plan;

  assertAge("Current age", personalDetails.currentAge);
  assertAge("Retirement age", personalDetails.retirementAge);
  assertAge("Life expectancy", personalDetails.lifeExpectancy);
  assertAge("State Pension age", personalDetails.statePensionAge);
  assertAge("Work-until age", income.employment.workUntilAge);
  assertAge("Mortgage end age", assets.mortgage.mortgageEndAge);

  if (
    personalDetails.currentAge >= personalDetails.retirementAge ||
    personalDetails.retirementAge >= personalDetails.lifeExpectancy
  ) {
    throw new RangeError(
      "A valid plan requires current age < retirement age < life expectancy.",
    );
  }

  if (
    income.employment.workUntilAge < personalDetails.currentAge ||
    income.employment.workUntilAge > personalDetails.lifeExpectancy
  ) {
    throw new RangeError(
      "Work-until age must be between current age and life expectancy.",
    );
  }

  assertFiniteNonNegative("ISA value", assets.isa.currentValue);
  assertFiniteNonNegative("ISA monthly contribution", assets.isa.monthlyContribution);
  assertFiniteNonNegative("Pension value", assets.pension.currentValue);
  assertFiniteNonNegative(
    "Pension monthly contribution",
    assets.pension.monthlyContribution,
  );
  assertFiniteNonNegative("GIA value", assets.gia.currentValue);
  assertFiniteNonNegative("GIA monthly contribution", assets.gia.monthlyContribution);
  assertFiniteNonNegative("Cash value", assets.cash.currentValue);
  assertFiniteNonNegative("Other assets value", assets.otherAssets.currentValue);
  assertFiniteNonNegative("Mortgage balance", assets.mortgage.outstandingBalance);
  assertFiniteNonNegative("Mortgage monthly payment", assets.mortgage.monthlyPayment);
  assertFiniteNonNegative("Current salary", income.employment.currentSalary);
  assertFiniteNonNegative("Rental income", income.otherIncome.rentalIncome);
  assertFiniteNonNegative("Other income", income.otherIncome.otherIncome);
  assertFiniteNonNegative(
    "State Pension amount",
    income.statePension.annualAmount,
  );

  assertFiniteNonNegative("Mortgage interest rate", assets.mortgage.interestRate);
  assertAnnualRate(
    "Annual salary growth rate",
    income.employment.annualSalaryGrowthRate,
  );
  assertAnnualRate("ISA return", assumptions.isaReturn);
  assertAnnualRate("Pension return", assumptions.pensionReturn);
  assertAnnualRate("GIA return", assumptions.giaReturn);
  assertAnnualRate("Cash return", assumptions.cashReturn);
  assertAnnualRate("Inflation rate", assumptions.inflationRate);

  const bucketIds = new Set<string>();
  for (const bucket of spending.buckets) {
    if (!bucket.id.trim() || !bucket.name.trim() || bucketIds.has(bucket.id)) {
      throw new RangeError("Spending buckets must have unique IDs and non-empty names.");
    }
    bucketIds.add(bucket.id);
    assertFiniteNonNegative(`${bucket.name} annual amount`, bucket.annualAmount);
    assertAnnualRate(`${bucket.name} inflation rate`, bucket.inflationRate);
    assertAge(`${bucket.name} start age`, bucket.startAge);
    assertAge(`${bucket.name} end age`, bucket.endAge);
    if (bucket.startAge > bucket.endAge) {
      throw new RangeError(`${bucket.name} start age must not exceed its end age.`);
    }
  }

  const requiredSources: WithdrawalSource[] = ["cash", "gia", "isa", "pension"];
  if (
    withdrawalOrder.length !== requiredSources.length ||
    new Set(withdrawalOrder).size !== requiredSources.length ||
    requiredSources.some((source) => !withdrawalOrder.includes(source))
  ) {
    throw new RangeError(
      "Withdrawal order must contain cash, GIA, ISA, and pension exactly once.",
    );
  }
}

function applyScenario(
  assumptions: Assumptions,
  scenario: ScenarioType,
): Assumptions {
  const adjustment = SCENARIO_RETURN_ADJUSTMENTS[scenario];
  const effectiveAssumptions: Assumptions = {
    ...assumptions,
    isaReturn: assumptions.isaReturn + adjustment,
    pensionReturn: assumptions.pensionReturn + adjustment,
    giaReturn: assumptions.giaReturn + adjustment,
    cashReturn: assumptions.cashReturn + adjustment,
  };

  assertAnnualRate("Scenario ISA return", effectiveAssumptions.isaReturn);
  assertAnnualRate("Scenario pension return", effectiveAssumptions.pensionReturn);
  assertAnnualRate("Scenario GIA return", effectiveAssumptions.giaReturn);
  assertAnnualRate("Scenario cash return", effectiveAssumptions.cashReturn);

  return effectiveAssumptions;
}

function calculateSpending(plan: RetirementPlan, age: number): number {
  return plan.spending.buckets.reduce((total, bucket) => {
    if (age < bucket.startAge || age > bucket.endAge) {
      return total;
    }

    const yearsInflated = age - bucket.startAge;
    return (
      total +
      bucket.annualAmount * (1 + bucket.inflationRate) ** yearsInflated
    );
  }, 0);
}

function calculateAnnualIncome(plan: RetirementPlan, age: number): AnnualIncome {
  const { personalDetails } = plan;
  const employment = plan.income.employment;
  const yearsFromToday = age - personalDetails.currentAge;
  const inflationFactor =
    (1 + plan.assumptions.inflationRate) ** yearsFromToday;
  const salary =
    age < employment.workUntilAge
      ? employment.currentSalary *
        (1 + employment.annualSalaryGrowthRate) ** yearsFromToday
      : 0;
  const statePension =
    age >= personalDetails.statePensionAge
      ? plan.income.statePension.annualAmount *
        inflationFactor
      : 0;

  return {
    salary,
    rental: plan.income.otherIncome.rentalIncome * inflationFactor,
    other: plan.income.otherIncome.otherIncome * inflationFactor,
    statePension,
  };
}

function calculateMortgageYear(
  mortgageBalance: number,
  plan: RetirementPlan,
  periodStartAge: number,
): MortgageYear {
  const mortgage = plan.assets.mortgage;
  if (mortgageBalance <= MONEY_EPSILON) {
    return { balance: 0, payment: 0 };
  }

  if (periodStartAge >= mortgage.mortgageEndAge) {
    return { balance: 0, payment: mortgageBalance };
  }

  let balance = mortgageBalance;
  let payment = 0;
  const monthlyRate = mortgage.interestRate / MONTHS_PER_YEAR;

  for (let month = 0; month < MONTHS_PER_YEAR && balance > MONEY_EPSILON; month += 1) {
    balance += balance * monthlyRate;
    const monthlyPayment = Math.min(balance, mortgage.monthlyPayment);
    balance -= monthlyPayment;
    payment += monthlyPayment;
  }

  if (periodStartAge + 1 >= mortgage.mortgageEndAge && balance > MONEY_EPSILON) {
    payment += balance;
    balance = 0;
  }

  return {
    balance: balance <= MONEY_EPSILON ? 0 : balance,
    payment,
  };
}

function calculateCurrentNetWorth(plan: RetirementPlan): number {
  const { assets } = plan;
  return (
    assets.isa.currentValue +
    assets.pension.currentValue +
    assets.gia.currentValue +
    assets.cash.currentValue +
    assets.otherAssets.currentValue -
    assets.mortgage.outstandingBalance
  );
}

function calculateInvestedAssets(balances: AccountBalances): number {
  return balances.isa + balances.pension + balances.gia;
}

function calculateNetWorth(
  balances: AccountBalances,
  otherAssetsValue: number,
  mortgageBalance: number,
): number {
  return (
    balances.isa +
    balances.pension +
    balances.gia +
    balances.cash +
    otherAssetsValue -
    mortgageBalance
  );
}

function createZeroContributions(): ContributionBreakdown {
  return {
    isaContribution: 0,
    pensionContribution: 0,
    giaContribution: 0,
  };
}

function createZeroWithdrawals(): WithdrawalBreakdown {
  return {
    cashWithdrawal: 0,
    giaWithdrawal: 0,
    isaWithdrawal: 0,
    pensionWithdrawal: 0,
  };
}

function createSnapshot(
  age: number,
  periodStartAge: number,
  balances: AccountBalances,
  otherAssetsValue: number,
  mortgageBalance: number,
  values: Partial<ProjectionYear> = {},
): ProjectionYear {
  return {
    age,
    periodStartAge,
    salaryIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    statePensionIncome: 0,
    totalIncome: 0,
    spending: 0,
    mortgagePayment: 0,
    mortgageBalance,
    contributions: createZeroContributions(),
    withdrawals: createZeroWithdrawals(),
    unfundedShortfall: 0,
    investmentGrowth: 0,
    netCashflow: 0,
    isaValue: balances.isa,
    pensionValue: balances.pension,
    giaValue: balances.gia,
    cashValue: balances.cash,
    otherAssetsValue,
    totalInvestedAssets: calculateInvestedAssets(balances),
    netWorth: calculateNetWorth(balances, otherAssetsValue, mortgageBalance),
    ...values,
  };
}

function calculateInvestmentGrowth(
  balances: AccountBalances,
  assumptions: Assumptions,
): { balances: AccountBalances; growth: number } {
  const isaGrowth = balances.isa * assumptions.isaReturn;
  const pensionGrowth = balances.pension * assumptions.pensionReturn;
  const giaGrowth = balances.gia * assumptions.giaReturn;
  const cashGrowth = balances.cash * assumptions.cashReturn;

  return {
    balances: {
      isa: balances.isa + isaGrowth,
      pension: balances.pension + pensionGrowth,
      gia: balances.gia + giaGrowth,
      cash: balances.cash + cashGrowth,
    },
    growth: isaGrowth + pensionGrowth + giaGrowth + cashGrowth,
  };
}

function addContributions(
  balances: AccountBalances,
  plan: RetirementPlan,
  periodStartAge: number,
  availableCashflow: number,
): { balances: AccountBalances; contributions: ContributionBreakdown } {
  const employment = plan.income.employment;
  if (periodStartAge >= employment.workUntilAge || availableCashflow <= 0) {
    return { balances, contributions: createZeroContributions() };
  }

  const scheduledContributions = {
    isaContribution: plan.assets.isa.monthlyContribution * MONTHS_PER_YEAR,
    pensionContribution:
      plan.assets.pension.monthlyContribution * MONTHS_PER_YEAR,
    giaContribution: plan.assets.gia.monthlyContribution * MONTHS_PER_YEAR,
  };
  const scheduledTotal = Object.values(scheduledContributions).reduce(
    (total, amount) => total + amount,
    0,
  );
  if (scheduledTotal === 0) {
    return { balances, contributions: scheduledContributions };
  }

  const scale = Math.min(1, availableCashflow / scheduledTotal);
  const contributions: ContributionBreakdown = {
    isaContribution: scheduledContributions.isaContribution * scale,
    pensionContribution: scheduledContributions.pensionContribution * scale,
    giaContribution: scheduledContributions.giaContribution * scale,
  };

  return {
    balances: {
      isa: balances.isa + contributions.isaContribution,
      pension: balances.pension + contributions.pensionContribution,
      gia: balances.gia + contributions.giaContribution,
      cash: balances.cash,
    },
    contributions,
  };
}

function withdrawFromSource(
  source: WithdrawalSource,
  requestedAmount: number,
  balances: AccountBalances,
  withdrawals: WithdrawalBreakdown,
): number {
  const available = balances[source];
  const amount = Math.min(available, requestedAmount);
  balances[source] = Math.max(0, available - amount);

  switch (source) {
    case "cash":
      withdrawals.cashWithdrawal += amount;
      break;
    case "gia":
      withdrawals.giaWithdrawal += amount;
      break;
    case "isa":
      withdrawals.isaWithdrawal += amount;
      break;
    case "pension":
      withdrawals.pensionWithdrawal += amount;
      break;
  }

  return requestedAmount - amount;
}

function simulateYear(
  plan: RetirementPlan,
  assumptions: Assumptions,
  periodStartAge: number,
  openingBalances: AccountBalances,
  openingMortgageBalance: number,
): ProjectionYear {
  // Returns apply to opening balances; scheduled contributions are added at year-end.
  const growthResult = calculateInvestmentGrowth(openingBalances, assumptions);
  const annualIncome = calculateAnnualIncome(plan, periodStartAge);
  const mortgageYear = calculateMortgageYear(
    openingMortgageBalance,
    plan,
    periodStartAge,
  );
  const spending = calculateSpending(plan, periodStartAge);
  const totalIncome =
    annualIncome.salary +
    annualIncome.rental +
    annualIncome.other +
    annualIncome.statePension;
  const netCashflow = totalIncome - spending - mortgageYear.payment;
  // Contributions are funded from positive cashflow, not from account withdrawals.
  const contributionResult = addContributions(
    growthResult.balances,
    plan,
    periodStartAge,
    netCashflow,
  );
  const balances = contributionResult.balances;
  const totalContributions =
    contributionResult.contributions.isaContribution +
    contributionResult.contributions.pensionContribution +
    contributionResult.contributions.giaContribution;
  let remainingCashflow = netCashflow - totalContributions;

  if (remainingCashflow > 0) {
    balances.cash += remainingCashflow;
    remainingCashflow = 0;
  }

  const withdrawals = createZeroWithdrawals();
  let unfundedShortfall = 0;
  if (remainingCashflow < 0) {
    let remainingNeed = -remainingCashflow;
    for (const source of plan.withdrawalOrder) {
      remainingNeed = withdrawFromSource(
        source,
        remainingNeed,
        balances,
        withdrawals,
      );
      if (remainingNeed <= MONEY_EPSILON) {
        remainingNeed = 0;
        break;
      }
    }
    unfundedShortfall = remainingNeed;
  }

  const accountValues: AccountBalances = {
    isa: balances.isa,
    pension: balances.pension,
    gia: balances.gia,
    cash: balances.cash,
  };
  const snapshot = createSnapshot(
    periodStartAge + 1,
    periodStartAge,
    accountValues,
    plan.assets.otherAssets.currentValue,
    mortgageYear.balance,
  );

  return {
    ...snapshot,
    salaryIncome: annualIncome.salary,
    rentalIncome: annualIncome.rental,
    otherIncome: annualIncome.other,
    statePensionIncome: annualIncome.statePension,
    totalIncome,
    spending,
    mortgagePayment: mortgageYear.payment,
    contributions: contributionResult.contributions,
    withdrawals,
    unfundedShortfall,
    investmentGrowth: growthResult.growth,
    netCashflow,
  };
}

function calculateFinancialIndependenceAge(
  plan: RetirementPlan,
  yearlyResults: ProjectionYear[],
): number | null {
  for (const year of yearlyResults) {
    const age = year.age;
    const spending = calculateSpending(plan, age);
    const mortgagePayment = calculateMortgageYear(
      year.mortgageBalance,
      plan,
      age,
    ).payment;
    const income = calculateAnnualIncome(plan, age);
    const nonEmploymentIncome =
      income.rental + income.other + income.statePension;
    const annualSpendingGap = Math.max(
      0,
      spending + mortgagePayment - nonEmploymentIncome,
    );
    const investableAssets =
      year.totalInvestedAssets + year.cashValue;

    if (
      investableAssets >=
      annualSpendingGap * FINANCIAL_INDEPENDENCE_MULTIPLE
    ) {
      return age;
    }
  }

  return null;
}

function calculateSummary(
  plan: RetirementPlan,
  yearlyResults: ProjectionYear[],
): RetirementSummary {
  const retirementYear = yearlyResults.find(
    (year) => year.age === plan.personalDetails.retirementAge,
  );
  const finalYear = yearlyResults[yearlyResults.length - 1];
  if (!retirementYear || !finalYear) {
    throw new Error("Projection did not include required summary ages.");
  }

  const ageAssetsRunOut =
    yearlyResults.find((year) => year.unfundedShortfall > MONEY_EPSILON)?.age ??
    null;
  const totalRetirementSpending = yearlyResults.reduce((total, year) => {
    return year.periodStartAge >= plan.personalDetails.retirementAge
      ? total + year.spending
      : total;
  }, 0);

  let status: RetirementSummary["status"];
  if (ageAssetsRunOut !== null) {
    status = "red";
  } else if (finalYear.netWorth < SMALL_ESTATE_THRESHOLD) {
    status = "amber";
  } else {
    status = "green";
  }

  return {
    currentNetWorth: calculateCurrentNetWorth(plan),
    retirementNetWorth: retirementYear.netWorth,
    finalEstateValue: finalYear.netWorth,
    ageAssetsRunOut,
    financialIndependenceAge: calculateFinancialIndependenceAge(
      plan,
      yearlyResults,
    ),
    totalRetirementSpending,
    status,
  };
}

/**
 * Returns a pre-tax projection with balances recorded at each age.
 * The opening row matches current inputs; later rows close the prior age-year.
 */
export function calculateProjection(
  plan: RetirementPlan,
  scenario: ScenarioType = plan.scenario,
): ProjectionResult {
  validateRetirementPlan(plan);
  const effectiveAssumptions = applyScenario(plan.assumptions, scenario);
  const balances: AccountBalances = {
    isa: plan.assets.isa.currentValue,
    pension: plan.assets.pension.currentValue,
    gia: plan.assets.gia.currentValue,
    cash: plan.assets.cash.currentValue,
  };
  const yearlyResults: ProjectionYear[] = [
    createSnapshot(
      plan.personalDetails.currentAge,
      plan.personalDetails.currentAge,
      balances,
      plan.assets.otherAssets.currentValue,
      plan.assets.mortgage.outstandingBalance,
    ),
  ];

  let currentBalances = balances;
  let currentMortgageBalance = plan.assets.mortgage.outstandingBalance;

  for (
    let age = plan.personalDetails.currentAge;
    age < plan.personalDetails.lifeExpectancy;
    age += 1
  ) {
    const year = simulateYear(
      plan,
      effectiveAssumptions,
      age,
      currentBalances,
      currentMortgageBalance,
    );
    yearlyResults.push(year);
    currentBalances = {
      isa: year.isaValue,
      pension: year.pensionValue,
      gia: year.giaValue,
      cash: year.cashValue,
    };
    currentMortgageBalance = year.mortgageBalance;
  }

  return {
    scenario,
    effectiveAssumptions,
    yearlyResults,
    summary: calculateSummary(plan, yearlyResults),
  };
}
