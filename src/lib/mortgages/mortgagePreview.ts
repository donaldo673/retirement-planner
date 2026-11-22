import type { Mortgage, MortgageConfiguration } from "@/types/retirement";

export function getAssumedFutureMortgageRate(
  mortgage: Mortgage,
  configuration: MortgageConfiguration,
): number {
  if (!configuration.assumeRemortgage) {
    return mortgage.interestRate;
  }

  switch (configuration.futureRateMethod) {
    case "base-plus-margin":
      return configuration.baseRate + configuration.margin;
    case "keep-current-rate":
      return mortgage.interestRate;
    case "manual-rate":
      return configuration.futureMortgageRate;
  }
}

export function estimateMortgagePayoffAge(
  mortgage: Mortgage,
  configuration: MortgageConfiguration,
  currentAge: number,
  includeOverpayments: boolean,
): number | null {
  if (mortgage.outstandingBalance <= 0) {
    return currentAge;
  }

  if (configuration.repaymentType === "interest-only") {
    return null;
  }

  const monthsUntilMaturity = Math.max(
    0,
    Math.round((mortgage.mortgageEndAge - currentAge) * 12),
  );
  let balance = mortgage.outstandingBalance;

  for (let month = 0; month < monthsUntilMaturity; month += 1) {
    const annualRate =
      month < configuration.fixedMonthsRemaining
        ? configuration.currentFixedRate
        : getAssumedFutureMortgageRate(mortgage, configuration);
    const interest = balance * (annualRate / 12);
    const plannedPayment =
      mortgage.monthlyPayment +
      (includeOverpayments ? configuration.monthlyOverpayment : 0);
    const payment = Math.min(balance + interest, plannedPayment);
    balance += interest - payment;

    if (
      includeOverpayments &&
      (month + 1) % 12 === 0 &&
      configuration.annualLumpSumOverpayment > 0
    ) {
      balance = Math.max(
        0,
        balance - configuration.annualLumpSumOverpayment,
      );
    }

    if (balance <= 0.01) {
      return currentAge + Math.ceil((month + 1) / 12);
    }
  }

  return mortgage.mortgageEndAge;
}

export function calculateNetMonthlyRentalProfit(
  configuration: MortgageConfiguration,
): number {
  return (
    configuration.rentalIncome * (1 - configuration.voidPeriodAllowance) -
    configuration.managementCosts -
    configuration.maintenanceCosts
  );
}
