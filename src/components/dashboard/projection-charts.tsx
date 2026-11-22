import type {
  AccountProjectionBreakdown,
  ProjectionYear,
} from "@/types/retirement";

interface ChartSeries {
  label: string;
  color: string;
  values: number[];
}

interface ProjectionChartProps {
  id: string;
  title: string;
  description: string;
  years: ProjectionYear[];
  series: ChartSeries[];
}

const chartCurrencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 0,
});

function formatChartCurrency(value: number): string {
  return chartCurrencyFormatter.format(value);
}

function ProjectionChart({
  id,
  title,
  description,
  years,
  series,
}: ProjectionChartProps) {
  const width = 760;
  const height = 280;
  const plot = { left: 82, right: 18, top: 16, bottom: 42 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const values = series.flatMap((item) => item.values);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const range = maximum - minimum || 1;
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = minimum + (range * index) / 4;
    const y = plot.top + plotHeight - (plotHeight * index) / 4;
    return { value, y };
  });
  const ageTickIndexes = [
    ...new Set([
      0,
      Math.floor((years.length - 1) / 2),
      years.length - 1,
    ]),
  ];

  function getPoint(index: number, value: number): string {
    const x = getX(index);
    const y = plot.top + plotHeight - ((value - minimum) / range) * plotHeight;
    return `${x},${y}`;
  }

  function getX(index: number): number {
    return (
      plot.left +
      (years.length <= 1 ? plotWidth / 2 : (plotWidth * index) / (years.length - 1))
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      <svg
        aria-labelledby={`${id}-title ${id}-description`}
        className="mt-4 h-auto w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-description`}>
          {description} Values are in pounds. The horizontal axis shows age.
        </desc>
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line
              stroke="#e2e8f0"
              strokeDasharray="3 5"
              x1={plot.left}
              x2={width - plot.right}
              y1={tick.y}
              y2={tick.y}
            />
            <text
              fill="#64748b"
              fontSize="12"
              textAnchor="end"
              x={plot.left - 10}
              y={tick.y + 4}
            >
              {formatChartCurrency(tick.value)}
            </text>
          </g>
        ))}
        {ageTickIndexes.map((index) => {
          return (
            <text
              fill="#64748b"
              fontSize="12"
              key={`${years[index].age}-${index}`}
              textAnchor="middle"
              x={getX(index)}
              y={height - 12}
            >
              {years[index].age}
            </text>
          );
        })}
        <text
          fill="#64748b"
          fontSize="11"
          textAnchor="middle"
          x={plot.left + plotWidth / 2}
          y={height - 1}
        >
          Age
        </text>
        {series.map((item) =>
          item.values.length > 1 ? (
            <polyline
              aria-hidden="true"
              fill="none"
              key={item.label}
              points={item.values
                .map((value, index) => getPoint(index, value))
                .join(" ")}
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          ) : item.values.length === 1 ? (
            <circle
              aria-hidden="true"
              cx={getX(0)}
              cy={plot.top + plotHeight - ((item.values[0] - minimum) / range) * plotHeight}
              fill={item.color}
              key={item.label}
              r="4"
            />
          ) : null,
        )}
      </svg>
      <ul
        aria-label={`${title} legend`}
        className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600"
      >
        {series.map((item) => (
          <li className="flex items-center gap-2" key={item.label}>
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ProjectionCharts({
  yearlyResults,
}: {
  yearlyResults: ProjectionYear[];
}) {
  const annualYears = yearlyResults.slice(1);
  const accounts: {
    key: keyof AccountProjectionBreakdown;
    label: string;
    color: string;
  }[] = [
    { key: "isa", label: "ISA", color: "#047857" },
    { key: "pension", label: "Pension", color: "#2563eb" },
    { key: "gia", label: "GIA", color: "#d97706" },
    { key: "cash", label: "Cash", color: "#7c3aed" },
  ];
  const accountSeries = (
    metric: "accountNetContributions" | "accountInvestmentIncome",
  ): ChartSeries[] =>
    accounts.map((account) => ({
      label: account.label,
      color: account.color,
      values: annualYears.map((year) => year[metric][account.key]),
    }));

  return (
    <details className="group mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden sm:px-5">
        <span>View projection graphs</span>
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rotate-45 border-b-2 border-r-2 border-emerald-800 transition-transform group-open:-rotate-[135deg]"
        />
      </summary>
      <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-3 sm:p-5 lg:grid-cols-2">
        {annualYears.length > 0 ? (
          <>
            <ProjectionChart
              description="Annual income compared with spending, mortgage payments and tax."
              id="income-outgo-chart"
              series={[
                {
                  label: "Annual income",
                  color: "#047857",
                  values: annualYears.map((year) => year.totalIncome),
                },
                {
                  label: "Annual outgo",
                  color: "#e11d48",
                  values: annualYears.map(
                    (year) =>
                      year.spending +
                      year.mortgagePayment +
                      year.tax.totalTax,
                  ),
                },
              ]}
              title="Annual income and outgo"
              years={annualYears}
            />
            <ProjectionChart
              description="Account contributions less withdrawals in each projected year."
              id="account-contributions-chart"
              series={accountSeries("accountNetContributions")}
              title="Net contribution by account"
              years={annualYears}
            />
            <ProjectionChart
              description="Investment income generated by each account in each projected year."
              id="account-investment-income-chart"
              series={accountSeries("accountInvestmentIncome")}
              title="Investment income by account"
              years={annualYears}
            />
          </>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 lg:col-span-2">
            No annual projection years are available for this plan.
          </p>
        )}
        <ProjectionChart
          description="Projected net worth after liabilities at each age, including the opening balance."
          id="net-assets-chart"
          series={[
            {
              label: "Net assets",
              color: "#047857",
              values: yearlyResults.map((year) => year.netWorth),
            },
          ]}
          title="Net assets over time"
          years={yearlyResults}
        />
      </div>
    </details>
  );
}
