import type { ProjectionYear } from "@/types/retirement";
import type { AssetAllocationPoint } from "@/types/charts";

export function transformAssetAllocationData(
  yearlyResults: readonly ProjectionYear[],
): AssetAllocationPoint[] {
  return yearlyResults.map((year) => ({
    age: year.age,
    pension: year.pensionValue,
    isa: year.isaValue,
    gia: year.giaValue,
    cash: year.cashValue,
  }));
}
