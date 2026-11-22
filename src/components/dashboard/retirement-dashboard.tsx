"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/components/dashboard/DashboardIcon";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { FinancialStatementsPage } from "@/components/financial-statements/FinancialStatementsPage";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { RetirementPlanForm } from "@/components/forms/retirement-plan-form";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { PlanningMetrics } from "@/components/insights/PlanningMetrics";
import { PotentialImprovements } from "@/components/insights/PotentialImprovements";
import { RetirementHealth } from "@/components/insights/RetirementHealth";
import { RetirementReadinessScore } from "@/components/insights/RetirementReadinessScore";
import { RiskMonitor } from "@/components/insights/RiskMonitor";
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

const plannerSections: {
  id: string;
  href: string;
  label: string;
  icon: DashboardIconName;
}[] = [
  { id: "overview", href: "#overview", label: "Dashboard", icon: "dashboard" },
  {
    id: "scenario-manager",
    href: "#scenario-manager",
    label: "Scenarios",
    icon: "chart",
  },
  {
    id: "financial-statements",
    href: "#financial-statements",
    label: "Financial Statements",
    icon: "document",
  },
  {
    id: "personal",
    href: "#personal",
    label: "Personal details",
    icon: "user",
  },
  { id: "assets", href: "#assets", label: "Assets", icon: "wallet" },
  { id: "income", href: "#income", label: "Income", icon: "briefcase" },
  { id: "spending", href: "#spending", label: "Spending", icon: "cart" },
  {
    id: "assumptions",
    href: "#assumptions",
    label: "Assumptions",
    icon: "chart",
  },
  {
    id: "withdrawals",
    href: "#withdrawals",
    label: "Withdrawal strategy",
    icon: "arrows",
  },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown browser storage error.";
}

function Sidebar({ activeSection }: { activeSection: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex dark:border-slate-800 dark:bg-slate-900">
      <a
        aria-label="Retirement planner home"
        className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
        href="#overview"
      >
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-teal-500 dark:text-slate-950"
        >
          FP
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-950 dark:text-white">
            Futureplan
          </span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            Your future, in focus
          </span>
        </span>
      </a>

      <nav aria-label="Planner sections" className="mt-10 space-y-1">
        {plannerSections.map((section) => (
          <a
            aria-current={activeSection === section.id ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
              activeSection === section.id
                ? "bg-teal-50 font-semibold text-teal-900 dark:bg-teal-950/60 dark:text-teal-200"
                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
            href={section.href}
            key={section.href}
          >
            <DashboardIcon
              className={`size-4 ${activeSection === section.id ? "text-teal-700 dark:text-teal-300" : "text-slate-400 dark:text-slate-500"}`}
              name={section.icon}
            />
            {section.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Planning note</p>
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Projections estimate income tax, National Insurance, and capital gains
          tax using your selected UK jurisdiction.
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
  const { reset } = form;
  const [canSavePlan, setCanSavePlan] = useState(false);
  const [persistenceStatus, setPersistenceStatus] =
    useState<PersistenceStatus>({
      kind: "loading",
      message: "Checking this browser for a saved plan...",
    });
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const watchedPlan = useWatch({ control: form.control });

  useEffect(() => {
    let animationFrame = 0;
    const updateActiveSection = () => {
      if (animationFrame !== 0) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        const activationLine = window.innerHeight * 0.25;
        let nextActiveSection = plannerSections[0].id;

        for (const section of plannerSections) {
          const element = document.getElementById(section.id);
          if (element && element.getBoundingClientRect().top <= activationLine) {
            nextActiveSection = section.id;
          } else {
            break;
          }
        }

        setActiveSection((current) =>
          current === nextActiveSection ? current : nextActiveSection,
        );
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

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
        setCanSavePlan(true);
        setPersistenceStatus({
          kind: "saved",
          message: "Valid changes will be saved automatically in this browser.",
        });
        return;
      }

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
    () =>
      parsedPlan.success ? calculateProjection(parsedPlan.data) : null,
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

  function resetPlan() {
    form.reset(createSampleRetirementPlan());
    setCanSavePlan(true);
    setPersistenceStatus({
      kind: "unsaved",
      message: "Example plan restored. Saving it in this browser...",
    });
  }

  return (
    <div className="flex min-h-screen min-w-0 bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        className="fixed left-3 top-3 z-[100] -translate-y-[180%] rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        href="#main-content"
      >
        Skip to content
      </a>
      <Sidebar activeSection={activeSection} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                aria-controls="mobile-planner-navigation"
                aria-expanded={mobileMenuOpen}
                aria-label={
                  mobileMenuOpen ? "Close section menu" : "Open section menu"
                }
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
                type="button"
              >
                <DashboardIcon
                  className="size-5"
                  name={mobileMenuOpen ? "close" : "menu"}
                />
              </button>
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white lg:hidden dark:bg-teal-500 dark:text-slate-950"
              >
                FP
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  Your retirement plan
                </p>
                <p className="hidden text-xs text-slate-500 md:block dark:text-slate-400">
                  A clear view of your future finances
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <button
                className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:px-4 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={persistenceStatus.kind === "loading"}
                onClick={resetPlan}
                type="button"
              >
                <span className="sm:hidden">Reset</span>
                <span className="hidden sm:inline">Reset example</span>
              </button>
            </div>
          </div>
          <nav
            aria-label="Planner sections"
            className={`grid grid-cols-2 gap-1 border-t border-slate-100 px-3 py-3 sm:grid-cols-3 lg:hidden dark:border-slate-800 ${
              mobileMenuOpen ? "" : "hidden"
            }`}
            id="mobile-planner-navigation"
          >
            {plannerSections.map((section) => (
              <a
                aria-current={activeSection === section.id ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-2.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${
                  activeSection === section.id
                    ? "bg-teal-50 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                href={section.href}
                key={section.href}
                onClick={() => {
                  setActiveSection(section.id);
                  setMobileMenuOpen(false);
                }}
              >
                <DashboardIcon className="size-4 shrink-0" name={section.icon} />
                <span className="truncate">{section.label}</span>
              </a>
            ))}
          </nav>
        </header>

        <main
          className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8"
          id="main-content"
        >
          <section aria-labelledby="overview-heading" className="scroll-mt-24" id="overview">
            <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                  Your financial future
                </p>
                <h1
                  className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white"
                  id="overview-heading"
                >
                  A clearer view of what&apos;s ahead.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
                  Explore how your income, spending and savings could shape the
                  retirement you&apos;re planning for.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Example plan
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  GBP · after tax
                </span>
              </div>
            </div>

            <aside
              aria-labelledby="local-storage-heading"
              className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
                id="local-storage-heading"
              >
                Local data and privacy
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                This planner uses browser local storage, not cookies, to keep
                your valid plan inputs on this device. The app does not send
                your plan to a server. This data is not encrypted, so anyone
                with access to this device or browser profile may be able to
                view it; clear this browser&apos;s site data to remove it.
              </p>
              <p
                className={`mt-2 text-xs font-medium ${
                  persistenceStatus.kind === "error"
                    ? "text-rose-700 dark:text-rose-300"
                    : persistenceStatus.kind === "unsaved"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-800 dark:text-emerald-300"
                }`}
                role={
                  persistenceStatus.kind === "error" ? "alert" : "status"
                }
              >
                {persistenceStatus.message}
              </p>
            </aside>

            {summary &&
            projection &&
            firstProjectionYear &&
            planningAnalysis &&
            parsedPlan.success ? (
              <>
                <DashboardSummary
                  currentAge={form.getValues("people.person1.income.currentAge")}
                  firstProjectionYear={firstProjectionYear}
                  retirementAge={form.getValues("personalDetails.retirementAge")}
                  summary={summary}
                />
                <ScenarioWorkspace
                  analysis={planningAnalysis}
                  currentPlanChanged={form.formState.isDirty}
                  isPlanLoading={persistenceStatus.kind === "loading"}
                  onLoadPlan={(plan) => reset(plan)}
                  plan={parsedPlan.data}
                  projection={projection}
                >
                  {({ scenarioSeries, scenarioPanel }) => (
                    <>
                      <ChartDashboard
                        currentAge={form.getValues(
                          "people.person1.income.currentAge",
                        )}
                        lifeExpectancy={form.getValues(
                          "personalDetails.lifeExpectancy",
                        )}
                        retirementAge={form.getValues(
                          "personalDetails.retirementAge",
                        )}
                        scenarioSeries={scenarioSeries}
                        summary={summary}
                        yearlyResults={projection.yearlyResults}
                      />
                      <RetirementReadinessScore
                        readiness={planningAnalysis.readiness}
                      />
                      <RetirementHealth assessments={planningAnalysis.health} />
                      <PlanningMetrics metrics={planningAnalysis.metrics} />
                      <InsightsPanel insights={planningAnalysis.insights} />
                      <PotentialImprovements
                        opportunities={planningAnalysis.opportunities}
                      />
                      <RiskMonitor risks={planningAnalysis.risks} />
                      {scenarioPanel}
                    </>
                  )}
                </ScenarioWorkspace>
              </>
            ) : (
              <div
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
                role="status"
              >
                Complete the highlighted fields to update your projection.
              </div>
            )}
          </section>

          <FinancialStatementsPage
            plan={parsedPlan.success ? parsedPlan.data : null}
            projection={projection}
          />

          <section
            aria-labelledby="plan-inputs-heading"
            className="mb-5 mt-10 scroll-mt-24 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                Build your plan
              </p>
              <h2
                className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
                id="plan-inputs-heading"
              >
                Your planning assumptions
              </h2>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Changes update the estimate immediately. Valid inputs save
              automatically in this browser.
            </p>
          </section>

          <FormProvider {...form}>
            <form
              aria-label="Retirement plan assumptions"
              noValidate
              onSubmit={(event) => event.preventDefault()}
            >
              <RetirementPlanForm
                personTaxes={firstProjectionYear?.personTaxes}
                projection={projection}
                projectionYear={firstProjectionYear}
              />
            </form>
          </FormProvider>

          <footer className="pb-8 pt-8 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            Retirement planning estimates are for illustration only and are not
            personal financial advice.
          </footer>
        </main>
      </div>
    </div>
  );
}
