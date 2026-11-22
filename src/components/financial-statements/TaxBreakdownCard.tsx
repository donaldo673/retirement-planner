import type { TaxBreakdown } from "@/types/financialStatements";
import {
  formatStatementPercentage,
  StatementLines,
  StatementPanel,
} from "./StatementPrimitives";

export function TaxBreakdownCard({ tax }: { tax: TaxBreakdown }) {
  return (
    <StatementPanel
      description="Tax components and income sources from the selected projection year."
      title="Why This Tax Was Paid"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Taxable income sources
          </h4>
          <StatementLines lines={tax.taxableIncomeSources} />
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            Band usage:{" "}
            {tax.bandUsage ?? "Not exposed by the existing tax model."}
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tax components
          </h4>
          <StatementLines
            lines={[
              {
                label: "Income tax (includes savings and dividend tax)",
                amount: tax.incomeTax,
              },
              { label: "Capital gains tax", amount: tax.capitalGainsTax },
              {
                label: "Dividend tax",
                amount: tax.dividendTax,
                note: "Included in income tax; not separately reported.",
              },
              { label: "National Insurance", amount: tax.nationalInsurance },
              { label: "Other taxes", amount: tax.otherTaxes },
              { label: "Total tax", amount: tax.totalTax, emphasis: "total" },
            ]}
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <RateCard
              label="Effective Tax Rate"
              value={formatStatementPercentage(tax.effectiveTaxRate)}
              description="Total tax divided by gross taxable income."
            />
            {tax.marginalRates.map(({ person, rate }) => (
              <RateCard
                description="Income tax plus employee NI on £1 more earned through an existing job."
                key={person}
                label={
                  tax.marginalRates.length > 1
                    ? `${person === "person1" ? "Person 1" : "Person 2"} Marginal Rate`
                    : "Marginal Tax Rate"
                }
                value={formatStatementPercentage(rate)}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
            Marginal rate assumes the extra earnings are added to the
            person&apos;s first existing job. National Insurance can differ
            between jobs.
          </p>
        </div>
      </div>
    </StatementPanel>
  );
}

function RateCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
