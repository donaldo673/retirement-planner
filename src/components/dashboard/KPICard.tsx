import { DashboardIcon, type DashboardIconName } from "./DashboardIcon";

export type KPITone = "teal" | "green" | "amber" | "red" | "slate";

export interface KPICardProps {
  label: string;
  value: string;
  supportingText: string;
  statusLabel: string;
  icon: DashboardIconName;
  tone: KPITone;
}

const toneStyles: Record<KPITone, string> = {
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const statusStyles: Record<KPITone, string> = {
  teal: "text-teal-700 dark:text-teal-300",
  green: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  red: "text-rose-700 dark:text-rose-300",
  slate: "text-slate-500 dark:text-slate-400",
};

export function KPICard({
  label,
  value,
  supportingText,
  statusLabel,
  icon,
  tone,
}: KPICardProps) {
  return (
    <article className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
          >
            <DashboardIcon className="size-5" name={icon} />
          </span>
          <span
            className={`min-w-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${statusStyles[tone]}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
      <p className="mt-5 break-words text-[1.7rem] font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl dark:text-white">
        {value}
      </p>
      <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {supportingText}
      </p>
    </article>
  );
}
