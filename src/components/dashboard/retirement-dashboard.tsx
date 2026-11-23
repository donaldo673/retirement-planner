"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { FinancialStatementsPage } from "@/components/financial-statements/FinancialStatementsPage";
import { RetirementPlanForm } from "@/components/forms/retirement-plan-form";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { PlanningMetrics } from "@/components/insights/PlanningMetrics";
import { PotentialImprovements } from "@/components/insights/PotentialImprovements";
import { ScenarioWorkspace } from "@/components/scenarios/ScenarioWorkspace";
import { createSampleRetirementPlan } from "@/data/sample-plan";
import { calculateProjection } from "@/lib/calculations/retirement-engine";
import { analyzePlanning } from "@/lib/insights/generateInsights";
import {
  retirementPlanSchema,
  savedPlanSchema,
} from "@/lib/validation/retirement-plan-schema";
import type { RetirementPlan, SavedPlan } from "@/types/retirement";

const ChartDashboard = dynamic(
  () =>
    import("@/components/charts/ChartDashboard").then(
      (module) => module.ChartDashboard,
    ),
  {
    loading: () => (
      <div
        aria-label="Loading projection charts"
        className="mt-8 h-80 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        role="status"
      />
    ),
  },
);

const SAVED_PLAN_STORAGE_KEY = "retirement-planner:saved-plan";

type PersistenceStatus =
  | { kind: "loading" | "saved" | "unsaved"; message: string }
  | { kind: "error"; message: string };

const appPages = [
  { id: "plan", label: "My Plan" },
  { id: "results", label: "My Results" },
  { id: "explore", label: "Explore" },
  { id: "scenarios", label: "Scenarios" },
  { id: "finances", label: "Detailed Finances" },
] as const;

type AppPage = (typeof appPages)[number]["id"];
type ExploreTab = "wealth" | "income" | "tax" | "independence" | "risks";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown browser storage error.";
}

export function RetirementDashboard() {
  const form = useForm<RetirementPlan>({
    defaultValues: createSampleRetirementPlan(),
    mode: "onChange",
    resolver: zodResolver(retirementPlanSchema),
  });
  const { reset } = form;
  const [canSavePlan, setCanSavePlan] = useState(false);
  const [hasSavedPlan, setHasSavedPlan] = useState(false);
  const [canContinueSavedPlan, setCanContinueSavedPlan] = useState(false);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>({
      kind: "loading",
      message: "Checking this browser for a saved plan...",
    });
  const [activePage, setActivePage] = useState<AppPage>("plan");
  const [exploreTab, setExploreTab] = useState<ExploreTab>("wealth");
  const watchedPlan = useWatch({ control: form.control });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      let savedPlanText: string | null;
      try {
        savedPlanText = window.localStorage.getItem(SAVED_PLAN_STORAGE_KEY);
      } catch (error) {
        setPersistenceStatus({
          kind: "error",
          message: `Browser storage is unavailable. Changes are not being saved. ${getErrorMessage(error)}`,
        });
        return;
      }

      if (savedPlanText === null) {
        setPersistenceStatus({
          kind: "saved",
          message: "No saved plan yet. Your edits will save automatically in this browser.",
        });
        return;
      }
      setHasSavedPlan(true);

      let savedPlanData: unknown;
      try {
        savedPlanData = JSON.parse(savedPlanText);
      } catch (error) {
        setPersistenceStatus({
          kind: "error",
          message: `The saved plan could not be read. Use “Reset example” to replace it. ${getErrorMessage(error)}`,
        });
        return;
      }

      const savedPlan = savedPlanSchema.safeParse(savedPlanData);
      if (!savedPlan.success) {
        setPersistenceStatus({
          kind: "error",
          message:
            "The saved plan is invalid or from an unsupported version. Use “Reset example” to replace it.",
        });
        return;
      }

      reset(savedPlan.data.plan);
      setHasSavedPlan(true);
      setCanContinueSavedPlan(true);
      setActivePage("results");
      setCanSavePlan(true);
      setPersistenceStatus({
        kind: "saved",
        message: "Your saved plan has been loaded from this browser.",
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [reset]);

  useEffect(() => {
    if (!canSavePlan) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const parsedPlan = retirementPlanSchema.safeParse(watchedPlan);
      if (!parsedPlan.success) {
        setPersistenceStatus({
          kind: "unsaved",
          message:
            "The latest edits are not saved. Complete or correct the highlighted inputs to save them.",
        });
        return;
      }

      const savedPlan: SavedPlan = {
        version: 1,
        savedAt: new Date().toISOString(),
        plan: parsedPlan.data,
      };

      try {
        window.localStorage.setItem(
          SAVED_PLAN_STORAGE_KEY,
          JSON.stringify(savedPlan),
        );
        setHasSavedPlan(true);
        setCanContinueSavedPlan(true);
        setPersistenceStatus({
          kind: "saved",
          message: "Your valid plan inputs are saved in this browser.",
        });
      } catch (error) {
        setPersistenceStatus({
          kind: "error",
          message: `Your plan could not be saved in this browser. ${getErrorMessage(error)}`,
        });
      }
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [canSavePlan, watchedPlan]);

  const parsedPlan = useMemo(
    () => retirementPlanSchema.safeParse(watchedPlan),
    [watchedPlan],
  );
  const projection = useMemo(
    () => (parsedPlan.success ? calculateProjection(parsedPlan.data) : null),
    [parsedPlan],
  );
  const planningAnalysis = useMemo(() => {
    if (!projection || !parsedPlan.success) {
      return null;
    }

    return analyzePlanning({ plan: parsedPlan.data, projection });
  }, [parsedPlan, projection]);
  const summary = projection?.summary;
  const firstProjectionYear = projection?.yearlyResults[1];
  const currentAge = form.getValues("people.person1.income.currentAge");
  const retirementAge = form.getValues("personalDetails.retirementAge");
  const lifeExpectancy = form.getValues("personalDetails.lifeExpectancy");

  function resetPlan() {
    if (
      hasSavedPlan &&
      !window.confirm(
        "Replace your saved plan with the illustrative example? This will overwrite the plan saved in this browser.",
      )
    ) {
      return;
    }

    form.reset(createSampleRetirementPlan());
    setHasSavedPlan(false);
    setCanContinueSavedPlan(false);
    setCanSavePlan(true);
    setActivePage("plan");
    setPersistenceStatus({
      kind: "unsaved",
      message: "Example plan restored. Saving it in this browser...",
    });
  }

  function loadPlan(plan: RetirementPlan) {
    reset(plan);
    setHasSavedPlan(true);
    setCanContinueSavedPlan(true);
    setCanSavePlan(true);
    navigateToPage("results");
  }

  function navigateToPage(page: AppPage) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen min-w-0 bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        className="fixed left-3 top-3 z-[100] -translate-y-[180%] rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0 lg:px-8">
          <a
            aria-label="FP Futureplan"
            className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
            href="#main-content"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-teal-400 dark:text-slate-950">
              FP
            </span>
            <span className="hidden text-sm font-semibold text-slate-950 sm:inline dark:text-white">
              Futureplan
            </span>
          </a>
          <nav
            aria-label="Main navigation"
            className="order-last grid basis-full grid-cols-3 items-center gap-1 sm:order-none sm:flex sm:min-w-0 sm:flex-1 sm:basis-auto sm:justify-center"
          >
            {appPages.map((page) => (
              <button
                aria-current={activePage === page.id ? "page" : undefined}
                className={`min-h-10 min-w-0 whitespace-nowrap rounded-lg px-1 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:min-h-10 sm:shrink-0 sm:px-3 sm:text-sm ${
                  activePage === page.id
                    ? "bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
                key={page.id}
                onClick={() => navigateToPage(page.id)}
                type="button"
              >
                {page.label}
              </button>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button
              aria-label="Reset to illustrative example"
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:px-3 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={persistenceStatus.kind === "loading"}
              onClick={resetPlan}
              type="button"
            >
              <span className="sm:hidden">Reset</span>
              <span className="hidden sm:inline">Reset example</span>
            </button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[1440px] px-3 py-6 sm:px-6 sm:py-9 lg:px-8"
        id="main-content"
      >
        <PageHeading activePage={activePage} />

        <aside
          aria-labelledby="local-storage-heading"
          className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              id="local-storage-heading"
            >
              {hasSavedPlan ? "Saved in this browser" : "Illustrative example"}
            </h2>
            <p
              className={`text-xs font-medium ${
                persistenceStatus.kind === "error"
                  ? "text-rose-700 dark:text-rose-300"
                  : persistenceStatus.kind === "unsaved"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-slate-500 dark:text-slate-400"
              }`}
              role={persistenceStatus.kind === "error" ? "alert" : "status"}
            >
              {persistenceStatus.message}
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
            {hasSavedPlan
              ? "Your plan is stored only on this device in browser local storage. It is not encrypted; anyone with access to this browser profile may be able to view it."
              : "The form starts with sample assumptions so you can explore the calculator. They are illustrative only and are not saved unless you edit or reset the example."}
          </p>
          {canContinueSavedPlan ? (
            <button
              className="mt-2 min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-slate-950"
              onClick={() => navigateToPage("results")}
              type="button"
            >
              Continue My Saved Plan
            </button>
          ) : !hasSavedPlan ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-slate-950"
                onClick={() => navigateToPage("plan")}
                type="button"
              >
                Create My Plan
              </button>
              <button
                className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-200"
                onClick={() => navigateToPage("results")}
                type="button"
              >
                Explore an Example
              </button>
            </div>
          ) : null}
        </aside>

        {summary &&
        projection &&
        firstProjectionYear &&
        planningAnalysis &&
        parsedPlan.success ? (
          <ScenarioWorkspace
            analysis={planningAnalysis}
            currentPlanChanged={form.formState.isDirty}
            isPlanLoading={persistenceStatus.kind === "loading"}
            onLoadPlan={loadPlan}
            plan={parsedPlan.data}
            projection={projection}
          >
            {({ scenarioSeries, scenarioPanel }) => (
              <>
                <section
                  aria-labelledby="results-summary-heading"
                  hidden={activePage !== "results"}
                >
                  <h2 className="sr-only" id="results-summary-heading">
                    Projection summary
                  </h2>
                  <DashboardSummary
                    lifeExpectancy={lifeExpectancy}
                    lifeExpectancyYear={projection.yearlyResults.find(
                      (year) => year.age === lifeExpectancy,
                    )}
                    retirementAge={retirementAge}
                    retirementYear={projection.yearlyResults.find(
                      (year) => year.age === retirementAge,
                    )}
                    summary={summary}
                  />
                  {activePage === "results" && (
                    <ChartDashboard
                      currentAge={currentAge}
                      exploreTab="wealth"
                      lifeExpectancy={lifeExpectancy}
                      mode="overview"
                      retirementAge={retirementAge}
                      scenarioSeries={scenarioSeries}
                      summary={summary}
                      yearlyResults={projection.yearlyResults}
                    />
                  )}
                  {activePage === "results" && (
                    <KeyObservations
                      lifeExpectancy={lifeExpectancy}
                      lifeExpectancyYear={projection.yearlyResults.find(
                        (year) => year.age === lifeExpectancy,
                      )}
                      retirementAge={retirementAge}
                      retirementYear={projection.yearlyResults.find(
                        (year) => year.age === retirementAge,
                      )}
                      summary={summary}
                    />
                  )}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <PageAction onClick={() => navigateToPage("plan")}>
                      Edit My Plan
                    </PageAction>
                    <PageAction onClick={() => navigateToPage("explore")}>
                      Explore My Finances
                    </PageAction>
                    <PageAction onClick={() => navigateToPage("scenarios")}>
                      Compare Scenarios
                    </PageAction>
                  </div>
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-100/70 p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    This calculator provides illustrative financial projections based on your assumptions. It does not provide financial advice or recommendations. Actual outcomes may differ.
                    <details className="mt-2">
                      <summary className="min-h-8 cursor-pointer font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-teal-300">
                        About This Calculator
                      </summary>
                      <div className="space-y-2 pt-2">
                        <p>
                          The model projects annual income, spending, tax, investment growth, withdrawals, and balances using the assumptions shown in My Plan. Results are deterministic illustrations, not probabilities or guarantees.
                        </p>
                        <p>
                          Investment returns, inflation, longevity, tax rules, and personal circumstances can differ from the assumptions or change over time. The model does not capture every future event or variation in the order of investment returns.
                        </p>
                        <p>
                          Tax figures are estimates under the rules and tax jurisdiction implemented in the calculator. This tool is educational and does not assess whether a decision or financial arrangement is suitable. You may wish to seek independent regulated financial advice for advice about your circumstances.
                        </p>
                      </div>
                    </details>
                  </div>
                </section>

                <section
                  aria-labelledby="explore-heading"
                  hidden={activePage !== "explore"}
                >
                  <h2 className="sr-only" id="explore-heading">
                    Explore projection details
                  </h2>
                  <div
                    aria-label="Projection detail categories"
                    className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800"
                    role="tablist"
                  >
                    {([
                      ["wealth", "Wealth"],
                      ["income", "Income and spending"],
                      ["tax", "Tax"],
                      ["independence", "Financial independence"],
                      ["risks", "Risks and assumptions"],
                    ] as const).map(([id, label]) => (
                      <button
                        aria-selected={exploreTab === id}
                        className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                          exploreTab === id
                            ? "border-teal-700 text-teal-900 dark:border-teal-400 dark:text-teal-200"
                            : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                        key={id}
                        onClick={() => setExploreTab(id)}
                        role="tab"
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {activePage === "explore" && (
                    <ChartDashboard
                      currentAge={currentAge}
                      exploreTab={exploreTab}
                      lifeExpectancy={lifeExpectancy}
                      mode="explore"
                      retirementAge={retirementAge}
                      scenarioSeries={scenarioSeries}
                      summary={summary}
                      yearlyResults={projection.yearlyResults}
                    />
                  )}
                  {exploreTab === "independence" && (
                    <PlanningMetrics metrics={planningAnalysis.metrics} />
                  )}
                  {exploreTab === "risks" && (
                    <div className="mt-6 space-y-5">
                      <InsightsPanel insights={planningAnalysis.insights} />
                      <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <summary className="min-h-8 cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-slate-100">
                          Explore modelled alternatives
                        </summary>
                        <PotentialImprovements
                          opportunities={planningAnalysis.opportunities}
                        />
                      </details>
                      <section
                        aria-labelledby="limitations-heading"
                        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <h2
                          className="text-base font-semibold text-slate-950 dark:text-white"
                          id="limitations-heading"
                        >
                          Modelling assumptions and limitations
                        </h2>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          <li>Investment returns and inflation follow the deterministic assumptions entered in My Plan; actual outcomes vary.</li>
                          <li>The timing and sequence of investment returns may differ from the modelled path.</li>
                          <li>Tax rules and personal circumstances may change; displayed tax amounts are estimates.</li>
                          <li>A projection through a selected age is not a guarantee of assets lasting for that period.</li>
                        </ul>
                      </section>
                    </div>
                  )}
                </section>

                <section
                  aria-labelledby="scenarios-page-heading"
                  hidden={activePage !== "scenarios"}
                >
                  <h2 className="sr-only" id="scenarios-page-heading">
                    Scenario comparison
                  </h2>
                  {scenarioPanel}
                </section>
              </>
            )}
          </ScenarioWorkspace>
        ) : (
          <div
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
            role="status"
          >
            Complete the highlighted fields to update your projection.
          </div>
        )}

        <section hidden={activePage !== "finances"}>
          <FinancialStatementsPage
            plan={parsedPlan.success ? parsedPlan.data : null}
            projection={projection}
          />
        </section>

        <section hidden={activePage !== "plan"}>
          <FormProvider {...form}>
            <form
              aria-label="Retirement plan assumptions"
              noValidate
              onChange={() => setCanSavePlan(true)}
              onSubmit={(event) => event.preventDefault()}
            >
              <RetirementPlanForm
                onViewResults={() => navigateToPage("results")}
                personTaxes={firstProjectionYear?.personTaxes}
                projection={projection}
                projectionYear={firstProjectionYear}
              />
            </form>
          </FormProvider>
          {!hasSavedPlan && (
            <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              This plan currently uses the illustrative example. Replace the sample values with your own assumptions before saving your plan.
            </p>
          )}
        </section>

        <footer className="pb-8 pt-8 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          Explore your financial future. Understand your options. Make your own decisions.
        </footer>
      </main>
    </div>
  );
}

function PageHeading({ activePage }: { activePage: AppPage }) {
  const pageContent: Record<AppPage, { eyebrow: string; title: string; description: string }> = {
    plan: {
      eyebrow: "Build your plan",
      title: "My Plan",
      description:
        "Enter the assumptions used for your illustrative retirement projection. Changes are saved automatically in this browser.",
    },
    results: {
      eyebrow: "My Results",
      title: "Your Retirement Projection",
      description:
        "Explore how your finances could develop over time, based on the assumptions in your plan.",
    },
    explore: {
      eyebrow: "Projection detail",
      title: "Explore your finances",
      description: "Review the calculations and assumptions behind your projection.",
    },
    scenarios: {
      eyebrow: "Compare assumptions",
      title: "Explore Different Scenarios",
      description:
        "Change your assumptions to see how different choices could affect your projected finances.",
    },
    finances: {
      eyebrow: "Technical detail",
      title: "Detailed Finances",
      description:
        "Inspect the annual financial statements and account movements used in the projection.",
    },
  };
  const content = pageContent[activePage];

  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
          {content.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
          {content.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {content.description}
        </p>
      </div>
    </div>
  );
}

function PageAction({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function KeyObservations({
  lifeExpectancy,
  lifeExpectancyYear,
  retirementAge,
  retirementYear,
  summary,
}: {
  lifeExpectancy: number;
  lifeExpectancyYear?: NonNullable<
    ReturnType<typeof calculateProjection>
  >["yearlyResults"][number];
  retirementAge: number;
  retirementYear?: NonNullable<
    ReturnType<typeof calculateProjection>
  >["yearlyResults"][number];
  summary: NonNullable<ReturnType<typeof calculateProjection>>["summary"];
}) {
  const observations = [
    retirementYear
      ? `At age ${retirementAge}, modelled annual income before tax is ${currencyFormatter.format(retirementYear.totalIncome)}; planned spending is ${currencyFormatter.format(retirementYear.spending)} and the mortgage payment is ${currencyFormatter.format(retirementYear.mortgagePayment)}.`
      : `No projection year is available at retirement age ${retirementAge}.`,
    retirementYear
      ? `Projected invested assets at age ${retirementAge}: ${currencyFormatter.format(retirementYear.totalInvestedAssets)}.`
      : null,
    summary.ageAssetsRunOut === null
      ? `No funding shortfall is projected within the period ending at age ${lifeExpectancy}.`
      : `The first projected funding shortfall occurs at age ${summary.ageAssetsRunOut}.`,
    lifeExpectancyYear
      ? `Projected net worth at age ${lifeExpectancy}: ${currencyFormatter.format(lifeExpectancyYear.netWorth)}.`
      : null,
  ].filter((observation): observation is string => observation !== null);

  return (
    <section
      aria-labelledby="key-observations-heading"
      className="mt-7"
    >
      <h2
        className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white"
        id="key-observations-heading"
      >
        Key Observations From Your Projection
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {observations.slice(0, 4).map((observation) => (
          <li
            className="rounded-lg bg-white px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300"
            key={observation}
          >
            {observation}
          </li>
        ))}
      </ul>
    </section>
  );
}
