import type { PensionAnalysis as PensionAnalysisModel } from "@/types/financialStatements";
import {
  StatementLines,
  StatementPanel,
} from "./StatementPrimitives";

export function PensionAnalysis({
  analysis,
}: {
  analysis: PensionAnalysisModel;
}) {
  return (
    <StatementPanel
      description="Pension account movements from the selected projection year."
      title="Pension Drawdown Analysis"
    >
      <StatementLines
        lines={[
          { label: "Opening pension value", amount: analysis.openingValue },
          { label: "Investment growth", amount: analysis.investmentGrowth },
          { label: "Contributions", amount: analysis.contributions },
          {
            label: "Taxable pension withdrawals (as modeled)",
            amount: -analysis.taxableWithdrawals,
          },
          {
            label: "Tax-free pension lump sums",
            amount: analysis.taxFreeWithdrawals,
            note: "Not separately modeled.",
          },
          {
            label: "Closing pension value / remaining balance",
            amount: analysis.remainingBalance,
            emphasis: "total",
          },
        ]}
      />
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {analysis.note}
      </p>
    </StatementPanel>
  );
}
