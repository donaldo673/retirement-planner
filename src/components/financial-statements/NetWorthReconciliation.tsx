import type { NetWorthReconciliation as ReconciliationModel } from "@/types/financialStatements";
import {
  formatStatementCurrency,
  StatementLines,
  StatementPanel,
} from "./StatementPrimitives";

export function NetWorthReconciliation({
  reconciliation,
}: {
  reconciliation: ReconciliationModel;
}) {
  return (
    <StatementPanel
      description="A bridge from the opening to closing net worth using only movement values exposed by the model."
      title="Movement During Year"
    >
      <StatementLines
        lines={[
          { label: "Opening net worth", amount: reconciliation.openingNetWorth },
          {
            label: "Investment growth retained in accounts",
            amount: reconciliation.investmentGrowth,
          },
          {
            label: "Net account contributions / (withdrawals)",
            amount: reconciliation.netAccountContributions,
          },
          {
            label: "Mortgage liability reduction",
            amount: reconciliation.mortgageLiabilityReduction,
          },
          {
            label: "Other modeled asset movement",
            amount: reconciliation.otherAssetsMovement,
          },
          { label: "Closing net worth", amount: reconciliation.closingNetWorth, emphasis: "total" },
          {
            label: "Reconciliation difference",
            amount: reconciliation.unreconciledDifference,
          },
        ]}
      />
      <p
        className={`mt-3 rounded-lg px-3 py-2 text-xs ${
          reconciliation.isReconciled
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
            : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        }`}
        role="status"
      >
        {reconciliation.isReconciled
          ? `Reconciled within £0.01. Difference: ${formatStatementCurrency(
              reconciliation.unreconciledDifference,
            )}.`
          : `The movement bridge does not reconcile within £0.01. Difference: ${formatStatementCurrency(
              reconciliation.unreconciledDifference,
            )}.`}
      </p>
    </StatementPanel>
  );
}
