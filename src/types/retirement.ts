export type HouseholdType = "single" | "joint";

export type ScenarioType = "conservative" | "expected" | "optimistic";

export type WithdrawalSource = "cash" | "gia" | "isa" | "pension";

export type ProjectionStatus = "green" | "amber" | "red";

export interface PersonalDetails {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  statePensionAge: number;
  householdType: HouseholdType;
}

export interface InvestmentAccount {
  currentValue: number;
  monthlyContribution: number;
}

export interface CashAccount {
  currentValue: number;
}

export interface OtherAssets {
  currentValue: number;
}

export interface Mortgage {
  outstandingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  mortgageEndAge: number;
}

export interface Assets {
  isa: InvestmentAccount;
  pension: InvestmentAccount;
  gia: InvestmentAccount;
  cash: CashAccount;
  otherAssets: OtherAssets;
  mortgage: Mortgage;
}

export interface EmploymentIncome {
  currentSalary: number;
  annualSalaryGrowthRate: number;
  workUntilAge: number;
}

export interface OtherIncome {
  rentalIncome: number;
  otherIncome: number;
}

export interface StatePension {
  annualAmount: number;
}

export interface Income {
  employment: EmploymentIncome;
  otherIncome: OtherIncome;
  statePension: StatePension;
}

export interface SpendingBucket {
  id: string;
  name: string;
  annualAmount: number;
  inflationRate: number;
  startAge: number;
  endAge: number;
}

export interface SpendingPlan {
  buckets: SpendingBucket[];
}

export interface Assumptions {
  isaReturn: number;
  pensionReturn: number;
  giaReturn: number;
  cashReturn: number;
  inflationRate: number;
}

export interface Scenario {
  name: ScenarioType;
  returnAdjustment: number;
}

export interface RetirementPlan {
  personalDetails: PersonalDetails;
  assets: Assets;
  income: Income;
  spending: SpendingPlan;
  assumptions: Assumptions;
  scenario: ScenarioType;
  withdrawalOrder: WithdrawalSource[];
}

export interface ContributionBreakdown {
  isaContribution: number;
  pensionContribution: number;
  giaContribution: number;
}

export interface WithdrawalBreakdown {
  cashWithdrawal: number;
  giaWithdrawal: number;
  isaWithdrawal: number;
  pensionWithdrawal: number;
}

export interface ProjectionYear {
  age: number;
  periodStartAge: number;

  salaryIncome: number;
  rentalIncome: number;
  otherIncome: number;
  statePensionIncome: number;
  totalIncome: number;

  spending: number;
  mortgagePayment: number;
  mortgageBalance: number;
  contributions: ContributionBreakdown;
  withdrawals: WithdrawalBreakdown;
  unfundedShortfall: number;

  investmentGrowth: number;
  netCashflow: number;

  isaValue: number;
  pensionValue: number;
  giaValue: number;
  cashValue: number;
  otherAssetsValue: number;
  totalInvestedAssets: number;
  netWorth: number;
}

export interface RetirementSummary {
  currentNetWorth: number;
  retirementNetWorth: number;
  finalEstateValue: number;
  ageAssetsRunOut: number | null;
  financialIndependenceAge: number | null;
  totalRetirementSpending: number;
  status: ProjectionStatus;
}

export interface ProjectionResult {
  scenario: ScenarioType;
  effectiveAssumptions: Assumptions;
  yearlyResults: ProjectionYear[];
  summary: RetirementSummary;
}

export interface TaxInputs {
  earnedIncome: number;
  pensionIncome: number;
  statePensionIncome: number;
  dividendIncome: number;
  capitalGains: number;
  pensionDrawdown: number;
}

export interface TaxResult {
  incomeTax: number;
  nationalInsurance: number;
  statePensionTax: number;
  pensionDrawdownTax: number;
  dividendTax: number;
  capitalGainsTax: number;
  totalTax: number;
}

export interface TaxEngine {
  calculateIncomeTax(inputs: TaxInputs): number;
  calculateNationalInsurance(inputs: TaxInputs): number;
  calculateStatePensionTaxation(inputs: TaxInputs): number;
  calculatePensionDrawdownTaxation(inputs: TaxInputs): number;
  calculateDividendTax(inputs: TaxInputs): number;
  calculateCapitalGainsTax(inputs: TaxInputs): number;
}

export interface SimulationInputs {
  simulations: number;
  expectedReturn: number;
  volatility: number;
}

export interface SimulationOutcome {
  success: boolean;
  endingValue: number;
  ageAssetsRunOut: number | null;
}

export interface SimulationResult {
  successRate: number;
  medianEndingValue: number;
  bestCaseEndingValue: number;
  worstCaseEndingValue: number;
  outcomes: SimulationOutcome[];
}

export type MonteCarloSimulator = (
  inputs: SimulationInputs,
  plan: RetirementPlan,
) => SimulationResult;

export interface SavedPlan {
  version: number;
  savedAt: string;
  plan: RetirementPlan;
}
