import type { ProjectionYear } from "@/types/retirement";
import type { ProjectionPoint } from "@/types/charts";

export function transformNetWorthData(
  yearlyResults: readonly ProjectionYear[],
): ProjectionPoint[] {
  return yearlyResults.map(({ age, netWorth }) => ({ age, netWorth }));
}
