"use client";

import type { ReactNode } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { NumberField } from "@/components/forms/number-field";
import { PercentageField } from "@/components/forms/percentage-field";
import type { RetirementPlan, WithdrawalSource } from "@/types/retirement";

interface SectionProps {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}

function FormSection({
  id,
  number,
  title,
  description,
  children,
}: SectionProps) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7"
      id={id}
    >
      <div className="mb-6 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-800"
        >
          {number}
        </span>
        <div>
          <h2
            className="text-lg font-semibold tracking-tight text-slate-900"
            id={`${id}-heading`}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const withdrawalSources: { value: WithdrawalSource; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "gia", label: "General investment account" },
  { value: "isa", label: "ISA" },
  { value: "pension", label: "Pension" },
];

export function RetirementPlanForm() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RetirementPlan>();
  const { fields, append, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: "spending.buckets",
  });

  return (
    <div className="space-y-5">
      <FormSection
        description="Set the ages that define your planning timeline."
        id="personal"
        number="01"
        title="Personal details"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <NumberField
            error={errors.personalDetails?.currentAge?.message}
            label="Current age"
            max={120}
            min={0}
            name="personalDetails.currentAge"
            step={1}
            suffix="years"
          />
          <NumberField
            error={errors.personalDetails?.retirementAge?.message}
            label="Retirement age"
            max={120}
            min={0}
            name="personalDetails.retirementAge"
            step={1}
            suffix="years"
          />
          <NumberField
            error={errors.personalDetails?.lifeExpectancy?.message}
            label="Life expectancy"
            max={120}
            min={0}
            name="personalDetails.lifeExpectancy"
            step={1}
            suffix="years"
          />
          <NumberField
            error={errors.personalDetails?.statePensionAge?.message}
            label="State Pension age"
            max={120}
            min={0}
            name="personalDetails.statePensionAge"
            step={1}
            suffix="years"
          />
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="household-type"
            >
              Household type
            </label>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
              id="household-type"
              {...register("personalDetails.householdType")}
            >
              <option value="single">Single</option>
              <option value="joint">Joint</option>
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection
        description="Enter the balances and contributions you want included in the projection."
        id="assets"
        number="02"
        title="Assets and liabilities"
      >
        <div className="space-y-7">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              Investment accounts
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <NumberField
                error={errors.assets?.isa?.currentValue?.message}
                label="ISA value"
                name="assets.isa.currentValue"
                prefix="£"
              />
              <NumberField
                error={errors.assets?.isa?.monthlyContribution?.message}
                label="ISA monthly contribution"
                name="assets.isa.monthlyContribution"
                prefix="£"
                suffix="/ month"
              />
              <NumberField
                error={errors.assets?.pension?.currentValue?.message}
                label="Pension value"
                name="assets.pension.currentValue"
                prefix="£"
              />
              <NumberField
                error={errors.assets?.pension?.monthlyContribution?.message}
                label="Pension monthly contribution"
                name="assets.pension.monthlyContribution"
                prefix="£"
                suffix="/ month"
              />
              <NumberField
                error={errors.assets?.gia?.currentValue?.message}
                label="GIA value"
                name="assets.gia.currentValue"
                prefix="£"
              />
              <NumberField
                error={errors.assets?.gia?.monthlyContribution?.message}
                label="GIA monthly contribution"
                name="assets.gia.monthlyContribution"
                prefix="£"
                suffix="/ month"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              Cash and other assets
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <NumberField
                error={errors.assets?.cash?.currentValue?.message}
                label="Cash value"
                name="assets.cash.currentValue"
                prefix="£"
              />
              <NumberField
                error={errors.assets?.otherAssets?.currentValue?.message}
                label="Other assets"
                name="assets.otherAssets.currentValue"
                prefix="£"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              Mortgage
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <NumberField
                error={errors.assets?.mortgage?.outstandingBalance?.message}
                label="Outstanding balance"
                name="assets.mortgage.outstandingBalance"
                prefix="£"
              />
              <PercentageField
                label="Interest rate"
                min={0}
                name="assets.mortgage.interestRate"
              />
              <NumberField
                error={errors.assets?.mortgage?.monthlyPayment?.message}
                label="Monthly payment"
                name="assets.mortgage.monthlyPayment"
                prefix="£"
                suffix="/ month"
              />
              <NumberField
                error={errors.assets?.mortgage?.mortgageEndAge?.message}
                label="Mortgage end age"
                max={120}
                min={0}
                name="assets.mortgage.mortgageEndAge"
                step={1}
                suffix="years"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        description="Income amounts are annual. Non-salary income is uprated with your general inflation assumption."
        id="income"
        number="03"
        title="Income"
      >
        <div className="space-y-7">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              Employment
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <NumberField
                error={errors.income?.employment?.currentSalary?.message}
                label="Current salary"
                name="income.employment.currentSalary"
                prefix="£"
                suffix="/ year"
              />
              <PercentageField
                label="Annual salary growth"
                name="income.employment.annualSalaryGrowthRate"
              />
              <NumberField
                error={errors.income?.employment?.workUntilAge?.message}
                label="Work until age"
                max={120}
                min={0}
                name="income.employment.workUntilAge"
                step={1}
                suffix="years"
              />
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">
              Other income
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <NumberField
                error={errors.income?.otherIncome?.rentalIncome?.message}
                label="Rental income"
                name="income.otherIncome.rentalIncome"
                prefix="£"
                suffix="/ year"
              />
              <NumberField
                error={errors.income?.otherIncome?.otherIncome?.message}
                label="Other income"
                name="income.otherIncome.otherIncome"
                prefix="£"
                suffix="/ year"
              />
              <NumberField
                error={errors.income?.statePension?.annualAmount?.message}
                label="Estimated State Pension"
                name="income.statePension.annualAmount"
                prefix="£"
                suffix="/ year"
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        description="Add, remove, or adjust spending categories and the ages they apply."
        id="spending"
        number="04"
        title="Spending plan"
      >
        <div className="space-y-4">
          {fields.map((field, index) => {
            const bucketErrors = errors.spending?.buckets?.[index];
            const bucketPath = `spending.buckets.${index}` as const;
            const bucketName =
              field.name.trim() || `spending category ${index + 1}`;

            return (
              <article
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
                key={field.fieldKey}
              >
                <input
                  type="hidden"
                  {...register(`${bucketPath}.id` as const)}
                />
                <div className="mb-4 flex items-center justify-between gap-3">
                  <label
                    className="block min-w-0 flex-1"
                    htmlFor={`bucket-${field.id}-name`}
                  >
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                      Category name
                    </span>
                    <input
                      aria-describedby={
                        bucketErrors?.name?.message
                          ? `bucket-${field.id}-name-error`
                          : undefined
                      }
                      aria-invalid={Boolean(bucketErrors?.name?.message)}
                      className={`min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 ${
                        bucketErrors?.name?.message
                          ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/10"
                          : ""
                      }`}
                      id={`bucket-${field.id}-name`}
                      {...register(`${bucketPath}.name` as const)}
                    />
                    {bucketErrors?.name?.message ? (
                      <span
                        className="mt-1 block text-xs text-rose-600"
                        id={`bucket-${field.id}-name-error`}
                        role="alert"
                      >
                        {bucketErrors.name.message}
                      </span>
                    ) : null}
                  </label>
                  <button
                    aria-label={`Remove ${bucketName}`}
                    className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-rose-200 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <NumberField
                    error={bucketErrors?.annualAmount?.message}
                    label="Annual amount"
                    name={`${bucketPath}.annualAmount`}
                    prefix="£"
                    suffix="/ year"
                  />
                  <PercentageField
                    label="Inflation rate"
                    name={`${bucketPath}.inflationRate`}
                  />
                  <NumberField
                    error={bucketErrors?.startAge?.message}
                    label="Start age"
                    max={120}
                    min={0}
                    name={`${bucketPath}.startAge`}
                    step={1}
                    suffix="years"
                  />
                  <NumberField
                    error={bucketErrors?.endAge?.message}
                    label="End age"
                    max={120}
                    min={0}
                    name={`${bucketPath}.endAge`}
                    step={1}
                    suffix="years"
                  />
                </div>
              </article>
            );
          })}
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-emerald-300 px-4 text-sm font-semibold text-emerald-800 transition hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            onClick={() =>
              append({
                id: `custom-${crypto.randomUUID()}`,
                name: "New spending category",
                annualAmount: 0,
                inflationRate: 0.025,
                startAge: 67,
                endAge: 95,
              })
            }
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              +
            </span>
            Add spending category
          </button>
        </div>
      </FormSection>

      <FormSection
        description="These assumptions affect annual growth and spending projections."
        id="assumptions"
        number="05"
        title="Investment assumptions"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <PercentageField label="ISA return" name="assumptions.isaReturn" />
          <PercentageField
            label="Pension return"
            name="assumptions.pensionReturn"
          />
          <PercentageField label="GIA return" name="assumptions.giaReturn" />
          <PercentageField label="Cash return" name="assumptions.cashReturn" />
          <PercentageField
            label="General inflation"
            name="assumptions.inflationRate"
            min={-100}
          />
        </div>
      </FormSection>

      <FormSection
        description="Choose which accounts are drawn from first when income does not cover spending."
        id="withdrawals"
        number="06"
        title="Withdrawal order"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {withdrawalSources.map((_, index) => {
            const fieldName = `withdrawalOrder.${index}` as const;
            const error = errors.withdrawalOrder?.[index]?.message;

            return (
              <div key={fieldName}>
                <label
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                  htmlFor={`withdrawal-order-${index}`}
                >
                  {index + 1}
                  {index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} source
                </label>
                <select
                  aria-describedby={error ? `withdrawal-order-${index}-error` : undefined}
                  aria-invalid={Boolean(error)}
                  className={`min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 ${
                    error
                      ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/10"
                      : ""
                  }`}
                  id={`withdrawal-order-${index}`}
                  {...register(fieldName)}
                >
                  {withdrawalSources.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
                {error ? (
                  <p
                    className="mt-1.5 text-xs font-medium text-rose-600"
                    id={`withdrawal-order-${index}-error`}
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}
