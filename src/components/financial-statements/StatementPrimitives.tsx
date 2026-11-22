import type { ReactNode } from "react";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatStatementCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "Not modeled";
  }

  if (value < 0) {
    return `(${currencyFormatter.format(Math.abs(value))})`;
  }

  return currencyFormatter.format(value);
}

export function formatStatementPercentage(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? "Not available"
    : percentageFormatter.format(value);
}

export function StatementPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function StatementLines({
  lines,
}: {
  lines: Array<{
    label: string;
    amount: number | null;
    note?: string;
    emphasis?: "subtotal" | "total";
  }>;
}) {
  return (
    <dl className="divide-y divide-slate-100 dark:divide-slate-800">
      {lines.map((line) => (
        <div
          className={`flex min-w-0 items-start justify-between gap-3 py-2.5 ${
            line.emphasis ? "font-semibold text-slate-900 dark:text-slate-100" : ""
          } ${
            line.emphasis === "total"
              ? "border-t border-slate-200 pt-3 dark:border-slate-700"
              : ""
          }`}
          key={line.label}
        >
          <div className="min-w-0">
            <dt className="text-xs leading-5">{line.label}</dt>
            {line.note && (
              <dd className="mt-0.5 text-[11px] font-normal leading-4 text-slate-500 dark:text-slate-400">
                {line.note}
              </dd>
            )}
          </div>
          <dd className="shrink-0 text-right text-xs tabular-nums">
            {formatStatementCurrency(line.amount)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
