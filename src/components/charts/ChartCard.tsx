import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
  controls?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  controls,
  className = "",
}: ChartCardProps) {
  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        {controls}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </article>
  );
}
