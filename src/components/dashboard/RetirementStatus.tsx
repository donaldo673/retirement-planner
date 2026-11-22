import type { ProjectionStatus } from "@/types/retirement";
import { DashboardIcon } from "./DashboardIcon";

interface RetirementStatusProps {
  status: ProjectionStatus;
}

const statusStyles: Record<
  ProjectionStatus,
  {
    title: string;
    description: string;
    icon: "check" | "alert";
    className: string;
    iconClassName: string;
  }
> = {
  green: {
    title: "On track",
    description: "Based on your current assumptions, your plan appears sustainable.",
    icon: "check",
    className:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900 dark:from-emerald-950/70 dark:via-slate-900 dark:to-teal-950/50",
    iconClassName:
      "bg-emerald-600 text-white shadow-sm shadow-emerald-900/15",
  },
  amber: {
    title: "Worth reviewing",
    description:
      "Your assets last through the planning horizon, but the projected final estate is below £50,000.",
    icon: "alert",
    className:
      "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:border-amber-900 dark:from-amber-950/60 dark:via-slate-900 dark:to-orange-950/40",
    iconClassName: "bg-amber-500 text-white shadow-sm shadow-amber-900/15",
  },
  red: {
    title: "Plan needs attention",
    description:
      "Your projection shows a spending shortfall before the end of your planning horizon.",
    icon: "alert",
    className:
      "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:border-rose-900 dark:from-rose-950/60 dark:via-slate-900 dark:to-orange-950/40",
    iconClassName: "bg-rose-600 text-white shadow-sm shadow-rose-900/15",
  },
};

export function RetirementStatus({ status }: RetirementStatusProps) {
  const content = statusStyles[status];

  return (
    <section
      aria-labelledby="retirement-status-heading"
      className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm sm:p-5 ${content.className}`}
      role="status"
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${content.iconClassName}`}
      >
        <DashboardIcon className="size-6" name={content.icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Retirement status
        </p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl dark:text-white"
          id="retirement-status-heading"
        >
          {content.title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {content.description}
        </p>
      </div>
    </section>
  );
}
