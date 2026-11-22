"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { InfoTip } from "@/components/mortgages/InfoTip";
import type { RetirementPlan } from "@/types/retirement";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function MortgageInterestOnlySection() {
  const { control, register } = useFormContext<RetirementPlan>();
  const balance = useWatch({
    control,
    name: "assets.mortgage.outstandingBalance",
  });

  return (
    <section
      aria-labelledby="interest-only-strategy-heading"
      className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20"
    >
      <div>
        <div className="flex items-center gap-1.5">
          <h3
            className="text-sm font-semibold text-amber-950 dark:text-amber-100"
            id="interest-only-strategy-heading"
          >
            Interest-only repayment strategy
          </h3>
          <InfoTip label="an interest-only mortgage">
            Monthly payments usually cover interest, so the original balance
            needs a separate repayment plan.
          </InfoTip>
        </div>
        <p className="mt-1 text-xs leading-5 text-amber-900 dark:text-amber-200">
          This mortgage balance is not automatically repaid during the term
          under a true interest-only arrangement.
        </p>
      </div>
      <div className="min-w-0">
        <label
          className="form-label"
          htmlFor="mortgage-repayment-strategy"
        >
          Expected Repayment Strategy
        </label>
        <select
          className="form-control"
          id="mortgage-repayment-strategy"
          {...register("mortgageConfiguration.repaymentStrategy")}
        >
          <option value="sale-of-property">Sale of Property</option>
          <option value="investments">Investments</option>
          <option value="pension-lump-sum">Pension Lump Sum</option>
          <option value="other">Other</option>
        </select>
      </div>
      <p className="text-xs leading-5 text-amber-900 dark:text-amber-200">
        Balance to plan for:{" "}
        {Number.isFinite(balance) ? currencyFormatter.format(balance) : "—"}
      </p>
      <p className="text-xs leading-5 text-amber-900 dark:text-amber-200">
        The existing retirement projection still uses its current mortgage
        repayment calculation; this repayment type and strategy are saved for
        planning but do not change that calculation.
      </p>
    </section>
  );
}
