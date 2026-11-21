import type {
  Assumptions,
  ContributionBreakdown,
  ProjectionResult,
  ProjectionYear,
  RetirementPlan,
  RetirementSummary,
  ScenarioType,
  TaxInputs,
  TaxResult,
  WithdrawalBreakdown,
  WithdrawalSource,
} from "@/types/retirement";
import {
  calculateUkTax,
  CURRENT_UK_TAX_YEAR,
} from "./uk-tax";

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
  giaCostBasis: number;
  cash: number;
}

interface MortgageYear {
  balance: number;
  payment: number;
}

interface AnnualIncome {
  age: number;
  salary: number;
  secondSalary: number;
  rental: number;
  other: number;
  statePension: number;
}

interface InvestmentIncome {
  interest: number;
  dividends: number;
  capitalGrowth: number;
  totalGrowth: number;
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
  assertAge("Second employment start age", income.secondEmployment.startAge);
  assertAge("Second employment end age", income.secondEmployment.endAge);
  assertAge("Mortgage end age", assets.mortgage.mortgageEndAge);
  if (
    ![
      "england",
      "scotland",
      "wales",
      "northern-ireland",
    ].includes(plan.taxSettings.jurisdiction)
  ) {
    throw new RangeError("Choose a supported UK tax jurisdiction.");
  }

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
  assertFiniteNonNegative("GIA cost basis", assets.gia.costBasis);
  assertFiniteNonNegative("GIA monthly contribution", assets.gia.monthlyContribution);
  assertFiniteNonNegative("Cash value", assets.cash.currentValue);
  assertFiniteNonNegative("Other assets value", assets.otherAssets.currentValue);
  assertFiniteNonNegative("Mortgage balance", assets.mortgage.outstandingBalance);
  assertFiniteNonNegative("Mortgage monthly payment", assets.mortgage.monthlyPayment);
  assertFiniteNonNegative("Current salary", income.employment.currentSalary);
  assertFiniteNonNegative(
    "Second employment salary",
    income.secondEmployment.currentSalary,
  );
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
  assertAnnualRate(
    "Second employment annual salary growth rate",
    income.secondEmployment.annualSalaryGrowthRate,
  );
  assertAnnualRate("ISA real return", assumptions.isaRealReturn);
  assertAnnualRate("Pension real return", assumptions.pensionRealReturn);
  assertAnnualRate("GIA interest real yield", assumptions.giaInterestRealYield);
  assertAnnualRate("GIA dividend real yield", assumptions.giaDividendRealYield);
  assertAnnualRate(
    "GIA capital growth real yield",
    assumptions.giaCapitalGrowthRealYield,
  );
  assertAnnualRate("Cash interest real yield", assumptions.cashInterestRealYield);
  assertAnnualRate("Inflation rate", assumptions.inflationRate);
  if (income.secondEmployment.startAge > income.secondEmployment.endAge) {
    throw new RangeError(
      "Second employment start age must not exceed its end age.",
    );
  }

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
    isaRealReturn: assumptions.isaRealReturn + adjustment,
    pensionRealReturn: assumptions.pensionRealReturn + adjustment,
    giaInterestRealYield: assumptions.giaInterestRealYield + adjustment,
    giaDividendRealYield: assumptions.giaDividendRealYield + adjustment,
    giaCapitalGrowthRealYield:
      assumptions.giaCapitalGrowthRealYield + adjustment,
    cashInterestRealYield: assumptions.cashInterestRealYield + adjustment,
  };

  assertAnnualRate("Scenario ISA real return", effectiveAssumptions.isaRealReturn);
  assertAnnualRate(
    "Scenario pension real return",
    effectiveAssumptions.pensionRealReturn,
  );
  assertAnnualRate(
    "Scenario GIA interest real yield",
    effectiveAssumptions.giaInterestRealYield,
  );
  assertAnnualRate(
    "Scenario GIA dividend real yield",
    effectiveAssumptions.giaDividendRealYield,
  );
  assertAnnualRate(
    "Scenario GIA capital growth real yield",
    effectiveAssumptions.giaCapitalGrowthRealYield,
  );
  assertAnnualRate(
    "Scenario cash interest real yield",
    effectiveAssumptions.cashInterestRealYield,
  );

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
  const secondEmployment = plan.income.secondEmployment;
  const yearsFromToday = age - personalDetails.currentAge;
  const inflationFactor =
    (1 + plan.assumptions.inflationRate) ** yearsFromToday;
  const salary =
    age < employment.workUntilAge
      ? employment.currentSalary *
        (1 + employment.annualSalaryGrowthRate) ** yearsFromToday
      : 0;
  const secondSalary =
    age >= secondEmployment.startAge && age < secondEmployment.endAge
      ? secondEmployment.currentSalary *
        (1 + secondEmployment.annualSalaryGrowthRate) ** yearsFromToday
      : 0;
  const statePension =
    age >= personalDetails.statePensionAge
      ? plan.income.statePension.annualAmount *
        inflationFactor
      : 0;

  return {
    age,
    salary,
    secondSalary,
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
  taxYear: number,
  balances: AccountBalances,
  otherAssetsValue: number,
  mortgageBalance: number,
  values: Partial<ProjectionYear> = {},
): ProjectionYear {
  return {
    age,
    periodStartAge,
    taxYear,
    salaryIncome: 0,
    secondSalaryIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    statePensionIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    pensionDrawdownIncome: 0,
    realizedCapitalGains: 0,
    totalIncome: 0,
    tax: { incomeTax: 0, nationalInsurance: 0, capitalGainsTax: 0, totalTax: 0 },
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
    giaCostBasis: balances.giaCostBasis,
    cashValue: balances.cash,
    otherAssetsValue,
    totalInvestedAssets: calculateInvestedAssets(balances),
    netWorth: calculateNetWorth(balances, otherAssetsValue, mortgageBalance),
    ...values,
  };
}

function realYieldToNominal(realYield: number, inflationRate: number): number {
  return (1 + realYield) * (1 + inflationRate) - 1;
}

function calculateInvestmentGrowth(
  balances: AccountBalances,
  assumptions: Assumptions,
): { balances: AccountBalances; income: InvestmentIncome } {
  const inflation = assumptions.inflationRate;
  const isaGrowth =
    balances.isa * realYieldToNominal(assumptions.isaRealReturn, inflation);
  const pensionGrowth =
    balances.pension *
    realYieldToNominal(assumptions.pensionRealReturn, inflation);
  const giaInterest =
    balances.gia *
    realYieldToNominal(assumptions.giaInterestRealYield, inflation);
  const giaDividends =
    balances.gia *
    realYieldToNominal(assumptions.giaDividendRealYield, inflation);
  const giaCapitalGrowth =
    balances.gia *
    realYieldToNominal(assumptions.giaCapitalGrowthRealYield, inflation);
  const cashInterest =
    balances.cash *
    realYieldToNominal(assumptions.cashInterestRealYield, inflation);
  const interestIncome = giaInterest + cashInterest;

  return {
    balances: {
      isa: balances.isa + isaGrowth,
      pension: balances.pension + pensionGrowth,
      gia: Math.max(0, balances.gia + giaCapitalGrowth),
      giaCostBasis: balances.giaCostBasis,
      cash: balances.cash,
    },
    income: {
      interest: interestIncome,
      dividends: giaDividends,
      capitalGrowth: giaCapitalGrowth,
      totalGrowth:
        isaGrowth +
        pensionGrowth +
        giaCapitalGrowth +
        interestIncome +
        giaDividends,
    },
  };
}

function addContributions(
  balances: AccountBalances,
  plan: RetirementPlan,
  availableCashflow: number,
  isEmployed: boolean,
): { balances: AccountBalances; contributions: ContributionBreakdown } {
  if (!isEmployed || availableCashflow <= 0) {
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
      giaCostBasis: balances.giaCostBasis + contributions.giaContribution,
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
): { remaining: number; realizedCapitalGain: number } {
  const available = balances[source];
  const amount = Math.min(available, requestedAmount);
  balances[source] = Math.max(0, available - amount);
  let realizedCapitalGain = 0;

  if (source === "gia" && available > MONEY_EPSILON) {
    const costBasisSold = balances.giaCostBasis * (amount / available);
    realizedCapitalGain = amount - costBasisSold;
    balances.giaCostBasis = Math.max(0, balances.giaCostBasis - costBasisSold);
  }

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

  return {
    remaining: requestedAmount - amount,
    realizedCapitalGain,
  };
}

function createTaxInputs(
  plan: RetirementPlan,
  taxYear: number,
  annualIncome: AnnualIncome,
  investmentIncome: InvestmentIncome,
  withdrawals: WithdrawalBreakdown,
  realizedCapitalGains: number,
): TaxInputs {
  return {
    taxYear,
    inflationRate: plan.assumptions.inflationRate,
    jurisdiction: plan.taxSettings.jurisdiction,
    age: annualIncome.age,
    statePensionAge: plan.personalDetails.statePensionAge,
    employmentIncomes: [annualIncome.salary, annualIncome.secondSalary],
    rentalProfit: annualIncome.rental,
    otherTaxableIncome: annualIncome.other,
    pensionIncome: withdrawals.pensionWithdrawal,
    statePensionIncome: annualIncome.statePension,
    savingsInterest: Math.max(0, investmentIncome.interest),
    dividendIncome: Math.max(0, investmentIncome.dividends),
    capitalGains: realizedCapitalGains,
  };
}

interface WithdrawalEvaluation {
  balances: AccountBalances;
  withdrawals: WithdrawalBreakdown;
  realizedCapitalGains: number;
  tax: TaxResult;
  totalWithdrawn: number;
  netFunds: number;
}

function evaluateWithdrawals(
  plan: RetirementPlan,
  taxYear: number,
  annualIncome: AnnualIncome,
  investmentIncome: InvestmentIncome,
  balancesBeforeWithdrawals: AccountBalances,
  withdrawalOrder: WithdrawalSource[],
  requestedAmount: number,
): WithdrawalEvaluation {
  const balances = { ...balancesBeforeWithdrawals };
  const withdrawals = createZeroWithdrawals();
  let remaining = requestedAmount;
  let realizedCapitalGains = 0;

  for (const source of withdrawalOrder) {
    const result = withdrawFromSource(
      source,
      remaining,
      balances,
      withdrawals,
    );
    remaining = result.remaining;
    realizedCapitalGains += result.realizedCapitalGain;
    if (remaining <= MONEY_EPSILON) {
      break;
    }
  }

  const totalWithdrawn =
    withdrawals.cashWithdrawal +
    withdrawals.giaWithdrawal +
    withdrawals.isaWithdrawal +
    withdrawals.pensionWithdrawal;
  const tax = calculateUkTax(
    createTaxInputs(
      plan,
      taxYear,
      annualIncome,
      investmentIncome,
      withdrawals,
      realizedCapitalGains,
    ),
  );
  const recurringIncome =
    annualIncome.salary +
    annualIncome.secondSalary +
    annualIncome.rental +
    annualIncome.other +
    annualIncome.statePension +
    investmentIncome.interest +
    investmentIncome.dividends;

  return {
    balances,
    withdrawals,
    realizedCapitalGains,
    tax,
    totalWithdrawn,
    netFunds: recurringIncome + totalWithdrawn - tax.totalTax,
  };
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
  const balancesAfterGrowth = growthResult.balances;
  const annualIncome = calculateAnnualIncome(plan, periodStartAge);
  const taxYear =
    CURRENT_UK_TAX_YEAR +
    periodStartAge -
    plan.personalDetails.currentAge;
  const mortgageYear = calculateMortgageYear(
    openingMortgageBalance,
    plan,
    periodStartAge,
  );
  const spending = calculateSpending(plan, periodStartAge);
  const recurringIncome =
    annualIncome.salary +
    annualIncome.secondSalary +
    annualIncome.rental +
    annualIncome.other +
    annualIncome.statePension +
    growthResult.income.interest +
    growthResult.income.dividends;
  const zeroWithdrawals = createZeroWithdrawals();
  const baseTax = calculateUkTax(
    createTaxInputs(
      plan,
      taxYear,
      annualIncome,
      growthResult.income,
      zeroWithdrawals,
      0,
    ),
  );
  const spendingAndMortgage = spending + mortgageYear.payment;
  const netCashflowBeforeWithdrawals =
    recurringIncome - baseTax.totalTax - spendingAndMortgage;
  const isEmployed =
    annualIncome.salary > 0 || annualIncome.secondSalary > 0;
  let contributionBreakdown = createZeroContributions();
  let withdrawals = zeroWithdrawals;
  let realizedCapitalGains = 0;
  let tax = baseTax;
  let balances = balancesAfterGrowth;
  let unfundedShortfall = 0;
  let pensionDrawdownIncome = 0;

  if (netCashflowBeforeWithdrawals > 0) {
    const contributionResult = addContributions(
      balancesAfterGrowth,
      plan,
      netCashflowBeforeWithdrawals,
      isEmployed,
    );
    balances = contributionResult.balances;
    contributionBreakdown = contributionResult.contributions;
    const totalContributions =
      contributionBreakdown.isaContribution +
      contributionBreakdown.pensionContribution +
      contributionBreakdown.giaContribution;
    balances.cash += netCashflowBeforeWithdrawals - totalContributions;
  } else if (netCashflowBeforeWithdrawals < 0) {
    const availableAssets =
      balancesAfterGrowth.cash +
      balancesAfterGrowth.gia +
      balancesAfterGrowth.isa +
      balancesAfterGrowth.pension;
    const requiredNetFunds = spendingAndMortgage;
    let high = availableAssets;
    const highEvaluation = evaluateWithdrawals(
      plan,
      taxYear,
      annualIncome,
      growthResult.income,
      balancesAfterGrowth,
      plan.withdrawalOrder,
      high,
    );

    if (highEvaluation.netFunds >= requiredNetFunds) {
      let low = 0;
      for (let iteration = 0; iteration < 64; iteration += 1) {
        const midpoint = (low + high) / 2;
        const evaluation = evaluateWithdrawals(
          plan,
          taxYear,
          annualIncome,
          growthResult.income,
          balancesAfterGrowth,
          plan.withdrawalOrder,
          midpoint,
        );
        if (evaluation.netFunds >= requiredNetFunds) {
          high = midpoint;
        } else {
          low = midpoint;
        }
      }
    }

    const evaluation = evaluateWithdrawals(
      plan,
      taxYear,
      annualIncome,
      growthResult.income,
      balancesAfterGrowth,
      plan.withdrawalOrder,
      high,
    );
    balances = evaluation.balances;
    withdrawals = evaluation.withdrawals;
    realizedCapitalGains = evaluation.realizedCapitalGains;
    tax = evaluation.tax;
    pensionDrawdownIncome = withdrawals.pensionWithdrawal;
    unfundedShortfall = Math.max(0, requiredNetFunds - evaluation.netFunds);
  }

  const totalIncome =
    recurringIncome + pensionDrawdownIncome;
  const netCashflow =
    recurringIncome +
    pensionDrawdownIncome -
    tax.totalTax -
    spendingAndMortgage;

  const accountValues: AccountBalances = {
    isa: balances.isa,
    pension: balances.pension,
    gia: balances.gia,
    giaCostBasis: balances.giaCostBasis,
    cash: balances.cash,
  };
  const snapshot = createSnapshot(
    periodStartAge + 1,
    periodStartAge,
    taxYear,
    accountValues,
    plan.assets.otherAssets.currentValue,
    mortgageYear.balance,
  );

  return {
    ...snapshot,
    salaryIncome: annualIncome.salary,
    secondSalaryIncome: annualIncome.secondSalary,
    rentalIncome: annualIncome.rental,
    otherIncome: annualIncome.other,
    statePensionIncome: annualIncome.statePension,
    interestIncome: growthResult.income.interest,
    dividendIncome: growthResult.income.dividends,
    pensionDrawdownIncome,
    realizedCapitalGains,
    totalIncome,
    tax,
    spending,
    mortgagePayment: mortgageYear.payment,
    contributions: contributionBreakdown,
    withdrawals,
    unfundedShortfall,
    investmentGrowth: growthResult.income.totalGrowth,
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
    const projectionYear = yearlyResults.find((result) => result.age === age);
    if (!projectionYear) {
      continue;
    }
    const nonEmploymentTax = calculateUkTax({
      taxYear: projectionYear.taxYear,
      inflationRate: plan.assumptions.inflationRate,
      jurisdiction: plan.taxSettings.jurisdiction,
      age,
      statePensionAge: plan.personalDetails.statePensionAge,
      employmentIncomes: [],
      rentalProfit: income.rental,
      otherTaxableIncome: income.other,
      pensionIncome: 0,
      statePensionIncome: income.statePension,
      savingsInterest: Math.max(0, projectionYear.interestIncome),
      dividendIncome: Math.max(0, projectionYear.dividendIncome),
      capitalGains: 0,
    });
    const nonEmploymentIncome =
      income.rental +
      income.other +
      income.statePension +
      projectionYear.interestIncome +
      projectionYear.dividendIncome -
      nonEmploymentTax.totalTax;
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
 * Returns an after-tax projection with balances recorded at each age.
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
    giaCostBasis: plan.assets.gia.costBasis,
    cash: plan.assets.cash.currentValue,
  };
  const yearlyResults: ProjectionYear[] = [
    createSnapshot(
      plan.personalDetails.currentAge,
      plan.personalDetails.currentAge,
      CURRENT_UK_TAX_YEAR,
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
      giaCostBasis: year.giaCostBasis,
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
