"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { NumberField } from "@/components/forms/number-field";
import { PercentageField } from "@/components/forms/percentage-field";
import { InfoTip } from "@/components/mortgages/InfoTip";
import type { RetirementPlan } from "@/types/retirement";

interface MortgageBasicFieldsProps {
  currentAge: number;
}

export function MortgageBasicFields({
  currentAge,
}: MortgageBasicFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RetirementPlan>();
  const configurationErrors = errors.mortgageConfiguration;
  const repaymentType = useWatch({
    control,
    name: "mortgageConfiguration.repaymentType",
  });

  return (
    <fieldset className="min-w-0 rounded-2xl border border-slate-200 p-4 sm:p-5 dark:border-slate-700">
      <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Mortgage details
      </legend>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <label className="form-label" htmlFor="mortgage-name">
            Mortgage name
          </label>
          <input
            aria-invalid={Boolean(configurationErrors?.name?.message)}
            className="form-control"
            id="mortgage-name"
            maxLength={80}
            {...register("mortgageConfiguration.name")}
          />
          {configurationErrors?.name?.message && (
            <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
              {configurationErrors.name.message}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <label className="form-label" htmlFor="mortgage-type">
            Mortgage type
          </label>
          <select
            className="form-control"
            id="mortgage-type"
            {...register("mortgageConfiguration.type")}
          >
            <option value="residential">Residential</option>
            <option value="buy-to-let">Buy to let</option>
          </select>
        </div>

        <NumberField
          error={errors.assets?.mortgage?.outstandingBalance?.message}
          label="Outstanding balance"
          name="assets.mortgage.outstandingBalance"
          prefix="£"
        />
        <NumberField
          error={errors.assets?.mortgage?.monthlyPayment?.message}
          label="Monthly payment"
          name="assets.mortgage.monthlyPayment"
          prefix="£"
          suffix="/ month"
        />
        <PercentageField
          description="Rate used by the existing retirement projection."
          label="Current interest rate"
          min={0}
          name="assets.mortgage.interestRate"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <label
              className="form-label mb-0"
              htmlFor="assets-mortgage-mortgageEndAge"
            >
              Remaining term
            </label>
            <InfoTip label="remaining mortgage term">
              The term is shown as years remaining and is stored as the age
              when the existing projection pays off the mortgage.
            </InfoTip>
          </div>
          <Controller
            control={control}
            name="assets.mortgage.mortgageEndAge"
            render={({ field, fieldState }) => {
              const term = Math.max(0, field.value - currentAge);
              const error = fieldState.error?.message;
              const errorId = error
                ? "assets-mortgage-mortgageEndAge-error"
                : undefined;

              return (
                <>
                  <div className="relative mt-2">
                    <input
                      aria-describedby={errorId}
                      aria-invalid={Boolean(error)}
                      className="form-control form-control--suffix"
                      id="assets-mortgage-mortgageEndAge"
                      inputMode="numeric"
                      max={Math.max(0, 120 - currentAge)}
                      min={0}
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const rawValue = event.target.value;
                        field.onChange(
                          rawValue === ""
                            ? Number.NaN
                            : currentAge + Number(rawValue),
                        );
                      }}
                      ref={field.ref}
                      step={1}
                      type="number"
                      value={Number.isFinite(term) ? term : ""}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400"
                    >
                      years
                    </span>
                  </div>
                  {error && (
                    <p
                      className="mt-1.5 text-xs font-medium text-rose-600"
                      id={errorId}
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                </>
              );
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <label className="form-label mb-0" htmlFor="mortgage-repayment-type">
              Repayment type
            </label>
            {repaymentType === "interest-only" && (
              <InfoTip label="an interest-only mortgage">
                Monthly payments usually cover interest, leaving the original
                balance to repay separately at the end of the mortgage.
              </InfoTip>
            )}
          </div>
          <select
            className="form-control mt-2"
            id="mortgage-repayment-type"
            {...register("mortgageConfiguration.repaymentType")}
          >
            <option value="repayment">Repayment</option>
            <option value="interest-only">Interest only</option>
          </select>
        </div>
      </div>
    </fieldset>
  );
}
