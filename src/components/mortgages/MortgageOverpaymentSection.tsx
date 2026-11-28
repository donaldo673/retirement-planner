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
    configuration.annualMortgageOverpaymentTarget > 0;
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
          Set an annual target; the projection only overpays from surplus funds
          remaining after spending, mortgage payments, and the target ISA
          contribution.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Annual Mortgage Overpayment Target (£)"
          name="mortgageConfiguration.annualMortgageOverpaymentTarget"
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
        The payoff estimate assumes the target is affordable each year. The
        retirement projection limits overpayments to the surplus actually
        available after planned spending and contributions.
      </p>
    </section>
  );
}
