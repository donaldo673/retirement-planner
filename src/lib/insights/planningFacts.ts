import type { InsightInput } from "@/types/insights";
import type { ProjectionYear } from "@/types/retirement";

export interface PlanningFacts extends InsightInput {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  financialIndependenceAge: number | null;
  yearsAheadOfTarget: number | null;
  retirementYear: ProjectionYear | null;
  retirementYears: ProjectionYear[];
  firstShortfall: ProjectionYear | null;
  shortfallYears: number;
  plannedRetirementYears: number;
  fundedRetirementYears: number;
  retirementFundingRatio: number;
  cashflowCoverageRatio: number;
  averageWithdrawalRate: number | null;
  incomeReplacementRatio: number | null;
  estateMultiple: number | null;
  isaShareAtRetirement: number | null;
  pensionIncomeShare: number | null;
  cashReserveYears: number | null;
}

function sumWithdrawals(year: ProjectionYear): number {
  const { cashWithdrawal, giaWithdrawal, isaWithdrawal, pensionWithdrawal } =
    year.withdrawals;
  return (
    cashWithdrawal + giaWithdrawal + isaWithdrawal + pensionWithdrawal
  );
}

export function createPlanningFacts(input: InsightInput): PlanningFacts {
  const { plan, projection } = input;
  const { yearlyResults, summary } = projection;
  const currentAge = plan.people.person1.income.currentAge;
  const { retirementAge, lifeExpectancy } = plan.personalDetails;
  const retirementYear =
    yearlyResults.find((year) => year.age === retirementAge) ?? null;
  const retirementYears = yearlyResults.filter(
    (year) => year.age >= retirementAge && year.age <= lifeExpectancy,
  );
  const shortfallYears = retirementYears.filter(
    (year) => year.unfundedShortfall > 0,
  ).length;
  const firstShortfall =
    yearlyResults.find((year) => year.unfundedShortfall > 0) ?? null;
  const plannedRetirementYears = Math.max(0, lifeExpectancy - retirementAge);
  const fundedRetirementYears =
    summary.ageAssetsRunOut === null
      ? plannedRetirementYears
      : Math.max(
          0,
          Math.min(
            plannedRetirementYears,
            summary.ageAssetsRunOut - retirementAge,
          ),
        );
  const retirementFundingRatio =
    plannedRetirementYears > 0
      ? fundedRetirementYears / plannedRetirementYears
      : summary.ageAssetsRunOut === null
        ? 1
        : 0;
  const cashflowCoverageRatio =
    retirementYears.length > 0
      ? (retirementYears.length - shortfallYears) / retirementYears.length
      : 0;
  const yearsByAge = new Map(
    yearlyResults.map((year) => [year.age, year] as const),
  );
  const withdrawalRates = retirementYears.flatMap((year) => {
    const openingYear = yearsByAge.get(year.periodStartAge);
    const openingInvestableAssets = openingYear
      ? openingYear.totalInvestedAssets + openingYear.cashValue
      : year.totalInvestedAssets + year.cashValue;

    return openingInvestableAssets > 0
      ? [sumWithdrawals(year) / openingInvestableAssets]
      : [];
  });
  const averageWithdrawalRate =
    withdrawalRates.length > 0
      ? withdrawalRates.reduce((total, rate) => total + rate, 0) /
        withdrawalRates.length
      : null;
  const yearBeforeRetirement = retirementYear
    ? yearsByAge.get(retirementYear.periodStartAge)
    : undefined;
  const incomeReplacementRatio =
    retirementYear && yearBeforeRetirement?.totalIncome
      ? retirementYear.totalIncome / yearBeforeRetirement.totalIncome
      : null;
  const estateMultiple =
    summary.totalRetirementSpending > 0
      ? summary.finalEstateValue / summary.totalRetirementSpending
      : null;
  const retirementInvestableAssets = retirementYear
    ? retirementYear.totalInvestedAssets + retirementYear.cashValue
    : 0;
  const isaShareAtRetirement =
    retirementInvestableAssets > 0 && retirementYear
      ? retirementYear.isaValue / retirementInvestableAssets
      : null;
  const retirementIncome = retirementYears.reduce(
    (total, year) => total + year.totalIncome,
    0,
  );
  const pensionDrawdownIncome = retirementYears.reduce(
    (total, year) => total + year.pensionDrawdownIncome,
    0,
  );
  const pensionIncomeShare =
    retirementIncome > 0 ? pensionDrawdownIncome / retirementIncome : null;
  const retirementOutgo = retirementYear
    ? retirementYear.spending + retirementYear.mortgagePayment
    : 0;
  const cashReserveYears =
    retirementOutgo > 0 && retirementYear
      ? retirementYear.cashValue / retirementOutgo
      : null;
  const financialIndependenceAge = summary.financialIndependenceAge;
  const yearsAheadOfTarget =
    financialIndependenceAge === null
      ? null
      : retirementAge - financialIndependenceAge;

  return {
    ...input,
    currentAge,
    retirementAge,
    lifeExpectancy,
    financialIndependenceAge,
    yearsAheadOfTarget,
    retirementYear,
    retirementYears,
    firstShortfall,
    shortfallYears,
    plannedRetirementYears,
    fundedRetirementYears,
    retirementFundingRatio,
    cashflowCoverageRatio,
    averageWithdrawalRate,
    incomeReplacementRatio,
    estateMultiple,
    isaShareAtRetirement,
    pensionIncomeShare,
    cashReserveYears,
  };
}
