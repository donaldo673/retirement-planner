"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { MortgageInterestOnlySection } from "@/components/mortgages/MortgageInterestOnlySection";
import { MortgageOverpaymentSection } from "@/components/mortgages/MortgageOverpaymentSection";
import { MortgageRateSection } from "@/components/mortgages/MortgageRateSection";
import { ProgressiveDisclosure } from "@/components/mortgages/ProgressiveDisclosure";
import { NumberField } from "@/components/forms/number-field";
import { PercentageField } from "@/components/forms/percentage-field";
import { calculateNetMonthlyRentalProfit } from "@/lib/mortgages/mortgagePreview";
import type { RetirementPlan } from "@/types/retirement";

interface MortgageAdvancedOptionsProps {
  currentAge: number;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return Number.isFinite(value) ? currencyFormatter.format(value) : "—";
}

export function MortgageAdvancedOptions({
  currentAge,
}: MortgageAdvancedOptionsProps) {
  const { control } = useFormContext<RetirementPlan>();
  const configuration = useWatch({
    control,
    name: "mortgageConfiguration",
  });
  const netRentalProfit = calculateNetMonthlyRentalProfit(configuration);

  return (
    <ProgressiveDisclosure title="Advanced Options">
      <div className="space-y-6">
        <MortgageRateSection />
        <div className="border-t border-slate-200 dark:border-slate-700" />
        <MortgageOverpaymentSection currentAge={currentAge} />

        {configuration.repaymentType === "interest-only" && (
          <>
            <div className="border-t border-slate-200 dark:border-slate-700" />
            <MortgageInterestOnlySection />
          </>
        )}

        {configuration.type === "buy-to-let" && (
          <>
            <div className="border-t border-slate-200 dark:border-slate-700" />
            <section
              aria-labelledby="buy-to-let-costs-heading"
              className="space-y-4"
            >
              <div>
                <h3
                  className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                  id="buy-to-let-costs-heading"
                >
                  Buy to Let Assumptions
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Enter monthly amounts. Net profit is before tax and mortgage
                  payments.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <NumberField
                  label="Rental Income"
                  name="mortgageConfiguration.rentalIncome"
                  prefix="£"
                  suffix="/ month"
                />
                <NumberField
                  label="Management Costs"
                  name="mortgageConfiguration.managementCosts"
                  prefix="£"
                  suffix="/ month"
                />
                <NumberField
                  label="Maintenance Costs"
                  name="mortgageConfiguration.maintenanceCosts"
                  prefix="£"
                  suffix="/ month"
                />
                <PercentageField
                  description="The share of rental income allowed for time without a tenant."
                  label="Void Period Allowance"
                  max={100}
                  min={0}
                  name="mortgageConfiguration.voidPeriodAllowance"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Net Monthly Profit (before tax and mortgage)
                </p>
                <p
                  aria-live="polite"
                  className={`mt-1 text-lg font-semibold tabular-nums ${
                    netRentalProfit >= 0
                      ? "text-emerald-800 dark:text-emerald-300"
                      : Number.isFinite(netRentalProfit)
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {formatCurrency(netRentalProfit)}
                </p>
              </div>
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Buy-to-let assumptions are saved for planning but are not added
                to the existing income, tax, or retirement projections.
              </p>
            </section>
          </>
        )}
      </div>
    </ProgressiveDisclosure>
  );
}
