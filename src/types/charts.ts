export interface ProjectionPoint {
  age: number;
  netWorth: number;
}

export interface AssetAllocationPoint {
  age: number;
  pension: number;
  isa: number;
  gia: number;
  cash: number;
}

export interface CashflowPoint {
  age: number;
  income: number;
  tax: number;
  spending: number;
  netCashflow: number;
}

export interface TaxCategory {
  name: string;
  amount: number;
  color: string;
}

export interface TaxAnalysisData {
  totalTax: number;
  categories: TaxCategory[];
}

export type ChartRange = "1" | "5" | "10" | "all";
