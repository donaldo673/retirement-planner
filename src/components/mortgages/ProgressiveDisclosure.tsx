"use client";

import { useId, useState, type ReactNode } from "react";

interface ProgressiveDisclosureProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ProgressiveDisclosure({
  title,
  children,
  className = "",
}: ProgressiveDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-600 dark:text-slate-100 dark:hover:bg-slate-800/60"
        onClick={() => setExpanded((open) => !open)}
        type="button"
      >
        <span>{title}</span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-base text-teal-700 transition-transform duration-300 dark:text-teal-300 ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>
      <div
        aria-hidden={!expanded}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        id={panelId}
        inert={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
