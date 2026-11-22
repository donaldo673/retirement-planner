import type {
  ProjectionResult,
  ProjectionYear,
  RetirementPlan,
} from "@/types/retirement";
import type {
  AnnualStatement,
  AnnualAccountMovement,
  NetWorthReconciliation,
} from "@/types/financialStatements";
import { buildAccountMovements, buildPensionAnalysis } from "./buildAccountMovements";
import { buildBalanceSheet } from "./buildBalanceSheet";
import { buildProfitLossStatement } from "./buildProfitLossStatement";

function getNetAccountContributions(year: ProjectionYear): number {
  return Object.values(year.accountNetContributions).reduce(
    (total, amount) => total + amount,
    0,
  );
}

function buildReconciliation(
  openingYear: ProjectionYear,
  year: ProjectionYear,
  accountMovements: AnnualAccountMovement[],
): NetWorthReconciliation {
  const netAccountContributions = getNetAccountContributions(year);
  const retainedInvestmentGrowth = accountMovements.reduce(
    (total, movement) => total + (movement.investmentGrowth ?? 0),
    0,
  );
  const mortgageLiabilityReduction =
    openingYear.mortgageBalance - year.mortgageBalance;
  const otherAssetsMovement =
    year.otherAssetsValue - openingYear.otherAssetsValue;
  const expectedClosingNetWorth =
    openingYear.netWorth +
    retainedInvestmentGrowth +
    netAccountContributions +
    mortgageLiabilityReduction +
    otherAssetsMovement;
  const unreconciledDifference = year.netWorth - expectedClosingNetWorth;

  return {
    openingNetWorth: openingYear.netWorth,
    investmentGrowth: retainedInvestmentGrowth,
    netAccountContributions,
    mortgageLiabilityReduction,
    otherAssetsMovement,
    closingNetWorth: year.netWorth,
    unreconciledDifference,
    isReconciled: Math.abs(unreconciledDifference) <= 0.01,
  };
}

function findYear(
  projection: ProjectionResult,
  age: number,
): { year: ProjectionYear; openingYear: ProjectionYear } {
  const index = projection.yearlyResults.findIndex((year) => year.age === age);
  if (index < 0) {
    throw new RangeError(`No projection results are available for age ${age}.`);
  }

  const year = projection.yearlyResults[index];
  const openingYear = projection.yearlyResults[Math.max(0, index - 1)];
  if (!year || !openingYear) {
    throw new Error(`Projection results are incomplete for age ${age}.`);
  }

  return { year, openingYear };
}

export function buildAnnualStatement(
  projection: ProjectionResult,
  plan: RetirementPlan,
  age: number,
): AnnualStatement {
  const { year, openingYear } = findYear(projection, age);
  const balanceSheet = buildBalanceSheet(openingYear, year, plan);
  const accountMovements = buildAccountMovements(openingYear, year);
  const netAccountMovement = getNetAccountContributions(year);

  return {
    age: year.age,
    periodStartAge: year.periodStartAge,
    taxYear: year.taxYear,
    isBaselineSnapshot: year.age === year.periodStartAge,
    profitLoss: buildProfitLossStatement(year, plan),
    balanceSheet,
    accountMovements,
    pensionAnalysis: buildPensionAnalysis(openingYear, year),
    reconciliation: buildReconciliation(openingYear, year, accountMovements),
    cashflowWaterfall: {
      grossIncome: year.totalIncome,
      tax: year.tax.totalTax,
      netIncome: year.totalIncome - year.tax.totalTax,
      plannedSpending: year.spending,
      mortgagePayments: year.mortgagePayment,
      netSurplusDeficit: year.netCashflow,
      netAccountMovement,
    },
  };
}
