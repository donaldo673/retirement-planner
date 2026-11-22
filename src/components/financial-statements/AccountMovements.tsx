import type { AnnualAccountMovement } from "@/types/financialStatements";
import {
  StatementLines,
  StatementPanel,
} from "./StatementPrimitives";

const accountLabels: Record<AnnualAccountMovement["account"], string> = {
  cash: "Cash",
  isa: "ISA",
  pension: "Pension",
  gia: "GIA",
  property: "Property",
  mortgage: "Mortgage",
};

export function AccountMovements({
  movements,
}: {
  movements: AnnualAccountMovement[];
}) {
  return (
    <StatementPanel
      description="Opening and closing balances with the contribution, withdrawal, and growth values exposed by the projection."
      title="Account Movement Analysis"
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {movements.map((item) => (
          <article
            className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            key={item.account}
          >
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {accountLabels[item.account]}
            </h4>
            {item.account === "property" ? (
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                {item.note}
              </p>
            ) : item.account === "mortgage" ? (
              <>
                <StatementLines
                  lines={[
                    { label: "Opening balance", amount: item.openingBalance },
                    { label: "Mortgage payments", amount: item.payment },
                    { label: "Closing balance", amount: item.closingBalance },
                    {
                      label: "Liability movement",
                      amount: item.netChange === null ? null : -item.netChange,
                      emphasis: "total",
                    },
                  ]}
                />
                <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                  {item.note}
                </p>
              </>
            ) : (
              <>
                <StatementLines
                  lines={[
                    { label: "Opening", amount: item.openingBalance },
                    { label: "Contributions", amount: item.contributions },
                    {
                      label: "Withdrawals",
                      amount:
                        item.withdrawals === null ? null : -item.withdrawals,
                    },
                    {
                      label: "Investment growth retained in balance",
                      amount: item.investmentGrowth,
                    },
                    { label: "Closing", amount: item.closingBalance },
                    { label: "Net change", amount: item.netChange, emphasis: "total" },
                  ]}
                />
                {item.note && (
                  <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                    {item.note}
                  </p>
                )}
              </>
            )}
          </article>
        ))}
      </div>
    </StatementPanel>
  );
}
