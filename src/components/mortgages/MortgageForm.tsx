"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { MortgageAdvancedOptions } from "@/components/mortgages/MortgageAdvancedOptions";
import { MortgageBasicFields } from "@/components/mortgages/MortgageBasicFields";
import { MortgageImpactInsights } from "@/components/mortgages/MortgageImpactInsights";
import { MortgagePropertySection } from "@/components/mortgages/MortgagePropertySection";
import {
  estimateMortgagePayoffAge,
  getAssumedFutureMortgageRate,
} from "@/lib/mortgages/mortgagePreview";
import type { ProjectionResult, RetirementPlan } from "@/types/retirement";

interface MortgageFormProps {
  currentAge: number;
  retirementAge: number;
  projection?: ProjectionResult | null;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const rateFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return Number.isFinite(value) ? currencyFormatter.format(value) : "—";
}

function formatRate(value: number): string {
  return Number.isFinite(value) ? rateFormatter.format(value) : "—";
}

export function MortgageForm({
  currentAge,
  retirementAge,
  projection,
}: MortgageFormProps) {
  const { control } = useFormContext<RetirementPlan>();
  const [showDetails, setShowDetails] = useState(false);
  const mortgage = useWatch({ control, name: "assets.mortgage" });
  const configuration = useWatch({
    control,
    name: "mortgageConfiguration",
  });
  const property = useWatch({ control, name: "propertyInformation" });
  const assumedFutureRate = getAssumedFutureMortgageRate(
    mortgage,
    configuration,
  );
  const mortgageFreeAge =
    mortgage.outstandingBalance <= 0
      ? currentAge
      : projection?.yearlyResults.find(
          (year) => year.mortgageBalance <= 0.01,
        )?.age ?? null;
  const estimatedPayoffAge = estimateMortgagePayoffAge(
    mortgage,
    configuration,
    currentAge,
    false,
  );
  const estimatedPayoffAgeWithOverpayments = estimateMortgagePayoffAge(
    mortgage,
    configuration,
    currentAge,
    true,
  );
  const propertyEquity = property.estimatedValue - mortgage.outstandingBalance;

  return (
    <div className="space-y-5">
      <section
        aria-labelledby="mortgage-summary-heading"
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              id="mortgage-summary-heading"
            >
              {configuration.name || "Mortgage summary"}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {configuration.type === "buy-to-let"
                ? "Buy to Let"
                : "Residential"}{" "}
              mortgage
            </p>
          </div>
          <button
            aria-expanded={showDetails}
            className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-300"
            onClick={() => setShowDetails((visible) => !visible)}
            type="button"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <SummaryValue
            label="Outstanding Balance"
            value={formatCurrency(mortgage.outstandingBalance)}
          />
          <SummaryValue
            label="Monthly Payment"
            value={formatCurrency(mortgage.monthlyPayment)}
          />
          <SummaryValue
            label="Current Rate"
            value={formatRate(mortgage.interestRate)}
          />
          <SummaryValue
            label="Mortgage Free Age"
            value={
              mortgageFreeAge === null
                ? "Not within projection"
                : `Age ${mortgageFreeAge}`
            }
          />
          <SummaryValue
            label="Property Equity"
            value={formatCurrency(propertyEquity)}
          />
        </dl>

        {showDetails && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <dl className="grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
              <SummaryDetail
                label="Future-rate assumption"
                value={formatRate(assumedFutureRate)}
              />
              <SummaryDetail
                label="Repayment type"
                value={
                  configuration.repaymentType === "interest-only"
                    ? "Interest only"
                    : "Repayment"
                }
              />
              <SummaryDetail
                label="Remaining term"
                value={`${Math.max(
                  0,
                  mortgage.mortgageEndAge - currentAge,
                )} years`}
              />
              <SummaryDetail
                label="Estimated property value"
                value={formatCurrency(property.estimatedValue)}
              />
            </dl>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Property equity is estimated property value minus the current
              mortgage balance. Property value and advanced mortgage
              assumptions do not change the existing retirement projection.
            </p>
          </div>
        )}
      </section>

      <MortgageBasicFields currentAge={currentAge} />
      <MortgageAdvancedOptions currentAge={currentAge} />
      <MortgagePropertySection />
      <MortgageImpactInsights
        configuration={configuration}
        currentAge={currentAge}
        estimatedPayoffAge={estimatedPayoffAge}
        estimatedPayoffAgeWithOverpayments={estimatedPayoffAgeWithOverpayments}
        mortgage={mortgage}
        mortgageFreeAge={mortgageFreeAge}
        retirementAge={retirementAge}
      />
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        The retirement projection continues to use the existing balance,
        interest rate, monthly payment, and mortgage end age. Introductory
        rates, overpayments, repayment type, rental assumptions, and property
        details are saved as separate planning information and do not alter
        those calculations.
      </p>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
      <dt className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function SummaryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200">
        {value}
      </dd>
    </div>
  );
}
