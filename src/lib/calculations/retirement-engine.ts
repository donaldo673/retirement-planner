import type {
  Assumptions,
  AccountProjectionBreakdown,
  ContributionBreakdown,
  ProjectionResult,
  ProjectionYear,
  RetirementPlan,
  RetirementSummary,
  ScenarioType,
  AnnualPersonIncome,
  PersonKey,
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
  isa: Record<PersonKey, number>;
  pension: Record<PersonKey, number>;
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
  byAccount: AccountProjectionBreakdown;
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
  const { personalDetails, people, assets, spending, assumptions, withdrawalOrder } =
    plan;
  const currentAge = people.person1.income.currentAge;

  assertAge("Retirement age", personalDetails.retirementAge);
  assertAge("Life expectancy", personalDetails.lifeExpectancy);
  assertAge("Mortgage end age", assets.mortgage.mortgageEndAge);
  for (const personKey of ["person1", "person2"] as const) {
    const person = people[personKey];
    const { income: personIncome, assets: personAssets } = person;
    assertAge(`${personKey} current age`, personIncome.currentAge);
    assertAge(`${personKey} State Pension age`, personIncome.statePensionAge);
    assertAge(`${personKey} work-until age`, personIncome.employment.workUntilAge);
    assertAge(
      `${personKey} second employment start age`,
      personIncome.secondEmployment.startAge,
    );
    assertAge(
      `${personKey} second employment end age`,
      personIncome.secondEmployment.endAge,
    );
    assertFiniteNonNegative(`${personKey} ISA value`, personAssets.isa.currentValue);
    assertFiniteNonNegative(
      `${personKey} ISA monthly contribution`,
      personAssets.isa.monthlyContribution,
    );
    assertFiniteNonNegative(
      `${personKey} pension value`,
      personAssets.pension.currentValue,
    );
    assertFiniteNonNegative(
      `${personKey} pension monthly contribution`,
      personAssets.pension.monthlyContribution,
    );
    assertFiniteNonNegative(
      `${personKey} salary`,
      personIncome.employment.currentSalary,
    );
    assertFiniteNonNegative(
      `${personKey} second employment salary`,
      personIncome.secondEmployment.currentSalary,
    );
    assertFiniteNonNegative(
      `${personKey} rental taxable profit`,
      personIncome.otherIncome.rentalIncome,
    );
    assertFiniteNonNegative(
      `${personKey} other taxable income`,
      personIncome.otherIncome.otherIncome,
    );
    assertFiniteNonNegative(
      `${personKey} State Pension amount`,
      personIncome.statePension.annualAmount,
    );
    assertAnnualRate(
      `${personKey} annual salary growth rate`,
      personIncome.employment.annualSalaryGrowthRate,
    );
    assertAnnualRate(
      `${personKey} second employment salary growth rate`,
      personIncome.secondEmployment.annualSalaryGrowthRate,
    );
    if (
      personIncome.secondEmployment.startAge >
      personIncome.secondEmployment.endAge
    ) {
      throw new RangeError(
        `${personKey} second employment start age must not exceed its end age.`,
      );
    }
  }
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
    currentAge >= personalDetails.retirementAge ||
    personalDetails.retirementAge >= personalDetails.lifeExpectancy
  ) {
    throw new RangeError(
      "A valid plan requires current age < retirement age < life expectancy.",
    );
  }

  if (
    people.person1.income.employment.workUntilAge > personalDetails.lifeExpectancy
  ) {
    throw new RangeError(
      "Person 1 work-until age must not exceed life expectancy.",
    );
  }

  assertFiniteNonNegative("GIA value", assets.gia.currentValue);
  assertFiniteNonNegative("GIA cost basis", assets.gia.costBasis);
  assertFiniteNonNegative("GIA monthly contribution", assets.gia.monthlyContribution);
  assertFiniteNonNegative("Cash value", assets.cash.currentValue);
  assertFiniteNonNegative("Other assets value", assets.otherAssets.currentValue);
  assertFiniteNonNegative("Mortgage balance", assets.mortgage.outstandingBalance);
  assertFiniteNonNegative("Mortgage monthly payment", assets.mortgage.monthlyPayment);
  assertFiniteNonNegative("Mortgage interest rate", assets.mortgage.interestRate);
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

function calculatePersonAnnualIncome(
  plan: RetirementPlan,
  personKey: PersonKey,
  yearsFromToday: number,
): AnnualIncome {
  const { income } = plan.people[personKey];
  const age = income.currentAge + yearsFromToday;
  const inflationFactor =
    (1 + plan.assumptions.inflationRate) ** yearsFromToday;
  const salary =
    age < income.employment.workUntilAge
      ? income.employment.currentSalary *
        (1 + income.employment.annualSalaryGrowthRate) ** yearsFromToday
      : 0;
  const secondSalary =
    age >= income.secondEmployment.startAge &&
    age < income.secondEmployment.endAge
      ? income.secondEmployment.currentSalary *
        (1 + income.secondEmployment.annualSalaryGrowthRate) ** yearsFromToday
      : 0;
  const statePension =
    age >= income.statePensionAge
      ? income.statePension.annualAmount * inflationFactor
      : 0;

  return {
    age,
    salary,
    secondSalary,
    rental: income.otherIncome.rentalIncome * inflationFactor,
    other: income.otherIncome.otherIncome * inflationFactor,
    statePension,
  };
}

function calculateAnnualIncome(
  plan: RetirementPlan,
  yearsFromToday: number,
): Record<PersonKey, AnnualIncome> {
  const person2Income =
    plan.personalDetails.householdType === "joint"
      ? calculatePersonAnnualIncome(plan, "person2", yearsFromToday)
      : {
          age: plan.people.person2.income.currentAge + yearsFromToday,
          salary: 0,
          secondSalary: 0,
          rental: 0,
          other: 0,
          statePension: 0,
        };
  return {
    person1: calculatePersonAnnualIncome(plan, "person1", yearsFromToday),
    person2: person2Income,
  };
}

function sumAnnualIncome(
  income: Record<PersonKey, AnnualIncome>,
  field: "salary" | "secondSalary" | "rental" | "other" | "statePension",
): number {
  return income.person1[field] + income.person2[field];
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
  const person2Assets =
    plan.personalDetails.householdType === "joint"
      ? plan.people.person2.assets.isa.currentValue +
        plan.people.person2.assets.pension.currentValue
      : 0;
  return (
    plan.people.person1.assets.isa.currentValue +
    plan.people.person1.assets.pension.currentValue +
    person2Assets +
    assets.gia.currentValue +
    assets.cash.currentValue +
    assets.otherAssets.currentValue -
    assets.mortgage.outstandingBalance
  );
}

function calculateInvestedAssets(balances: AccountBalances): number {
  return (
    balances.isa.person1 +
    balances.isa.person2 +
    balances.pension.person1 +
    balances.pension.person2 +
    balances.gia
  );
}

function calculateNetWorth(
  balances: AccountBalances,
  otherAssetsValue: number,
  mortgageBalance: number,
): number {
  return (
    balances.isa.person1 +
    balances.isa.person2 +
    balances.pension.person1 +
    balances.pension.person2 +
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
    byPerson: {
      person1: { isaContribution: 0, pensionContribution: 0 },
      person2: { isaContribution: 0, pensionContribution: 0 },
    },
  };
}

function createZeroWithdrawals(): WithdrawalBreakdown {
  return {
    cashWithdrawal: 0,
    giaWithdrawal: 0,
    isaWithdrawal: 0,
    pensionWithdrawal: 0,
    byPerson: {
      person1: { isaWithdrawal: 0, pensionWithdrawal: 0 },
      person2: { isaWithdrawal: 0, pensionWithdrawal: 0 },
    },
  };
}

function createZeroTaxResult(): TaxResult {
  return {
    grossIncome: 0,
    personalAllowance: 0,
    taxableIncome: 0,
    incomeTax: 0,
    nationalInsurance: 0,
    capitalGainsTax: 0,
    totalTax: 0,
  };
}

function createZeroPersonIncome(age: number): AnnualPersonIncome {
  return {
    age,
    salaryIncome: 0,
    secondSalaryIncome: 0,
    rentalIncome: 0,
    otherIncomeAmount: 0,
    statePensionIncome: 0,
    interestIncome: 0,
    dividendIncome: 0,
    pensionDrawdownIncome: 0,
    realizedCapitalGains: 0,
    totalIncome: 0,
  };
}

function sumPersonValues(values: Record<PersonKey, number>): number {
  return values.person1 + values.person2;
}

function createSnapshot(
  age: number,
  periodStartAge: number,
  taxYear: number,
  balances: AccountBalances,
  otherAssetsValue: number,
  mortgageBalance: number,
  personAges: Record<PersonKey, number>,
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
    tax: createZeroTaxResult(),
    personIncomes: {
      person1: createZeroPersonIncome(personAges.person1),
      person2: createZeroPersonIncome(personAges.person2),
    },
    personTaxes: {
      person1: createZeroTaxResult(),
      person2: createZeroTaxResult(),
    },
    spending: 0,
    mortgagePayment: 0,
    mortgageBalance,
    contributions: createZeroContributions(),
    withdrawals: createZeroWithdrawals(),
    unfundedShortfall: 0,
    accountNetContributions: {
      isa: 0,
      pension: 0,
      gia: 0,
      cash: 0,
    },
    accountInvestmentIncome: {
      isa: 0,
      pension: 0,
      gia: 0,
      cash: 0,
    },
    investmentGrowth: 0,
    netCashflow: 0,
    isaValue: sumPersonValues(balances.isa),
    pensionValue: sumPersonValues(balances.pension),
    personIsaValues: { ...balances.isa },
    personPensionValues: { ...balances.pension },
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
  const isaGrowth: Record<PersonKey, number> = {
    person1:
      balances.isa.person1 *
      realYieldToNominal(assumptions.isaRealReturn, inflation),
    person2:
      balances.isa.person2 *
      realYieldToNominal(assumptions.isaRealReturn, inflation),
  };
  const pensionGrowth: Record<PersonKey, number> = {
    person1:
      balances.pension.person1 *
      realYieldToNominal(assumptions.pensionRealReturn, inflation),
    person2:
      balances.pension.person2 *
      realYieldToNominal(assumptions.pensionRealReturn, inflation),
  };
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
      isa: {
        person1: balances.isa.person1 + isaGrowth.person1,
        person2: balances.isa.person2 + isaGrowth.person2,
      },
      pension: {
        person1: balances.pension.person1 + pensionGrowth.person1,
        person2: balances.pension.person2 + pensionGrowth.person2,
      },
      gia: Math.max(0, balances.gia + giaCapitalGrowth),
      giaCostBasis: balances.giaCostBasis,
      cash: balances.cash,
    },
    income: {
      interest: interestIncome,
      dividends: giaDividends,
      capitalGrowth: giaCapitalGrowth,
      totalGrowth:
        sumPersonValues(isaGrowth) +
        sumPersonValues(pensionGrowth) +
        giaCapitalGrowth +
        interestIncome +
        giaDividends,
      byAccount: {
        isa: sumPersonValues(isaGrowth),
        pension: sumPersonValues(pensionGrowth),
        gia: giaInterest + giaDividends + giaCapitalGrowth,
        cash: cashInterest,
      },
    },
  };
}

function addContributions(
  balances: AccountBalances,
  plan: RetirementPlan,
  availableCashflow: number,
  annualIncome: Record<PersonKey, AnnualIncome>,
): { balances: AccountBalances; contributions: ContributionBreakdown } {
  const isWorking = {
    person1:
      annualIncome.person1.salary > 0 ||
      annualIncome.person1.secondSalary > 0,
    person2:
      annualIncome.person2.salary > 0 ||
      annualIncome.person2.secondSalary > 0,
  };
  if ((!isWorking.person1 && !isWorking.person2) || availableCashflow <= 0) {
    return { balances, contributions: createZeroContributions() };
  }

  const scheduledByPerson = {
    person1: {
      isaContribution: isWorking.person1
        ? plan.people.person1.assets.isa.monthlyContribution * MONTHS_PER_YEAR
        : 0,
      pensionContribution: isWorking.person1
        ? plan.people.person1.assets.pension.monthlyContribution * MONTHS_PER_YEAR
        : 0,
    },
    person2: {
      isaContribution: isWorking.person2
        ? plan.people.person2.assets.isa.monthlyContribution * MONTHS_PER_YEAR
        : 0,
      pensionContribution: isWorking.person2
        ? plan.people.person2.assets.pension.monthlyContribution * MONTHS_PER_YEAR
        : 0,
    },
  };
  const giaContribution =
    plan.assets.gia.monthlyContribution * MONTHS_PER_YEAR;
  const scheduledTotal =
    scheduledByPerson.person1.isaContribution +
    scheduledByPerson.person1.pensionContribution +
    scheduledByPerson.person2.isaContribution +
    scheduledByPerson.person2.pensionContribution +
    giaContribution;
  if (scheduledTotal === 0) {
    return { balances, contributions: createZeroContributions() };
  }

  const scale = Math.min(1, availableCashflow / scheduledTotal);
  const contributions: ContributionBreakdown = {
    isaContribution:
      (scheduledByPerson.person1.isaContribution +
        scheduledByPerson.person2.isaContribution) *
      scale,
    pensionContribution:
      (scheduledByPerson.person1.pensionContribution +
        scheduledByPerson.person2.pensionContribution) *
      scale,
    giaContribution: giaContribution * scale,
    byPerson: {
      person1: {
        isaContribution: scheduledByPerson.person1.isaContribution * scale,
        pensionContribution:
          scheduledByPerson.person1.pensionContribution * scale,
      },
      person2: {
        isaContribution: scheduledByPerson.person2.isaContribution * scale,
        pensionContribution:
          scheduledByPerson.person2.pensionContribution * scale,
      },
    },
  };

  return {
    balances: {
      isa: {
        person1:
          balances.isa.person1 +
          contributions.byPerson.person1.isaContribution,
        person2:
          balances.isa.person2 +
          contributions.byPerson.person2.isaContribution,
      },
      pension: {
        person1:
          balances.pension.person1 +
          contributions.byPerson.person1.pensionContribution,
        person2:
          balances.pension.person2 +
          contributions.byPerson.person2.pensionContribution,
      },
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
  if (source === "isa" || source === "pension") {
    const account = balances[source];
    const available = account.person1 + account.person2;
    const amount = Math.min(available, requestedAmount);
    const person1Amount =
      available > MONEY_EPSILON
        ? amount * (account.person1 / available)
        : 0;
    const person2Amount = Math.min(account.person2, amount - person1Amount);
    account.person1 = Math.max(0, account.person1 - person1Amount);
    account.person2 = Math.max(0, account.person2 - person2Amount);
    const personWithdrawalKey =
      source === "isa" ? "isaWithdrawal" : "pensionWithdrawal";
    withdrawals.byPerson.person1[personWithdrawalKey] += person1Amount;
    withdrawals.byPerson.person2[personWithdrawalKey] += person2Amount;
    withdrawals[personWithdrawalKey] += person1Amount + person2Amount;
    return {
      remaining: requestedAmount - person1Amount - person2Amount,
      realizedCapitalGain: 0,
    };
  }

  const available = source === "cash" ? balances.cash : balances.gia;
  const amount = Math.min(available, requestedAmount);
  if (source === "cash") {
    balances.cash = Math.max(0, balances.cash - amount);
    withdrawals.cashWithdrawal += amount;
    return {
      remaining: requestedAmount - amount,
      realizedCapitalGain: 0,
    };
  }

  balances.gia = Math.max(0, balances.gia - amount);
  let realizedCapitalGain = 0;
  if (available > MONEY_EPSILON) {
    const costBasisSold = balances.giaCostBasis * (amount / available);
    realizedCapitalGain = amount - costBasisSold;
    balances.giaCostBasis = Math.max(0, balances.giaCostBasis - costBasisSold);
  }
  withdrawals.giaWithdrawal += amount;
  return {
    remaining: requestedAmount - amount,
    realizedCapitalGain,
  };
}

function createTaxInputs(
  plan: RetirementPlan,
  taxYear: number,
  personKey: PersonKey,
  annualIncome: Record<PersonKey, AnnualIncome>,
  investmentIncome: InvestmentIncome,
  withdrawals: WithdrawalBreakdown,
  realizedCapitalGains: number,
): TaxInputs {
  const personIncome = annualIncome[personKey];
  const taxableInvestments = personKey === "person1";
  return {
    taxYear,
    inflationRate: plan.assumptions.inflationRate,
    jurisdiction: plan.taxSettings.jurisdiction,
    age: personIncome.age,
    statePensionAge: plan.people[personKey].income.statePensionAge,
    employmentIncomes: [personIncome.salary, personIncome.secondSalary],
    rentalProfit: personIncome.rental,
    otherTaxableIncome: personIncome.other,
    pensionIncome: withdrawals.byPerson[personKey].pensionWithdrawal,
    statePensionIncome: personIncome.statePension,
    savingsInterest: taxableInvestments
      ? Math.max(0, investmentIncome.interest)
      : 0,
    dividendIncome: taxableInvestments
      ? Math.max(0, investmentIncome.dividends)
      : 0,
    capitalGains: taxableInvestments ? realizedCapitalGains : 0,
  };
}

function calculatePersonTaxes(
  plan: RetirementPlan,
  taxYear: number,
  annualIncome: Record<PersonKey, AnnualIncome>,
  investmentIncome: InvestmentIncome,
  withdrawals: WithdrawalBreakdown,
  realizedCapitalGains: number,
): Record<PersonKey, TaxResult> {
  const person1 = calculateUkTax(
    createTaxInputs(
      plan,
      taxYear,
      "person1",
      annualIncome,
      investmentIncome,
      withdrawals,
      realizedCapitalGains,
    ),
  );
  const person2 =
    plan.personalDetails.householdType === "joint"
      ? calculateUkTax(
          createTaxInputs(
            plan,
            taxYear,
            "person2",
            annualIncome,
            investmentIncome,
            withdrawals,
            realizedCapitalGains,
          ),
        )
      : createZeroTaxResult();
  return { person1, person2 };
}

function combineTaxes(
  personTaxes: Record<PersonKey, TaxResult>,
): TaxResult {
  return {
    grossIncome:
      personTaxes.person1.grossIncome + personTaxes.person2.grossIncome,
    personalAllowance:
      personTaxes.person1.personalAllowance +
      personTaxes.person2.personalAllowance,
    taxableIncome:
      personTaxes.person1.taxableIncome + personTaxes.person2.taxableIncome,
    incomeTax: personTaxes.person1.incomeTax + personTaxes.person2.incomeTax,
    nationalInsurance:
      personTaxes.person1.nationalInsurance +
      personTaxes.person2.nationalInsurance,
    capitalGainsTax:
      personTaxes.person1.capitalGainsTax +
      personTaxes.person2.capitalGainsTax,
    totalTax: personTaxes.person1.totalTax + personTaxes.person2.totalTax,
  };
}

function cloneAccountBalances(balances: AccountBalances): AccountBalances {
  return {
    ...balances,
    isa: { ...balances.isa },
    pension: { ...balances.pension },
  };
}

interface WithdrawalEvaluation {
  balances: AccountBalances;
  withdrawals: WithdrawalBreakdown;
  realizedCapitalGains: number;
  personTaxes: Record<PersonKey, TaxResult>;
  tax: TaxResult;
  totalWithdrawn: number;
  netFunds: number;
}

function evaluateWithdrawals(
  plan: RetirementPlan,
  taxYear: number,
  annualIncome: Record<PersonKey, AnnualIncome>,
  investmentIncome: InvestmentIncome,
  balancesBeforeWithdrawals: AccountBalances,
  withdrawalOrder: WithdrawalSource[],
  requestedAmount: number,
): WithdrawalEvaluation {
  const balances = cloneAccountBalances(balancesBeforeWithdrawals);
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
  const personTaxes = calculatePersonTaxes(
    plan,
    taxYear,
    annualIncome,
    investmentIncome,
    withdrawals,
    realizedCapitalGains,
  );
  const tax = combineTaxes(personTaxes);
  const recurringIncome =
    Object.values(annualIncome).reduce(
      (total, income) =>
        total +
        income.salary +
        income.secondSalary +
        income.rental +
        income.other +
        income.statePension,
      0,
    ) +
    investmentIncome.interest +
    investmentIncome.dividends;

  return {
    balances,
    withdrawals,
    realizedCapitalGains,
    personTaxes,
    tax,
    totalWithdrawn,
    netFunds: recurringIncome + totalWithdrawn - tax.totalTax,
  };
}

function createPersonProjectionIncome(
  income: AnnualIncome,
  interestIncome: number,
  dividendIncome: number,
  pensionDrawdownIncome: number,
  realizedCapitalGains: number,
): AnnualPersonIncome {
  const totalIncome =
    income.salary +
    income.secondSalary +
    income.rental +
    income.other +
    income.statePension +
    interestIncome +
    dividendIncome +
    pensionDrawdownIncome;
  return {
    age: income.age,
    salaryIncome: income.salary,
    secondSalaryIncome: income.secondSalary,
    rentalIncome: income.rental,
    otherIncomeAmount: income.other,
    statePensionIncome: income.statePension,
    interestIncome,
    dividendIncome,
    pensionDrawdownIncome,
    realizedCapitalGains,
    totalIncome,
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
  const annualIncome = calculateAnnualIncome(
    plan,
    periodStartAge - plan.people.person1.income.currentAge,
  );
  const taxYear =
    CURRENT_UK_TAX_YEAR +
    periodStartAge -
    plan.people.person1.income.currentAge;
  const mortgageYear = calculateMortgageYear(
    openingMortgageBalance,
    plan,
    periodStartAge,
  );
  const spending = calculateSpending(plan, periodStartAge);
  const recurringIncome =
    sumAnnualIncome(annualIncome, "salary") +
    sumAnnualIncome(annualIncome, "secondSalary") +
    sumAnnualIncome(annualIncome, "rental") +
    sumAnnualIncome(annualIncome, "other") +
    sumAnnualIncome(annualIncome, "statePension") +
    growthResult.income.interest +
    growthResult.income.dividends;
  const zeroWithdrawals = createZeroWithdrawals();
  let personTaxes = calculatePersonTaxes(
    plan,
    taxYear,
    annualIncome,
    growthResult.income,
    zeroWithdrawals,
    0,
  );
  const baseTax = combineTaxes(personTaxes);
  const spendingAndMortgage = spending + mortgageYear.payment;
  const netCashflowBeforeWithdrawals =
    recurringIncome - baseTax.totalTax - spendingAndMortgage;
  let contributionBreakdown = createZeroContributions();
  let withdrawals = zeroWithdrawals;
  let realizedCapitalGains = 0;
  let tax = baseTax;
  let balances = balancesAfterGrowth;
  let unfundedShortfall = 0;
  let pensionDrawdownIncome = 0;
  let cashNetContribution = 0;

  if (netCashflowBeforeWithdrawals > 0) {
    const contributionResult = addContributions(
      balancesAfterGrowth,
      plan,
      netCashflowBeforeWithdrawals,
      annualIncome,
    );
    balances = contributionResult.balances;
    contributionBreakdown = contributionResult.contributions;
    const totalContributions =
      contributionBreakdown.isaContribution +
      contributionBreakdown.pensionContribution +
      contributionBreakdown.giaContribution;
    cashNetContribution = netCashflowBeforeWithdrawals - totalContributions;
    balances.cash += cashNetContribution;
  } else if (netCashflowBeforeWithdrawals < 0) {
    const availableAssets =
      balancesAfterGrowth.cash +
      balancesAfterGrowth.gia +
      sumPersonValues(balancesAfterGrowth.isa) +
      sumPersonValues(balancesAfterGrowth.pension);
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
    personTaxes = evaluation.personTaxes;
    tax = evaluation.tax;
    pensionDrawdownIncome = sumPersonValues({
      person1: withdrawals.byPerson.person1.pensionWithdrawal,
      person2: withdrawals.byPerson.person2.pensionWithdrawal,
    });
    cashNetContribution = -withdrawals.cashWithdrawal;
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
    {
      person1: annualIncome.person1.age + 1,
      person2: annualIncome.person2.age + 1,
    },
  );

  return {
    ...snapshot,
    salaryIncome: sumAnnualIncome(annualIncome, "salary"),
    secondSalaryIncome: sumAnnualIncome(annualIncome, "secondSalary"),
    rentalIncome: sumAnnualIncome(annualIncome, "rental"),
    otherIncome: sumAnnualIncome(annualIncome, "other"),
    statePensionIncome: sumAnnualIncome(annualIncome, "statePension"),
    interestIncome: growthResult.income.interest,
    dividendIncome: growthResult.income.dividends,
    pensionDrawdownIncome,
    realizedCapitalGains,
    totalIncome,
    tax,
    personIncomes: {
      person1: createPersonProjectionIncome(
        annualIncome.person1,
        growthResult.income.interest,
        growthResult.income.dividends,
        withdrawals.byPerson.person1.pensionWithdrawal,
        realizedCapitalGains,
      ),
      person2: createPersonProjectionIncome(
        annualIncome.person2,
        0,
        0,
        withdrawals.byPerson.person2.pensionWithdrawal,
        0,
      ),
    },
    personTaxes,
    spending,
    mortgagePayment: mortgageYear.payment,
    contributions: contributionBreakdown,
    withdrawals,
    unfundedShortfall,
    accountNetContributions: {
      isa: contributionBreakdown.isaContribution - withdrawals.isaWithdrawal,
      pension:
        contributionBreakdown.pensionContribution - withdrawals.pensionWithdrawal,
      gia: contributionBreakdown.giaContribution - withdrawals.giaWithdrawal,
      cash: cashNetContribution,
    },
    accountInvestmentIncome: growthResult.income.byAccount,
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
    const projectionYear = year;
    const nonEmploymentIncomeByPerson: Record<PersonKey, AnnualIncome> = {
      person1: {
        age: year.personIncomes.person1.age,
        rental: year.personIncomes.person1.rentalIncome,
        other: year.personIncomes.person1.otherIncomeAmount,
        statePension: year.personIncomes.person1.statePensionIncome,
        salary: 0,
        secondSalary: 0,
      },
      person2: {
        age: year.personIncomes.person2.age,
        rental: year.personIncomes.person2.rentalIncome,
        other: year.personIncomes.person2.otherIncomeAmount,
        statePension: year.personIncomes.person2.statePensionIncome,
        salary: 0,
        secondSalary: 0,
      },
    };
    const zeroWithdrawals = createZeroWithdrawals();
    const nonEmploymentTaxes = combineTaxes(
      calculatePersonTaxes(
        plan,
        projectionYear.taxYear,
        nonEmploymentIncomeByPerson,
        {
          interest: projectionYear.interestIncome,
          dividends: projectionYear.dividendIncome,
          capitalGrowth: 0,
          totalGrowth: 0,
          byAccount: { isa: 0, pension: 0, gia: 0, cash: 0 },
        },
        zeroWithdrawals,
        0,
      ),
    );
    const nonEmploymentIncome =
      sumAnnualIncome(nonEmploymentIncomeByPerson, "rental") +
      sumAnnualIncome(nonEmploymentIncomeByPerson, "other") +
      sumAnnualIncome(nonEmploymentIncomeByPerson, "statePension") +
      projectionYear.interestIncome +
      projectionYear.dividendIncome -
      nonEmploymentTaxes.totalTax;
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
    isa: {
      person1: plan.people.person1.assets.isa.currentValue,
      person2:
        plan.personalDetails.householdType === "joint"
          ? plan.people.person2.assets.isa.currentValue
          : 0,
    },
    pension: {
      person1: plan.people.person1.assets.pension.currentValue,
      person2:
        plan.personalDetails.householdType === "joint"
          ? plan.people.person2.assets.pension.currentValue
          : 0,
    },
    gia: plan.assets.gia.currentValue,
    giaCostBasis: plan.assets.gia.costBasis,
    cash: plan.assets.cash.currentValue,
  };
  const yearlyResults: ProjectionYear[] = [
    createSnapshot(
      plan.people.person1.income.currentAge,
      plan.people.person1.income.currentAge,
      CURRENT_UK_TAX_YEAR,
      balances,
      plan.assets.otherAssets.currentValue,
      plan.assets.mortgage.outstandingBalance,
      {
        person1: plan.people.person1.income.currentAge,
        person2: plan.people.person2.income.currentAge,
      },
    ),
  ];

  let currentBalances = balances;
  let currentMortgageBalance = plan.assets.mortgage.outstandingBalance;

  for (
    let age = plan.people.person1.income.currentAge;
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
      isa: year.personIsaValues,
      pension: year.personPensionValues,
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
