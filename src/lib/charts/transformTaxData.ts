import type { ProjectionYear } from "@/types/retirement";
import type { TaxAnalysisData } from "@/types/charts";

export function transformTaxData(
  yearlyResults: readonly ProjectionYear[],
): TaxAnalysisData {
  const lifetimeYears = yearlyResults.slice(1);
  const categories = [
    {
      name: "Income tax (including dividend tax)",
      color: "var(--chart-income-tax)",
      amount: lifetimeYears.reduce(
        (total, year) => total + year.tax.incomeTax,
        0,
      ),
    },
    {
      name: "National Insurance",
      color: "var(--chart-national-insurance)",
      amount: lifetimeYears.reduce(
        (total, year) => total + year.tax.nationalInsurance,
        0,
      ),
    },
    {
      name: "Capital Gains Tax",
      color: "var(--chart-capital-gains-tax)",
      amount: lifetimeYears.reduce(
        (total, year) => total + year.tax.capitalGainsTax,
        0,
      ),
    },
  ];

  return {
    totalTax: lifetimeYears.reduce(
      (total, year) => total + year.tax.totalTax,
      0,
    ),
    categories,
  };
}
