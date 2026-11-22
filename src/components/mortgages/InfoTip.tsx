import type { ReactNode } from "react";

interface InfoTipProps {
  label: string;
  children: ReactNode;
}

export function InfoTip({ label, children }: InfoTipProps) {
  return (
    <details className="group relative inline-block align-middle">
      <summary
        aria-label={`What is ${label}?`}
        className="flex size-5 cursor-pointer list-none items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-500 hover:border-teal-600 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [&::-webkit-details-marker]:hidden dark:border-slate-600 dark:text-slate-400 dark:hover:text-teal-300"
        title={label}
      >
        i
      </summary>
      <span
        className="absolute left-0 top-full z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs font-normal leading-5 text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        role="tooltip"
      >
        {children}
      </span>
    </details>
  );
}
