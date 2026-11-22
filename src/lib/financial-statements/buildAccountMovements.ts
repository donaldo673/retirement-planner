import type { ProjectionYear } from "@/types/retirement";
import type {
  AnnualAccountMovement,
  PensionAnalysis,
} from "@/types/financialStatements";

function movement(
  account: AnnualAccountMovement["account"],
  openingBalance: number,
  contributions: number,
  withdrawals: number,
  closingBalance: number,
  note?: string,
): AnnualAccountMovement {
  const investmentGrowth =
    closingBalance - openingBalance - (contributions - withdrawals);

  return {
    account,
    openingBalance,
    contributions,
    withdrawals,
    investmentGrowth,
    closingBalance,
    netChange: closingBalance - openingBalance,
    payment: null,
    note,
  };
}

export function buildAccountMovements(
  openingYear: ProjectionYear,
  year: ProjectionYear,
): AnnualAccountMovement[] {
  return [
    movement(
      "cash",
      openingYear.cashValue,
      Math.max(0, year.accountNetContributions.cash),
      year.withdrawals.cashWithdrawal,
      year.cashValue,
    ),
    movement(
      "isa",
      openingYear.isaValue,
      year.contributions.isaContribution,
      year.withdrawals.isaWithdrawal,
      year.isaValue,
    ),
    movement(
      "pension",
      openingYear.pensionValue,
      year.contributions.pensionContribution,
      year.withdrawals.pensionWithdrawal,
      year.pensionValue,
      "Pension withdrawals are treated as taxable drawdown by the existing model; tax-free lump sums are not separated.",
    ),
    movement(
      "gia",
      openingYear.giaValue,
      year.contributions.giaContribution,
      year.withdrawals.giaWithdrawal,
      year.giaValue,
      "GIA withdrawals are disposal proceeds; any realized gains are recorded separately for tax.",
    ),
    {
      account: "property",
      openingBalance: null,
      contributions: null,
      withdrawals: null,
      investmentGrowth: null,
      closingBalance: null,
      netChange: null,
      payment: null,
      note: "Property value and growth are not included in the projection.",
    },
    {
      account: "mortgage",
      openingBalance: openingYear.mortgageBalance,
      contributions: null,
      withdrawals: null,
      investmentGrowth: null,
      closingBalance: year.mortgageBalance,
      netChange: year.mortgageBalance - openingYear.mortgageBalance,
      payment: year.mortgagePayment,
      note: "Mortgage payment is shown separately; principal and interest portions are not exposed.",
    },
  ];
}

export function buildPensionAnalysis(
  openingYear: ProjectionYear,
  year: ProjectionYear,
): PensionAnalysis {
  return {
    openingValue: openingYear.pensionValue,
    investmentGrowth: year.accountInvestmentIncome.pension,
    contributions: year.contributions.pensionContribution,
    taxableWithdrawals: year.withdrawals.pensionWithdrawal,
    taxFreeWithdrawals: null,
    closingValue: year.pensionValue,
    remainingBalance: year.pensionValue,
    note: "The existing projection does not split pension drawdown into taxable and tax-free portions; the recorded drawdown is treated as taxable pension income.",
  };
}
