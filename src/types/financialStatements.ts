import type { PersonKey } from "@/types/retirement";

export type StatementView = "profit-loss" | "balance-sheet" | "combined";

export type FinancialAccount =
  | "cash"
  | "isa"
  | "pension"
  | "gia"
  | "property"
  | "mortgage";

export interface StatementLineItem {
  label: string;
  amount: number | null;
  note?: string;
}

export interface IncomeBreakdown {
  employmentIncome: number;
  secondEmploymentIncome: number;
  rentalIncome: number;
  statePensionIncome: number;
  pensionDrawdown: number;
  interestIncome: number;
  dividendIncome: number;
  otherTaxableIncome: number;
  grossIncome: number;
  taxableIncomeTotal: number;
  unsupportedSources: string[];
}

export interface TaxBreakdown {
  incomeTax: number;
  capitalGainsTax: number;
  dividendTax: number | null;
  nationalInsurance: number;
  otherTaxes: number | null;
  totalTax: number;
  effectiveTaxRate: number | null;
  marginalRates: Array<{ person: PersonKey; rate: number }>;
  taxableIncomeSources: StatementLineItem[];
  bandUsage: string | null;
}

export interface SpendingBreakdown {
  plannedSpending: number;
  mortgagePayments: number;
  totalSpending: number;
  categoryBreakdown: null;
}

export interface ProfitLossStatement {
  age: number;
  periodStartAge: number;
  taxYear: number;
  isBaselineSnapshot: boolean;
  income: IncomeBreakdown;
  taxFreeWithdrawals: {
    cash: number;
    isa: number;
    total: number;
    giaDisposalProceeds: number;
    unsupportedSources: string[];
  };
  tax: TaxBreakdown;
  spending: SpendingBreakdown;
  grossIncome: number;
  netSurplusDeficit: number;
  unfundedShortfall: number;
  notes: string[];
}

export interface BalanceSheetPosition {
  age: number;
  assets: {
    cash: number;
    isa: number;
    pension: number;
    gia: number;
    otherAssets: number;
    totalProjectedAssets: number;
    propertyMemoValue: number;
  };
  liabilities: {
    mortgage: number;
    otherDebt: null;
    totalModeledLiabilities: number;
  };
  netWorth: number;
}

export interface BalanceSheet {
  opening: BalanceSheetPosition;
  closing: BalanceSheetPosition;
  notes: string[];
}

export interface AccountMovement {
  account: FinancialAccount;
  openingBalance: number | null;
  contributions: number | null;
  targetContribution?: number;
  mortgageGIARepayment?: number;
  withdrawals: number | null;
  investmentGrowth: number | null;
  closingBalance: number | null;
  netChange: number | null;
  payment: number | null;
  note?: string;
}

export type AnnualAccountMovement = AccountMovement;

export interface PensionAnalysis {
  openingValue: number;
  investmentGrowth: number;
  contributions: number;
  taxableWithdrawals: number;
  taxFreeWithdrawals: null;
  closingValue: number;
  remainingBalance: number;
  note: string;
}

export interface NetWorthReconciliation {
  openingNetWorth: number;
  investmentGrowth: number;
  netAccountContributions: number;
  mortgageLiabilityReduction: number;
  otherAssetsMovement: number;
  closingNetWorth: number;
  unreconciledDifference: number;
  isReconciled: boolean;
}

export interface CashflowWaterfall {
  grossIncome: number;
  tax: number;
  netIncome: number;
  plannedSpending: number;
  mortgagePayments: number;
  netSurplusDeficit: number;
  netAccountMovement: number;
}

export interface AnnualStatement {
  age: number;
  periodStartAge: number;
  taxYear: number;
  isBaselineSnapshot: boolean;
  profitLoss: ProfitLossStatement;
  balanceSheet: BalanceSheet;
  accountMovements: AnnualAccountMovement[];
  pensionAnalysis: PensionAnalysis;
  reconciliation: NetWorthReconciliation;
  cashflowWaterfall: CashflowWaterfall;
}

export type AnnualProfitLossStatement = ProfitLossStatement;
export type AnnualBalanceSheet = BalanceSheet;
export type AnnualFinancialStatement = AnnualStatement;
