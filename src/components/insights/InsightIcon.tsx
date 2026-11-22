import type { InsightCategory } from "@/types/insights";

interface InsightIconProps {
  category: InsightCategory;
  className?: string;
}

const iconStyles: Record<InsightCategory, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  opportunity: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  information: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function InsightIcon({
  category,
  className = "",
}: InsightIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${iconStyles[category]} ${className}`}
    >
      <svg
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
        width="20"
      >
        {category === "success" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
          </>
        )}
        {category === "opportunity" && (
          <>
            <path d="M9 18h6M10 22h4M8.5 14.5a6 6 0 1 1 7 0c-.8.6-1.3 1.4-1.5 2.5h-4c-.2-1.1-.7-1.9-1.5-2.5Z" />
          </>
        )}
        {category === "warning" && (
          <>
            <path d="M10.3 4.4 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.7 4.4a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4m0 4h.01" />
          </>
        )}
        {category === "information" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5m0-8h.01" />
          </>
        )}
      </svg>
    </span>
  );
}
