import type {
  ProjectionYear,
  RetirementPlan,
} from "@/types/retirement";
import type {
  BalanceSheet,
  BalanceSheetPosition,
} from "@/types/financialStatements";

function buildPosition(
  year: ProjectionYear,
  plan: RetirementPlan,
): BalanceSheetPosition {
  const assets = {
    cash: year.cashValue,
    isa: year.isaValue,
    pension: year.pensionValue,
    gia: year.giaValue,
    otherAssets: year.otherAssetsValue,
  };

  return {
    age: year.age,
    assets: {
      ...assets,
      totalProjectedAssets: Object.values(assets).reduce(
        (total, amount) => total + amount,
        0,
      ),
      propertyMemoValue: plan.propertyInformation.estimatedValue,
    },
    liabilities: {
      mortgage: year.mortgageBalance,
      otherDebt: null,
      totalModeledLiabilities: year.mortgageBalance,
    },
    netWorth: year.netWorth,
  };
}

export function buildBalanceSheet(
  openingYear: ProjectionYear,
  closingYear: ProjectionYear,
  plan: RetirementPlan,
): BalanceSheet {
  return {
    opening: buildPosition(openingYear, plan),
    closing: buildPosition(closingYear, plan),
    notes: [
      "Property is shown at its entered value as a memo item only; it is not included in projected assets or net worth and is not grown over time.",
      "Other debt is not represented in the existing retirement projection.",
    ],
  };
}
