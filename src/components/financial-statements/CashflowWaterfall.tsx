import type { CashflowWaterfall as CashflowWaterfallModel } from "@/types/financialStatements";
import { formatStatementCurrency } from "./StatementPrimitives";

export function CashflowWaterfall({
  waterfall,
}: {
  waterfall: CashflowWaterfallModel;
}) {
  const stages = [
    { label: "Gross income", amount: waterfall.grossIncome, tone: "income" },
    { label: "Tax", amount: -waterfall.tax, tone: "outflow" },
    { label: "Net income", amount: waterfall.netIncome, tone: "subtotal" },
    {
      label: "Planned spending",
      amount: -waterfall.plannedSpending,
      tone: "outflow",
    },
    {
      label: "Mortgage payments",
      amount: -waterfall.mortgagePayments,
      tone: "outflow",
    },
    {
      label: "Net surplus / (deficit)",
      amount: waterfall.netSurplusDeficit,
      tone: "total",
    },
    {
      label: "Net account contributions / (withdrawals)",
      amount: waterfall.netAccountMovement,
      tone: "movement",
    },
  ] as const;

  return (
    <section
      aria-label="Household cashflow waterfall"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Household Cashflow Waterfall
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Follow the selected year&apos;s income through tax and spending to the
          model&apos;s net cashflow and account movements.
        </p>
      </div>
      <ol className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage, index) => (
          <li className="relative min-w-0" key={stage.label}>
            <div
              className={`h-full rounded-xl border p-3 ${
                stage.tone === "income" || stage.tone === "total"
                  ? "border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/30"
                  : stage.tone === "outflow"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
              }`}
            >
              <p className="text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                {stage.label}
              </p>
              <p className="mt-1 break-words text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-100">
                {formatStatementCurrency(stage.amount)}
              </p>
            </div>
            {index < stages.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 text-xs text-teal-700 sm:hidden"
              >
                ↓
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
        Net account movement is the projection&apos;s combined contributions
        minus withdrawals; it can differ from net cashflow when portfolio
        withdrawals fund spending.
      </p>
    </section>
  );
}
