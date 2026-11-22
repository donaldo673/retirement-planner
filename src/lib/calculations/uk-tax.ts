import type { TaxInputs, TaxResult, TaxJurisdiction } from "@/types/retirement";

export const CURRENT_UK_TAX_YEAR = 2026;
const THRESHOLDS_FROZEN_THROUGH = 2027;
const TAX_JURISDICTIONS: TaxJurisdiction[] = [
  "england",
  "scotland",
  "wales",
  "northern-ireland",
];

interface TaxRules {
  personalAllowance: number;
  personalAllowanceTaperStarts: number;
  basicRateLimit: number;
  higherRateLimit: number;
  scottishBandLimits: number[];
  scottishRates: number[];
  savingsStartingRateLimit: number;
  basicRateSavingsAllowance: number;
  higherRateSavingsAllowance: number;
  dividendAllowance: number;
  dividendRates: number[];
  niPrimaryThreshold: number;
  niUpperEarningsLimit: number;
  niMainRate: number;
  niUpperRate: number;
  capitalGainsAllowance: number;
  capitalGainsBasicRate: number;
  capitalGainsHigherRate: number;
}

export interface MarginalEmploymentTaxRates {
  incomeTax: number;
  nationalInsurance: number;
  combined: number;
}

const BASE_RULES: TaxRules = {
  personalAllowance: 12_570,
  personalAllowanceTaperStarts: 100_000,
  basicRateLimit: 50_270,
  higherRateLimit: 125_140,
  scottishBandLimits: [16_537, 29_526, 43_662, 75_000, 125_140],
  scottishRates: [0.19, 0.2, 0.21, 0.42, 0.45, 0.48],
  savingsStartingRateLimit: 5_000,
  basicRateSavingsAllowance: 1_000,
  higherRateSavingsAllowance: 500,
  dividendAllowance: 500,
  dividendRates: [0.1075, 0.3575, 0.3935],
  niPrimaryThreshold: 12_570,
  niUpperEarningsLimit: 50_270,
  niMainRate: 0.08,
  niUpperRate: 0.02,
  capitalGainsAllowance: 3_000,
  capitalGainsBasicRate: 0.18,
  capitalGainsHigherRate: 0.24,
};

function assertFinite(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be finite.`);
  }
}

function getRules(taxYear: number, inflationRate: number): TaxRules {
  if (!Number.isInteger(taxYear) || taxYear < CURRENT_UK_TAX_YEAR) {
    throw new RangeError(
      `Tax year must be ${CURRENT_UK_TAX_YEAR} or later.`,
    );
  }
  if (!Number.isFinite(inflationRate) || inflationRate <= -1) {
    throw new RangeError("Inflation rate must be finite and greater than -100%.");
  }

  const indexationYears = Math.max(0, taxYear - THRESHOLDS_FROZEN_THROUGH);
  const index = (value: number) =>
    Math.round(value * (1 + inflationRate) ** indexationYears);

  return {
    ...BASE_RULES,
    personalAllowance: index(BASE_RULES.personalAllowance),
    personalAllowanceTaperStarts: index(BASE_RULES.personalAllowanceTaperStarts),
    basicRateLimit: index(BASE_RULES.basicRateLimit),
    higherRateLimit: index(BASE_RULES.higherRateLimit),
    scottishBandLimits: BASE_RULES.scottishBandLimits.map(index),
    savingsStartingRateLimit: index(BASE_RULES.savingsStartingRateLimit),
    basicRateSavingsAllowance: index(BASE_RULES.basicRateSavingsAllowance),
    higherRateSavingsAllowance: index(BASE_RULES.higherRateSavingsAllowance),
    dividendAllowance: index(BASE_RULES.dividendAllowance),
    niPrimaryThreshold: index(BASE_RULES.niPrimaryThreshold),
    niUpperEarningsLimit: index(BASE_RULES.niUpperEarningsLimit),
    capitalGainsAllowance: index(BASE_RULES.capitalGainsAllowance),
  };
}

function getPersonalAllowance(totalIncome: number, rules: TaxRules): number {
  if (totalIncome <= rules.personalAllowanceTaperStarts) {
    return rules.personalAllowance;
  }

  return Math.max(
    0,
    rules.personalAllowance -
      Math.ceil((totalIncome - rules.personalAllowanceTaperStarts) / 2),
  );
}

function progressiveTax(
  amount: number,
  startPosition: number,
  limits: number[],
  rates: number[],
): number {
  let tax = 0;
  let remaining = amount;
  let lowerLimit = 0;

  for (let index = 0; index < rates.length && remaining > 0; index += 1) {
    const upperLimit = limits[index] ?? Number.POSITIVE_INFINITY;
    const availableInBand = Math.max(
      0,
      upperLimit - Math.max(startPosition, lowerLimit),
    );
    const taxableInBand = Math.min(remaining, availableInBand);
    tax += taxableInBand * rates[index];
    remaining -= taxableInBand;
    lowerLimit = upperLimit;
  }

  return tax;
}

function getIncomeTaxBands(
  jurisdiction: TaxJurisdiction,
  rules: TaxRules,
  personalAllowance: number,
): { limits: number[]; rates: number[] } {
  if (jurisdiction === "scotland") {
    return {
      limits: rules.scottishBandLimits.map((limit) =>
        Math.max(0, limit - personalAllowance),
      ),
      rates: rules.scottishRates,
    };
  }

  return {
    limits: [
      Math.max(0, rules.basicRateLimit - personalAllowance),
      Math.max(0, rules.higherRateLimit - personalAllowance),
    ],
    rates: [0.2, 0.4, 0.45],
  };
}

function calculateNationalInsurance(
  employmentIncomes: number[],
  age: number,
  statePensionAge: number,
  rules: TaxRules,
): number {
  if (age >= statePensionAge) {
    return 0;
  }

  return employmentIncomes.reduce((total, income) => {
    const mainRateEarnings = Math.max(
      0,
      Math.min(income, rules.niUpperEarningsLimit) -
        rules.niPrimaryThreshold,
    );
    const upperRateEarnings = Math.max(
      0,
      income - rules.niUpperEarningsLimit,
    );
    return (
      total +
      mainRateEarnings * rules.niMainRate +
      upperRateEarnings * rules.niUpperRate
    );
  }, 0);
}

function getSavingsAllowance(
  totalIncome: number,
  rules: TaxRules,
  personalAllowance: number,
): number {
  const taxableIncome = Math.max(0, totalIncome - personalAllowance);
  const higherRateThreshold = rules.basicRateLimit - personalAllowance;
  const additionalRateThreshold =
    rules.higherRateLimit - personalAllowance;
  if (taxableIncome > additionalRateThreshold) {
    return 0;
  }
  return taxableIncome > higherRateThreshold
    ? rules.higherRateSavingsAllowance
    : rules.basicRateSavingsAllowance;
}

function calculateIncomeTax(
  inputs: TaxInputs,
  rules: TaxRules,
  totalIncome: number,
): number {
  const nonSavingsIncome =
    inputs.employmentIncomes.reduce((total, income) => total + income, 0) +
    inputs.rentalProfit +
    inputs.otherTaxableIncome +
    inputs.pensionIncome +
    inputs.statePensionIncome;
  const personalAllowance = getPersonalAllowance(totalIncome, rules);
  const bands = getIncomeTaxBands(
    inputs.jurisdiction,
    rules,
    personalAllowance,
  );
  const taxableNonSavingsIncome = Math.max(
    0,
    nonSavingsIncome - personalAllowance,
  );
  const savingsBands = getIncomeTaxBands(
    "england",
    rules,
    personalAllowance,
  );
  const nonSavingsTax = progressiveTax(
    taxableNonSavingsIncome,
    0,
    bands.limits,
    bands.rates,
  );

  const unusedPersonalAllowance = Math.max(
    0,
    personalAllowance - nonSavingsIncome,
  );
  const savingsAfterPersonalAllowance = Math.max(
    0,
    inputs.savingsInterest - unusedPersonalAllowance,
  );
  const startingRateAllowance = Math.min(
    savingsAfterPersonalAllowance,
    Math.max(
      0,
      rules.savingsStartingRateLimit -
        Math.max(0, nonSavingsIncome - personalAllowance),
    ),
  );
  const savingsAllowance = Math.min(
    Math.max(0, savingsAfterPersonalAllowance - startingRateAllowance),
    getSavingsAllowance(
      totalIncome,
      rules,
      personalAllowance,
    ),
  );
  const exemptSavings = Math.min(
    inputs.savingsInterest,
    unusedPersonalAllowance + startingRateAllowance + savingsAllowance,
  );
  const taxableSavings = Math.max(0, inputs.savingsInterest - exemptSavings);
  const savingsTax = progressiveTax(
    taxableSavings,
    taxableNonSavingsIncome,
    savingsBands.limits,
    savingsBands.rates,
  );

  const unusedPersonalAllowanceForDividends = Math.max(
    0,
    personalAllowance - nonSavingsIncome - inputs.savingsInterest,
  );
  const dividendsAfterPersonalAllowance = Math.max(
    0,
    inputs.dividendIncome - unusedPersonalAllowanceForDividends,
  );
  const exemptDividends = Math.min(
    dividendsAfterPersonalAllowance,
    rules.dividendAllowance,
  );
  const taxableDividends = Math.max(
    0,
    dividendsAfterPersonalAllowance - exemptDividends,
  );
  const dividendTaxPosition =
    Math.max(0, nonSavingsIncome + inputs.savingsInterest - personalAllowance);
  const dividendTax = progressiveTax(
    taxableDividends,
    dividendTaxPosition,
    savingsBands.limits,
    rules.dividendRates,
  );

  return nonSavingsTax + savingsTax + dividendTax;
}

function calculateCapitalGainsTax(
  taxableIncome: number,
  capitalGains: number,
  rules: TaxRules,
): number {
  const taxableGains = Math.max(0, capitalGains - rules.capitalGainsAllowance);
  const basicRateHeadroom = Math.max(
    0,
    rules.basicRateLimit - taxableIncome,
  );
  const basicRateGains = Math.min(taxableGains, basicRateHeadroom);
  const higherRateGains = Math.max(0, taxableGains - basicRateGains);

  return (
    basicRateGains * rules.capitalGainsBasicRate +
    higherRateGains * rules.capitalGainsHigherRate
  );
}

export function calculateUkTax(inputs: TaxInputs): TaxResult {
  if (!TAX_JURISDICTIONS.includes(inputs.jurisdiction)) {
    throw new RangeError("Choose a supported UK tax jurisdiction.");
  }

  const nonNegativeInputs = [
    ...inputs.employmentIncomes,
    inputs.rentalProfit,
    inputs.otherTaxableIncome,
    inputs.pensionIncome,
    inputs.statePensionIncome,
    inputs.savingsInterest,
    inputs.dividendIncome,
  ];
  for (const [index, value] of nonNegativeInputs.entries()) {
    assertFinite(`Tax input ${index + 1}`, value);
    if (value < 0) {
      throw new RangeError("Taxable income inputs cannot be negative.");
    }
  }
  assertFinite("Capital gains", inputs.capitalGains);
  if (
    !Number.isInteger(inputs.age) ||
    inputs.age < 0 ||
    !Number.isInteger(inputs.statePensionAge) ||
    inputs.statePensionAge < 0
  ) {
    throw new RangeError("Tax ages must be non-negative whole numbers.");
  }

  const rules = getRules(inputs.taxYear, inputs.inflationRate);
  const totalIncome =
    nonNegativeInputs.reduce((total, value) => total + value, 0);
  const personalAllowance = getPersonalAllowance(totalIncome, rules);
  const incomeTax = calculateIncomeTax(inputs, rules, totalIncome);
  const nationalInsurance = calculateNationalInsurance(
    inputs.employmentIncomes,
    inputs.age,
    inputs.statePensionAge,
    rules,
  );
  const taxableIncome = Math.max(0, totalIncome - personalAllowance);
  const capitalGainsTax = calculateCapitalGainsTax(
    taxableIncome,
    inputs.capitalGains,
    rules,
  );

  return {
    grossIncome: totalIncome,
    personalAllowance,
    taxableIncome,
    incomeTax,
    nationalInsurance,
    capitalGainsTax,
    totalTax: incomeTax + nationalInsurance + capitalGainsTax,
  };
}

export function calculateMarginalEmploymentTaxRates(
  inputs: TaxInputs,
): MarginalEmploymentTaxRates {
  const baseline = calculateUkTax(inputs);
  const employmentIncomes = [...inputs.employmentIncomes];
  const existingJobIndex = employmentIncomes.findIndex((income) => income > 0);
  const jobIndex = existingJobIndex === -1 ? 0 : existingJobIndex;

  if (employmentIncomes.length === 0) {
    employmentIncomes.push(0);
  }
  employmentIncomes[jobIndex] += 1;

  const withAdditionalPound = calculateUkTax({
    ...inputs,
    employmentIncomes,
  });
  const incomeTax =
    withAdditionalPound.incomeTax - baseline.incomeTax;
  const nationalInsurance =
    withAdditionalPound.nationalInsurance - baseline.nationalInsurance;

  return {
    incomeTax,
    nationalInsurance,
    combined: incomeTax + nationalInsurance,
  };
}
