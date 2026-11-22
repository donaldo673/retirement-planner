import { calculateMarginalEmploymentTaxRates } from "../calculations/uk-tax";
import type {
  AnnualPersonIncome,
  PersonKey,
  ProjectionYear,
  RetirementPlan,
  TaxInputs,
} from "@/types/retirement";
import type {
  ProfitLossStatement,
  StatementLineItem,
} from "@/types/financialStatements";

function createTaxInputs(
  year: ProjectionYear,
  income: AnnualPersonIncome,
  plan: RetirementPlan,
  person: PersonKey,
): TaxInputs {
  return {
    taxYear: year.taxYear,
    inflationRate: plan.assumptions.inflationRate,
    jurisdiction: plan.taxSettings.jurisdiction,
    age: income.age,
    statePensionAge: plan.people[person].income.statePensionAge,
    employmentIncomes: [income.salaryIncome, income.secondSalaryIncome],
    rentalProfit: income.rentalIncome,
    otherTaxableIncome: income.otherIncomeAmount,
    pensionIncome: income.pensionDrawdownIncome,
    statePensionIncome: income.statePensionIncome,
    savingsInterest: Math.max(0, income.interestIncome),
    dividendIncome: Math.max(0, income.dividendIncome),
    capitalGains: income.realizedCapitalGains,
  };
}

function incomeTaxSources(year: ProjectionYear): StatementLineItem[] {
  return [
    { label: "Employment income", amount: year.salaryIncome },
    { label: "Second employment income", amount: year.secondSalaryIncome },
    { label: "Rental income", amount: year.rentalIncome },
    { label: "State Pension", amount: year.statePensionIncome },
    { label: "Private pension drawdown", amount: year.pensionDrawdownIncome },
    {
      label: "Interest income",
      amount: year.interestIncome,
      note: "The tax calculation excludes negative savings interest.",
    },
    { label: "Dividend income", amount: year.dividendIncome },
    { label: "Other taxable income", amount: year.otherIncome },
  ];
}

export function buildProfitLossStatement(
  year: ProjectionYear,
  plan: RetirementPlan,
): ProfitLossStatement {
  const marginalRates: ProfitLossStatement["tax"]["marginalRates"] =
    year.age === year.periodStartAge
      ? []
      : (["person1", "person2"] as const)
          .filter(
            (person) =>
              person === "person1" ||
              plan.personalDetails.householdType === "joint",
          )
          .map((person) => ({
            person,
            rate: calculateMarginalEmploymentTaxRates(
              createTaxInputs(year, year.personIncomes[person], plan, person),
            ).combined,
          }));
  const taxFreeCash = year.withdrawals.cashWithdrawal;
  const taxFreeIsa = year.withdrawals.isaWithdrawal;
  const incomeTaxSourcesBreakdown = incomeTaxSources(year);

  return {
    age: year.age,
    periodStartAge: year.periodStartAge,
    taxYear: year.taxYear,
    isBaselineSnapshot: year.age === year.periodStartAge,
    income: {
      employmentIncome: year.salaryIncome,
      secondEmploymentIncome: year.secondSalaryIncome,
      rentalIncome: year.rentalIncome,
      statePensionIncome: year.statePensionIncome,
      pensionDrawdown: year.pensionDrawdownIncome,
      interestIncome: year.interestIncome,
      dividendIncome: year.dividendIncome,
      otherTaxableIncome: year.otherIncome,
      grossIncome: year.totalIncome,
      taxableIncomeTotal: year.tax.grossIncome,
      unsupportedSources: [
        "Bonus income",
        "Defined benefit pension",
        "Annuity income",
      ],
    },
    taxFreeWithdrawals: {
      cash: taxFreeCash,
      isa: taxFreeIsa,
      total: taxFreeCash + taxFreeIsa,
      giaDisposalProceeds: year.withdrawals.giaWithdrawal,
      unsupportedSources: [
        "Tax-free pension lump sums",
        "Premium Bond winnings",
        "Other tax-free income",
      ],
    },
    tax: {
      incomeTax: year.tax.incomeTax,
      capitalGainsTax: year.tax.capitalGainsTax,
      dividendTax: null,
      nationalInsurance: year.tax.nationalInsurance,
      otherTaxes: null,
      totalTax: year.tax.totalTax,
      effectiveTaxRate:
        year.tax.grossIncome > 0
          ? year.tax.totalTax / year.tax.grossIncome
          : null,
      marginalRates,
      taxableIncomeSources: incomeTaxSourcesBreakdown,
      bandUsage: null,
    },
    spending: {
      plannedSpending: year.spending,
      mortgagePayments: year.mortgagePayment,
      totalSpending: year.spending + year.mortgagePayment,
      categoryBreakdown: null,
    },
    grossIncome: year.totalIncome,
    netSurplusDeficit: year.netCashflow,
    unfundedShortfall: year.unfundedShortfall,
    notes: [
      "The projection reports planned spending as one total and does not expose individual spending-category amounts.",
      "Dividend tax is included in income tax by the existing tax model and is not reported separately.",
      "The model does not separately identify bonus, defined benefit pension, annuity, or tax-free pension lump-sum income.",
      "Cash and ISA withdrawals are capital withdrawals, not additional taxable income. GIA disposal proceeds are shown separately; realized gains are reported in the tax calculation.",
    ],
  };
}
