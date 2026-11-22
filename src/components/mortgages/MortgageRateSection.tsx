"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { NumberField } from "@/components/forms/number-field";
import { PercentageField } from "@/components/forms/percentage-field";
import { InfoTip } from "@/components/mortgages/InfoTip";
import { getAssumedFutureMortgageRate } from "@/lib/mortgages/mortgagePreview";
import type { RetirementPlan } from "@/types/retirement";

const rateFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function MortgageRateSection() {
  const { control, register } = useFormContext<RetirementPlan>();
  const mortgage = useWatch({ control, name: "assets.mortgage" });
  const configuration = useWatch({
    control,
    name: "mortgageConfiguration",
  });
  const assumedFutureRate = getAssumedFutureMortgageRate(
    mortgage,
    configuration,
  );

  return (
    <section
      aria-labelledby="future-mortgage-assumption-heading"
      className="space-y-4"
    >
      <div>
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          id="future-mortgage-assumption-heading"
        >
          Future Mortgage Assumption
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Set assumptions for an illustrative payoff estimate. These rates do
          not change the retirement projection.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PercentageField
          label="Current Fixed Rate"
          min={0}
          max={100}
          name="mortgageConfiguration.currentFixedRate"
        />
        <NumberField
          label="Months Remaining on Fixed Rate"
          max={1200}
          min={0}
          name="mortgageConfiguration.fixedMonthsRemaining"
          step={1}
          suffix="months"
        />
      </div>
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        If remortgaging is enabled, the mortgage moves to the assumed future
        rate when the introductory rate ends.
      </p>

      <label className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 dark:bg-slate-800/70 dark:text-slate-100">
        <input
          className="size-4 accent-teal-700"
          type="checkbox"
          {...register("mortgageConfiguration.assumeRemortgage")}
        />
        Assume remortgage
      </label>

      {configuration.assumeRemortgage && (
        <div className="space-y-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <label className="form-label mb-0" htmlFor="future-rate-method">
                Future Rate Method
              </label>
              <InfoTip label="future mortgage rates">
                Future rates can change the illustrative mortgage payoff
                estimate. The retirement projection continues using its
                existing current-rate calculation.
              </InfoTip>
            </div>
            <select
              className="form-control mt-2"
              id="future-rate-method"
              {...register("mortgageConfiguration.futureRateMethod")}
            >
              <option value="base-plus-margin">Base Rate + Margin</option>
              <option value="keep-current-rate">Keep Current Rate</option>
              <option value="manual-rate">Manual Rate</option>
            </select>
          </div>

          {configuration.futureRateMethod === "base-plus-margin" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <PercentageField
                description="A planning assumption before the lender margin, not a Bank of England rate forecast."
                label="Base Rate"
                min={0}
                max={100}
                name="mortgageConfiguration.baseRate"
              />
              <PercentageField
                description="The lender margin added to the planning base rate."
                label="Plus Margin"
                min={0}
                max={100}
                name="mortgageConfiguration.margin"
              />
            </div>
          )}

          {configuration.futureRateMethod === "manual-rate" && (
            <PercentageField
              label="Future Mortgage Rate"
              min={0}
              max={100}
              name="mortgageConfiguration.futureMortgageRate"
            />
          )}
        </div>
      )}

      <div
        aria-live="polite"
        className="rounded-xl border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950/30"
      >
        <p className="text-xs font-medium text-teal-900 dark:text-teal-200">
          Projected Future Rate
        </p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-teal-950 dark:text-teal-100">
          {rateFormatter.format(assumedFutureRate)}
        </p>
      </div>
    </section>
  );
}
