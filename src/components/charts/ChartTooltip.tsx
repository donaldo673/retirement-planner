import type { TooltipContentProps } from "recharts";
import { formatChartCurrency } from "@/lib/charts/formatChartCurrency";

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipContentProps<number, string>["payload"];
  label?: string | number;
  labelPrefix?: string;
  context?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelPrefix = "Age",
  context,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const uniquePayload = payload.filter(
    (item, index) =>
      payload.findIndex(
        (candidate) =>
          candidate.name === item.name && candidate.value === item.value,
      ) === index,
  );

  return (
    <div className="max-w-64 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-950">
      {label !== undefined && (
        <p className="mb-2 font-semibold text-slate-950 dark:text-white">
          {labelPrefix ? `${labelPrefix} ${label}` : label}
        </p>
      )}
      <div className="space-y-1.5">
        {uniquePayload.map((item, index) => {
          const value =
            typeof item.value === "number" ? formatChartCurrency(item.value) : item.value;
          return (
            <div
              className="flex items-start justify-between gap-4"
              key={`${String(item.name)}-${index}`}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-950 dark:text-white">
                {value}
              </span>
            </div>
          );
        })}
      </div>
      {context && (
        <p className="mt-2 border-t border-slate-100 pt-2 leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {context}
        </p>
      )}
    </div>
  );
}
