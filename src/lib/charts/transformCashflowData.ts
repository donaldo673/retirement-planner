import type { ProjectionYear } from "@/types/retirement";
import type { CashflowPoint } from "@/types/charts";

export function transformCashflowData(
  yearlyResults: readonly ProjectionYear[],
  retirementAge: number,
): CashflowPoint[] {
  return yearlyResults
    .filter((year) => year.age >= retirementAge)
    .map((year) => ({
      age: year.age,
      income: year.totalIncome,
      tax: year.tax.totalTax,
      spending: year.spending + year.mortgagePayment,
      netCashflow: year.netCashflow,
    }));
}
