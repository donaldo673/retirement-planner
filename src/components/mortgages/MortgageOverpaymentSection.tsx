"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { NumberField } from "@/components/forms/number-field";
import { estimateMortgagePayoffAge } from "@/lib/mortgages/mortgagePreview";
import type { RetirementPlan } from "@/types/retirement";

interface MortgageOverpaymentSectionProps {
  currentAge: number;
}

export function MortgageOverpaymentSection({
  currentAge,
}: MortgageOverpaymentSectionProps) {
  const { control } = useFormContext<RetirementPlan>();
  const mortgage = useWatch({ control, name: "assets.mortgage" });
  const configuration = useWatch({
    control,
    name: "mortgageConfiguration",
  });
  const currentPayoffAge = estimateMortgagePayoffAge(
    mortgage,
    configuration,
    currentAge,
    false,
  );
  const payoffWithOverpayments = estimateMortgagePayoffAge(
    mortgage,
    configuration,
    currentAge,
    true,
  );

  const overpaymentsAreConfigured =
    configuration.monthlyOverpayment > 0 ||
    configuration.annualLumpSumOverpayment > 0;
  const yearsSaved =
    currentPayoffAge !== null && payoffWithOverpayments !== null
      ? currentPayoffAge - payoffWithOverpayments
      : null;

  return (
    <section aria-labelledby="mortgage-overpayments-heading" className="space-y-4">
      <div>
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          id="mortgage-overpayments-heading"
        >
          Overpayments
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Add optional extra payments to see an illustrative payoff estimate.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Monthly Overpayment"
          name="mortgageConfiguration.monthlyOverpayment"
          prefix="£"
          suffix="/ month"
        />
        <NumberField
          label="Annual Lump Sum Overpayment"
          name="mortgageConfiguration.annualLumpSumOverpayment"
          prefix="£"
          suffix="/ year"
        />
      </div>

      {configuration.repaymentType === "interest-only" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          The payoff estimate is not shown for interest-only mortgages. Any
          overpayment treatment depends on the lender and repayment terms.
        </p>
      ) : overpaymentsAreConfigured && yearsSaved !== null ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            Mortgage Paid Off Earlier
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-300">
            Estimated payoff: age {currentPayoffAge} without overpayments and
            age {payoffWithOverpayments} with them
            {yearsSaved > 0
              ? ` (about ${yearsSaved} ${yearsSaved === 1 ? "year" : "years"} earlier).`
              : "."}
          </p>
        </div>
      ) : overpaymentsAreConfigured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          The illustrative estimate does not show the balance paid off before
          the mortgage end age.
        </p>
      ) : (
        <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
          Add an overpayment to estimate how much sooner the mortgage could be
          paid off.
        </p>
      )}
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        This estimate uses the entered payment and rate assumptions. It is
        separate from, and does not change, the retirement projection.
      </p>
    </section>
  );
}
