"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { NumberField } from "@/components/forms/number-field";
import { PercentageField } from "@/components/forms/percentage-field";
import { MortgageForm } from "@/components/mortgages/MortgageForm";
import { calculateMarginalEmploymentTaxRates } from "@/lib/calculations/uk-tax";
import type {
  AnnualPersonIncome,
  AccountType,
  PersonKey,
  ProjectionResult,
  ProjectionYear,
  RetirementPlan,
  TaxInputs,
  TaxResult,
} from "@/types/retirement";

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
    <details
      className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900"
      id={id}
      open={id === "personal"}
    >
      <summary className="mb-5 flex cursor-pointer items-start gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200"
        >
          {number}
        </span>
        <div>
          <h2
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
            id={`${id}-heading`}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </summary>
      <div>{children}</div>
    </details>
  );
}

const accountOptions: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "gia", label: "General investment account" },
  { value: "isa", label: "ISA" },
  { value: "pension", label: "Pension" },
];

const priorityFields = [
  {
    key: "accumulationPriority",
    label: "Accumulation priority",
    description:
      "Choose where surplus income is invested after your planned contributions and cash reserve.",
  },
  {
    key: "withdrawalPriority",
    label: "Withdrawal priority",
    description:
      "Set the preferred order used when income does not cover spending.",
  },
] as const;

function TaxBreakdown({
  tax,
  marginalTaxInputs,
}: {
  tax?: TaxResult;
  marginalTaxInputs?: TaxInputs;
}) {
  if (!tax) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Complete the plan inputs to see this person&apos;s tax estimate.
      </p>
    );
  }

  const rows = [
    ["Gross taxable income", tax.grossIncome],
    ["Personal allowance", tax.personalAllowance],
    ["Taxable income", tax.taxableIncome],
    ["Income tax", tax.incomeTax],
    ["National Insurance", tax.nationalInsurance],
    ["Capital gains tax", tax.capitalGainsTax],
    ["Total tax", tax.totalTax],
  ] as const;
  const marginalRates = marginalTaxInputs
    ? calculateMarginalEmploymentTaxRates(marginalTaxInputs)
    : null;

  return (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, amount]) => (
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70" key={label}>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: "GBP",
                maximumFractionDigits: 0,
              }).format(amount)}
            </dd>
          </div>
        ))}
      </dl>
      {marginalRates && (
        <div
          aria-label="Marginal tax rate including income tax and National Insurance"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30"
          role="group"
        >
          <div>
            <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">
              Marginal Rate on Additional Earnings
            </p>
            <p className="mt-1 text-xs leading-5 text-teal-900 dark:text-teal-200">
              Income tax{" "}
              {formatPercentage(marginalRates.incomeTax)} + National Insurance{" "}
              {formatPercentage(marginalRates.nationalInsurance)} on the next
              £1 earned through an existing job.
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-teal-950 dark:text-teal-100">
            {formatPercentage(marginalRates.combined)}
          </p>
        </div>
      )}
    </div>
  );
}

function formatPercentage(rate: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(rate);
}

function createMarginalTaxInputs(
  taxYear: number,
  income: AnnualPersonIncome,
  statePensionAge: number,
  inflationRate: number,
  jurisdiction: RetirementPlan["taxSettings"]["jurisdiction"],
): TaxInputs {
  return {
    taxYear,
    inflationRate,
    jurisdiction,
    age: income.age,
    statePensionAge,
    employmentIncomes: [income.salaryIncome, income.secondSalaryIncome],
    rentalProfit: income.rentalIncome,
    otherTaxableIncome: income.otherIncomeAmount,
    pensionIncome: income.pensionDrawdownIncome,
    statePensionIncome: income.statePensionIncome,
    savingsInterest: Math.max(0, income.interestIncome),
    dividendIncome: Math.max(0, income.dividendIncome),
    capitalGains: income.realizedCapitalGains,
  };
}

export function RetirementPlanForm({
  personTaxes,
  projection,
  projectionYear,
  onViewResults,
}: {
  personTaxes?: Record<PersonKey, TaxResult>;
  projection?: ProjectionResult | null;
  projectionYear?: ProjectionYear;
  onViewResults: () => void;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RetirementPlan>();
  const householdType = useWatch({
    control,
    name: "personalDetails.householdType",
  });
  const currentAge = useWatch({
    control,
    name: "people.person1.income.currentAge",
  });
  const retirementAge = useWatch({
    control,
    name: "personalDetails.retirementAge",
  });
  const [selectedPerson, setSelectedPerson] = useState<PersonKey>("person1");
  const activePerson =
    householdType === "joint" ? selectedPerson : "person1";
  const activePersonCurrentAge = useWatch({
    control,
    name: `people.${activePerson}.income.currentAge`,
  });
  const startAtRetirementAge = useWatch({
    control,
    name: `people.${activePerson}.income.secondEmployment.startAtRetirementAge`,
  });
  const activeStatePensionAge = useWatch({
    control,
    name: `people.${activePerson}.income.statePensionAge`,
  });
  const inflationRate = useWatch({
    control,
    name: "assumptions.inflationRate",
  });
  const jurisdiction = useWatch({
    control,
    name: "taxSettings.jurisdiction",
  });
  const availablePeople: PersonKey[] =
    householdType === "joint" ? ["person1", "person2"] : ["person1"];
  const personIncomeErrors = errors.people?.[activePerson]?.income;
  const activePersonIncome = projectionYear?.personIncomes[activePerson];
  const marginalTaxInputs =
    projectionYear && activePersonIncome
      ? createMarginalTaxInputs(
          projectionYear.taxYear,
          activePersonIncome,
          activeStatePensionAge,
          inflationRate,
          jurisdiction,
        )
      : undefined;
  const { fields, append, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: "spending.buckets",
  });

  return (
    <div className="space-y-5">
      <FormSection
        description="Set your household details and the ages that define your planning timeline."
        id="personal"
        number="01"
        title="About you"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div>
            <label
              className="form-label"
              htmlFor="household-type"
            >
              Household type
            </label>
            <select
              className="form-control"
              id="household-type"
              {...register("personalDetails.householdType")}
            >
              <option value="single">Single</option>
              <option value="joint">Joint</option>
            </select>
          </div>
          {availablePeople.map((personKey, index) => (
            <NumberField
              error={errors.people?.[personKey]?.income?.currentAge?.message}
              key={personKey}
              label={index === 0 ? "Your current age" : "Partner current age"}
              max={120}
              min={0}
              name={`people.${personKey}.income.currentAge`}
              step={1}
              suffix="years"
            />
          ))}
        </div>
      </FormSection>

      <FormSection
        description="Enter the balances and contributions you want included in the projection. ISA and pension accounts belong to each person; GIA and cash investment income is attributed to Person 1."
        id="assets"
        number="02"
        title="Assets and liabilities"
      >
        <div className="space-y-7">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Investment accounts
            </h3>
            <div className="space-y-5">
              {(["person1", ...(householdType === "joint" ? ["person2"] : [])] as PersonKey[]).map(
                (personKey, index) => {
                  const personAssetErrors = errors.people?.[personKey]?.assets;
                  return (
                    <fieldset
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                      key={personKey}
                    >
                      <legend className="px-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Person {index + 1}
                      </legend>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <NumberField
                          error={personAssetErrors?.isa?.currentValue?.message}
                          label="ISA value"
                          name={`people.${personKey}.assets.isa.currentValue`}
                          prefix="£"
                        />
                        <NumberField
                          error={
                            personAssetErrors?.isa?.monthlyContribution?.message
                          }
                          label="Target ISA Contribution (£/month)"
                          name={`people.${personKey}.assets.isa.monthlyContribution`}
                          prefix="£"
                          suffix="/ month"
                        />
                        <NumberField
                          error={
                            personAssetErrors?.pension?.currentValue?.message
                          }
                          label="Pension value"
                          name={`people.${personKey}.assets.pension.currentValue`}
                          prefix="£"
                        />
                        <NumberField
                          error={
                            personAssetErrors?.pension?.monthlyContribution
                              ?.message
                          }
                          label="Pension monthly contribution"
                          name={`people.${personKey}.assets.pension.monthlyContribution`}
                          prefix="£"
                          suffix="/ month"
                        />
                      </div>
                    </fieldset>
                  );
                },
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <NumberField
                error={errors.assets?.gia?.currentValue?.message}
                label="GIA value"
                name="assets.gia.currentValue"
                prefix="£"
              />
              <NumberField
                error={errors.assets?.gia?.costBasis?.message}
                label="GIA cost basis"
                name="assets.gia.costBasis"
                prefix="£"
                description="What you paid for the investments currently held."
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
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
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

          <MortgageForm
            currentAge={currentAge}
            projection={projection}
            retirementAge={retirementAge}
          />
        </div>
      </FormSection>

      <FormSection
        description="Amounts are annual. Joint households can switch between people; each tab includes that person's basic tax calculation."
        id="income"
        number="03"
        title="Income"
      >
        <div className="space-y-6">
          <div
            aria-label="Income person"
            className="flex gap-2 border-b border-slate-200 dark:border-slate-700"
            role="tablist"
          >
            {availablePeople.map((personKey, index) => (
              <button
                aria-controls={`income-${personKey}-panel`}
                aria-selected={activePerson === personKey}
                className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                  activePerson === personKey
                    ? "border-teal-700 text-teal-900 dark:border-teal-400 dark:text-teal-200"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                }`}
                id={`income-${personKey}-tab`}
                key={personKey}
                onClick={() => setSelectedPerson(personKey)}
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    return;
                  }
                  event.preventDefault();
                  const currentIndex = availablePeople.indexOf(personKey);
                  const nextIndex =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? availablePeople.length - 1
                        : (currentIndex +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            availablePeople.length) %
                          availablePeople.length;
                  const nextPerson = availablePeople[nextIndex];
                  setSelectedPerson(nextPerson);
                  document
                    .getElementById(`income-${nextPerson}-tab`)
                    ?.focus();
                }}
                role="tab"
                tabIndex={activePerson === personKey ? 0 : -1}
                type="button"
              >
                Person {index + 1}
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`income-${activePerson}-tab`}
            className="space-y-7"
            id={`income-${activePerson}-panel`}
            role="tabpanel"
            tabIndex={0}
          >
            <section aria-labelledby={`${activePerson}-planning-ages`}>
              <h3
                className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100"
                id={`${activePerson}-planning-ages`}
              >
                Planning ages
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <NumberField
                  error={personIncomeErrors?.statePensionAge?.message}
                  label="State Pension age"
                  max={120}
                  min={0}
                  name={`people.${activePerson}.income.statePensionAge`}
                  step={1}
                  suffix="years"
                />
              </div>
            </section>
            <section aria-labelledby={`${activePerson}-employment`}>
              <h3
                className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100"
                id={`${activePerson}-employment`}
              >
                Employment
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <NumberField
                  error={
                    personIncomeErrors?.employment?.currentSalary?.message
                  }
                  label="Current salary"
                  name={`people.${activePerson}.income.employment.currentSalary`}
                  prefix="£"
                  suffix="/ year"
                />
                <PercentageField
                  label="Annual salary growth"
                  name={`people.${activePerson}.income.employment.annualSalaryGrowthRate`}
                />
              </div>
            </section>
            <section aria-labelledby={`${activePerson}-second-employment`}>
              <h3
                className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100"
                id={`${activePerson}-second-employment`}
              >
                Second / Post Retirement Employment
              </h3>
              <label className="mb-4 flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  className="size-4 accent-teal-700"
                  type="checkbox"
                  {...register(
                    `people.${activePerson}.income.secondEmployment.startAtRetirementAge`,
                  )}
                />
                <span>Start at Retirement Age</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <NumberField
                  error={
                    personIncomeErrors?.secondEmployment?.currentSalary?.message
                  }
                  label="Current annual salary"
                  name={`people.${activePerson}.income.secondEmployment.currentSalary`}
                  prefix="£"
                  suffix="/ year"
                />
                <PercentageField
                  label="Annual salary growth"
                  name={`people.${activePerson}.income.secondEmployment.annualSalaryGrowthRate`}
                />
                {!startAtRetirementAge ? (
                  <NumberField
                    error={
                      personIncomeErrors?.secondEmployment?.startAge?.message
                    }
                    label="Start age"
                    max={120}
                    min={activePersonCurrentAge}
                    name={`people.${activePerson}.income.secondEmployment.startAge`}
                    step={1}
                    suffix="years"
                  />
                ) : null}
                <NumberField
                  error={
                    personIncomeErrors?.secondEmployment?.endAge?.message
                  }
                  label="End age"
                  max={120}
                  min={0}
                  name={`people.${activePerson}.income.secondEmployment.endAge`}
                  step={1}
                  suffix="years"
                />
              </div>
            </section>
            <section aria-labelledby={`${activePerson}-other-income`}>
              <h3
                className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100"
                id={`${activePerson}-other-income`}
              >
                Other income
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <NumberField
                  error={
                    personIncomeErrors?.otherIncome?.rentalIncome?.message
                  }
                  label="Rental taxable profit"
                  name={`people.${activePerson}.income.otherIncome.rentalIncome`}
                  prefix="£"
                  suffix="/ year"
                  description="Enter profit after allowable expenses, not gross rent."
                />
                <NumberField
                  error={
                    personIncomeErrors?.otherIncome?.otherIncome?.message
                  }
                  label="Other taxable income"
                  name={`people.${activePerson}.income.otherIncome.otherIncome`}
                  prefix="£"
                  suffix="/ year"
                />
                <NumberField
                  error={
                    personIncomeErrors?.statePension?.annualAmount?.message
                  }
                  label="Estimated State Pension"
                  name={`people.${activePerson}.income.statePension.annualAmount`}
                  prefix="£"
                  suffix="/ year"
                />
              </div>
            </section>
            <section aria-labelledby={`${activePerson}-tax-calculation`}>
              <h3
                className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100"
                id={`${activePerson}-tax-calculation`}
              >
                Basic income tax calculation
              </h3>
              <TaxBreakdown
                marginalTaxInputs={marginalTaxInputs}
                tax={personTaxes?.[activePerson]}
              />
            </section>
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
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-800/50"
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
                    <span className="form-label">
                      Category name
                    </span>
                    <input
                      aria-describedby={
                        bucketErrors?.name?.message
                          ? `bucket-${field.id}-name-error`
                          : undefined
                      }
                      aria-invalid={Boolean(bucketErrors?.name?.message)}
                      className="form-control"
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
                    className="mt-6 flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-500 transition hover:border-rose-200 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
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
                  <label className="block">
                    <span className="form-label">Spending type</span>
                    <select
                      className="form-control"
                      {...register(`${bucketPath}.classification` as const)}
                    >
                      <option value="essential">Essential</option>
                      <option value="discretionary">Discretionary</option>
                    </select>
                  </label>
                  <NumberField
                    error={bucketErrors?.startAge?.message}
                    label="Start age"
                    max={120}
                    min={currentAge}
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-teal-300 px-4 text-sm font-semibold text-teal-800 transition hover:border-teal-500 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/50"
            onClick={() =>
              append({
                id: `custom-${crypto.randomUUID()}`,
                name: "New spending category",
                annualAmount: 0,
                inflationRate: 0.025,
                classification: "essential",
                startAge: currentAge,
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
        description="Set the tax jurisdiction, investment growth, inflation, and other assumptions used by the projection."
        id="assumptions"
        number="05"
        title="Planning assumptions"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label
              className="form-label"
              htmlFor="tax-jurisdiction"
            >
              UK tax jurisdiction
            </label>
            <select
              className="form-control"
              id="tax-jurisdiction"
              {...register("taxSettings.jurisdiction")}
            >
              <option value="england">England</option>
              <option value="scotland">Scotland</option>
              <option value="wales">Wales</option>
              <option value="northern-ireland">Northern Ireland</option>
            </select>
          </div>
          <PercentageField
            label="ISA real return"
            name="assumptions.isaRealReturn"
            description="Annual return above inflation."
          />
          <PercentageField
            label="Pension real return"
            name="assumptions.pensionRealReturn"
            description="Annual return above inflation."
          />
          <PercentageField
            label="GIA interest real yield"
            name="assumptions.giaInterestRealYield"
            description="Interest yield above inflation; negative values are allowed."
          />
          <PercentageField
            label="GIA dividend real yield"
            name="assumptions.giaDividendRealYield"
            description="Dividend yield above inflation; negative values are allowed."
          />
          <PercentageField
            label="GIA capital growth real yield"
            name="assumptions.giaCapitalGrowthRealYield"
            description="Price growth above inflation. Gains are taxed only when realized."
          />
          <PercentageField
            label="Cash interest real yield"
            name="assumptions.cashInterestRealYield"
            description="Interest yield above inflation; negative values are allowed."
          />
          <PercentageField
            label="General inflation"
            name="assumptions.inflationRate"
            min={-100}
          />
        </div>

      </FormSection>
      <FormSection
        description="Balance tax-efficient investing with accessible cash and a reliable retirement income."
        id="tax-optimisation"
        number="06"
        title="Tax & Account Optimisation"
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              error={errors.taxSettings?.minimumCashReserve?.message}
              label="Minimum cash reserve"
              name="taxSettings.minimumCashReserve"
              prefix="£"
              description="Cash kept available before the planner draws on other accounts."
            />
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 dark:border-slate-700">
              <input
                className="size-4 accent-teal-700"
                type="checkbox"
                {...register("taxSettings.optimiseTaxAutomatically")}
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Optimise tax automatically
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Compare withdrawal combinations and direct surplus contributions by priority.
                </span>
              </span>
            </label>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {priorityFields.map((priority) => (
              <fieldset
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                key={priority.key}
              >
                <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {priority.label}
                </legend>
                <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {priority.description}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {accountOptions.map((_, index) => {
                    const fieldName =
                      `taxSettings.${priority.key}.${index}` as const;
                    const error =
                      errors.taxSettings?.[priority.key]?.[index]?.message;
                    const fieldId = `${priority.key}-${index}`;

                    return (
                      <div key={fieldName}>
                        <label className="form-label" htmlFor={fieldId}>
                          {index + 1}
                          {index === 0
                            ? "st"
                            : index === 1
                              ? "nd"
                              : index === 2
                                ? "rd"
                                : "th"}{" "}
                          priority
                        </label>
                        <select
                          aria-describedby={
                            error ? `${fieldId}-error` : undefined
                          }
                          aria-invalid={Boolean(error)}
                          className="form-control"
                          id={fieldId}
                          {...register(fieldName)}
                        >
                          {accountOptions.map((account) => (
                            <option key={account.value} value={account.value}>
                              {account.label}
                            </option>
                          ))}
                        </select>
                        {error ? (
                          <p
                            className="mt-1.5 text-xs font-medium text-rose-600"
                            id={`${fieldId}-error`}
                            role="alert"
                          >
                            {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </FormSection>
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <button
          className="min-h-12 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
          onClick={onViewResults}
          type="button"
        >
          View My Results
        </button>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          Valid inputs save automatically in this browser.
        </p>
      </div>
    </div>
  );
}
