export type HouseholdType = "single" | "joint";

export type ScenarioType = "conservative" | "expected" | "optimistic";

export type WithdrawalSource = "cash" | "gia" | "isa" | "pension";

export type ProjectionStatus = "green" | "amber" | "red";

export type TaxJurisdiction = "england" | "scotland" | "wales" | "northern-ireland";

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

export interface GeneralInvestmentAccount extends InvestmentAccount {
  costBasis: number;
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
  gia: GeneralInvestmentAccount;
  cash: CashAccount;
  otherAssets: OtherAssets;
  mortgage: Mortgage;
}

export interface EmploymentIncome {
  currentSalary: number;
  annualSalaryGrowthRate: number;
  workUntilAge: number;
}

export interface SecondEmploymentIncome {
  currentSalary: number;
  annualSalaryGrowthRate: number;
  startAge: number;
  endAge: number;
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
  secondEmployment: SecondEmploymentIncome;
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
  isaRealReturn: number;
  pensionRealReturn: number;
  giaInterestRealYield: number;
  giaDividendRealYield: number;
  giaCapitalGrowthRealYield: number;
  cashInterestRealYield: number;
  inflationRate: number;
}

export interface TaxSettings {
  jurisdiction: TaxJurisdiction;
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
  taxSettings: TaxSettings;
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
  taxYear: number;

  salaryIncome: number;
  secondSalaryIncome: number;
  rentalIncome: number;
  otherIncome: number;
  statePensionIncome: number;
  interestIncome: number;
  dividendIncome: number;
  pensionDrawdownIncome: number;
  realizedCapitalGains: number;
  totalIncome: number;
  tax: TaxResult;

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
  giaCostBasis: number;
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
  taxYear: number;
  inflationRate: number;
  jurisdiction: TaxJurisdiction;
  age: number;
  statePensionAge: number;
  employmentIncomes: number[];
  rentalProfit: number;
  otherTaxableIncome: number;
  pensionIncome: number;
  statePensionIncome: number;
  savingsInterest: number;
  dividendIncome: number;
  capitalGains: number;
}

export interface TaxResult {
  incomeTax: number;
  nationalInsurance: number;
  capitalGainsTax: number;
  totalTax: number;
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
