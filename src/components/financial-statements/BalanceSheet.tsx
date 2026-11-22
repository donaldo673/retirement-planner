import type { BalanceSheet as BalanceSheetModel } from "@/types/financialStatements";
import {
  StatementLines,
  StatementPanel,
} from "./StatementPrimitives";

export function BalanceSheet({
  balanceSheet,
}: {
  balanceSheet: BalanceSheetModel;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <PositionCard
          label="Opening Balance Sheet"
          position={balanceSheet.opening}
        />
        <PositionCard
          label="Closing Balance Sheet"
          position={balanceSheet.closing}
        />
      </div>
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        {balanceSheet.notes.join(" ")}
      </p>
    </div>
  );
}

function PositionCard({
  label,
  position,
}: {
  label: string;
  position: BalanceSheetModel["closing"];
}) {
  return (
    <StatementPanel title={`${label} — Age ${position.age}`}>
      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Assets
      </h4>
      <StatementLines
        lines={[
          { label: "Cash", amount: position.assets.cash },
          { label: "ISA", amount: position.assets.isa },
          { label: "Pension", amount: position.assets.pension },
          { label: "GIA", amount: position.assets.gia },
          { label: "Other assets", amount: position.assets.otherAssets },
          {
            label: "Total projected assets",
            amount: position.assets.totalProjectedAssets,
            emphasis: "subtotal",
          },
        ]}
      />
      <h4 className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Liabilities
      </h4>
      <StatementLines
        lines={[
          { label: "Mortgage", amount: position.liabilities.mortgage },
          { label: "Other debt", amount: position.liabilities.otherDebt },
          {
            label: "Total modeled liabilities",
            amount: position.liabilities.totalModeledLiabilities,
            emphasis: "subtotal",
          },
        ]}
      />
      <StatementLines
        lines={[
          { label: "Net worth", amount: position.netWorth, emphasis: "total" },
        ]}
      />
      <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          Property (memo only; excluded from totals)
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0,
          }).format(position.assets.propertyMemoValue)}
        </p>
      </div>
    </StatementPanel>
  );
}
