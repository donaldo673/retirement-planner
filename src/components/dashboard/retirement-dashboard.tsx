"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { RetirementPlanForm } from "@/components/forms/retirement-plan-form";
import { createSampleRetirementPlan } from "@/data/sample-plan";
import { calculateProjection } from "@/lib/calculations/retirement-engine";
import { retirementPlanSchema } from "@/lib/validation/retirement-plan-schema";
import type { ProjectionStatus, RetirementPlan } from "@/types/retirement";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const plannerSections = [
  { href: "#overview", label: "Overview" },
  { href: "#personal", label: "Personal details" },
  { href: "#assets", label: "Assets & liabilities" },
  { href: "#income", label: "Income" },
  { href: "#spending", label: "Spending plan" },
  { href: "#assumptions", label: "Assumptions" },
  { href: "#withdrawals", label: "Withdrawal order" },
];

const statusContent: Record<
  ProjectionStatus,
  { label: string; message: string; className: string; dotClassName: string }
> = {
  green: {
    label: "On track",
    message: "Your projected assets last through your planning horizon.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    dotClassName: "bg-emerald-500",
  },
  amber: {
    label: "Tight at the end",
    message:
      "Your assets last through your planning horizon, with a final estate below £50,000.",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    dotClassName: "bg-amber-500",
  },
  red: {
    label: "Shortfall projected",
    message: "Your plan has an annual spending shortfall before life expectancy.",
    className: "border-rose-200 bg-rose-50 text-rose-950",
    dotClassName: "bg-rose-500",
  },
};

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function StatusSummary({ status }: { status: ProjectionStatus }) {
  const content = statusContent[status];

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-4 sm:px-5 ${content.className}`}
      role="status"
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${content.dotClassName}`}
      />
      <div>
        <p className="text-sm font-semibold">{content.label}</p>
        <p className="mt-1 text-sm leading-6 opacity-80">{content.message}</p>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  marker: string;
}

function MetricCard({ label, value, detail, marker }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-800"
        >
          {marker}
        </span>
      </div>
      <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.7rem]">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
      <a
        aria-label="Retirement planner home"
        className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        href="#overview"
      >
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-xl bg-emerald-800 text-sm font-bold text-white"
        >
          RP
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-950">
            Retirement planner
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Your plan, at a glance
          </span>
        </span>
      </a>

      <nav aria-label="Planner sections" className="mt-10 space-y-1">
        {plannerSections.map((section, index) => (
          <a
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              index === 0
                ? "bg-emerald-50 font-semibold text-emerald-900"
                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
            href={section.href}
            key={section.href}
          >
            <span
              aria-hidden="true"
              className="w-5 text-center text-xs text-emerald-700"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {section.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Planning note</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Projections are estimates, shown before tax. Your plan stays in this
          browser session for now.
        </p>
      </div>
    </aside>
  );
}

export function RetirementDashboard() {
  const form = useForm<RetirementPlan>({
    defaultValues: createSampleRetirementPlan(),
    mode: "onChange",
    resolver: zodResolver(retirementPlanSchema),
  });
  const watchedPlan = useWatch({ control: form.control });
  const projection = useMemo(() => {
    const parsedPlan = retirementPlanSchema.safeParse(watchedPlan);
    return parsedPlan.success ? calculateProjection(parsedPlan.data) : null;
  }, [watchedPlan]);
  const summary = projection?.summary;
  const status = summary ? statusContent[summary.status] : null;

  function resetPlan() {
    form.reset(createSampleRetirementPlan());
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] font-sans text-slate-900">
      <a
        className="fixed left-3 top-3 z-[100] -translate-y-[180%] rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        href="#main-content"
      >
        Skip to content
      </a>
      <Sidebar />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-xs font-bold text-white lg:hidden"
              >
                RP
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  Your retirement plan
                </p>
                <p className="hidden text-xs text-slate-500 sm:block">
                  A clear view of your future finances
                </p>
              </div>
            </div>
            <button
              className="min-h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:px-4 sm:text-sm"
              onClick={resetPlan}
              type="button"
            >
              Reset example
            </button>
          </div>
          <nav
            aria-label="Planner sections"
            className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
          >
            {plannerSections.map((section) => (
              <a
                className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                href={section.href}
                key={section.href}
              >
                {section.label}
              </a>
            ))}
          </nav>
        </header>

        <main
          className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
        >
          <section aria-labelledby="overview-heading" id="overview">
            <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  Your retirement, in focus
                </p>
                <h1
                  className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl"
                  id="overview-heading"
                >
                  Make the years ahead feel clearer.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Shape your assumptions and see how your income, spending, and
                  savings may work together over time.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
                  Example plan
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600">
                  GBP · pre-tax
                </span>
              </div>
            </div>

            {summary && status ? (
              <>
                <StatusSummary status={summary.status} />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard
                    detail="Today, after your mortgage"
                    label="Current net worth"
                    marker="£"
                    value={formatCurrency(summary.currentNetWorth)}
                  />
                  <MetricCard
                    detail={`At age ${form.getValues("personalDetails.retirementAge")}`}
                    label="At retirement"
                    marker="R"
                    value={formatCurrency(summary.retirementNetWorth)}
                  />
                  <MetricCard
                    detail={summary.status === "amber" ? "Below £50,000" : "At life expectancy"}
                    label="Final estate"
                    marker="F"
                    value={formatCurrency(summary.finalEstateValue)}
                  />
                  <MetricCard
                    detail="Using a 25× spending-gap rule of thumb"
                    label="Financial independence"
                    marker="FI"
                    value={
                      summary.financialIndependenceAge === null
                        ? "Not reached"
                        : `Age ${summary.financialIndependenceAge}`
                    }
                  />
                  <MetricCard
                    detail="No projected shortfall if not reached"
                    label="Assets run out"
                    marker="!"
                    value={
                      summary.ageAssetsRunOut === null
                        ? "Not projected"
                        : `Age ${summary.ageAssetsRunOut}`
                    }
                  />
                  <MetricCard
                    detail="Planned spending after retirement"
                    label="Total retirement spending"
                    marker="Σ"
                    value={formatCurrency(summary.totalRetirementSpending)}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Estimates are illustrative and do not include tax, fees, or
                  investment volatility.
                </p>
              </>
            ) : (
              <div
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950"
                role="status"
              >
                Complete the highlighted fields to update your projection.
              </div>
            )}
          </section>

          <section
            aria-labelledby="plan-inputs-heading"
            className="mb-5 mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Build your plan
              </p>
              <h2
                className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
                id="plan-inputs-heading"
              >
                Your planning assumptions
              </h2>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Changes update the estimate immediately. They are not saved yet.
            </p>
          </section>

          <FormProvider {...form}>
            <form
              aria-label="Retirement plan assumptions"
              noValidate
              onSubmit={(event) => event.preventDefault()}
            >
              <RetirementPlanForm />
            </form>
          </FormProvider>

          <footer className="pb-8 pt-8 text-center text-xs leading-5 text-slate-500">
            Retirement planning estimates are for illustration only and are not
            personal financial advice.
          </footer>
        </main>
      </div>
    </div>
  );
}
