import type { StatementView } from "@/types/financialStatements";

const views: Array<{ value: StatementView; label: string }> = [
  { value: "profit-loss", label: "Profit & Loss" },
  { value: "balance-sheet", label: "Balance Sheet" },
  { value: "combined", label: "Combined View" },
];

export function StatementViewToggle({
  view,
  onChange,
}: {
  view: StatementView;
  onChange: (nextView: StatementView) => void;
}) {
  return (
    <div
      aria-label="Financial statement view"
      className="grid gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:inline-grid sm:grid-cols-3"
      role="group"
    >
      {views.map((option) => (
        <button
          aria-pressed={view === option.value}
          className={`min-h-10 rounded-lg px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-center ${
            view === option.value
              ? "bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
