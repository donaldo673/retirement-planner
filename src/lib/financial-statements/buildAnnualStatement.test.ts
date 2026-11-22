import assert from "node:assert/strict";
import test from "node:test";
import { createSampleRetirementPlan } from "../../data/sample-plan";
import { calculateProjection } from "../calculations/retirement-engine";
import { buildAnnualStatement } from "./buildAnnualStatement";

test("annual statements map projection years and reconcile modeled net worth", () => {
  const plan = createSampleRetirementPlan();
  const projection = calculateProjection(plan);

  for (const year of projection.yearlyResults) {
    const statement = buildAnnualStatement(projection, plan, year.age);

    assert.equal(statement.age, year.age);
    assert.equal(statement.profitLoss.netSurplusDeficit, year.netCashflow);
    assert.equal(statement.balanceSheet.closing.netWorth, year.netWorth);
    assert.ok(
      Math.abs(statement.reconciliation.unreconciledDifference) <= 0.01,
    );
    assert.ok(
      Math.abs(
        statement.balanceSheet.closing.assets.totalProjectedAssets -
          statement.balanceSheet.closing.liabilities.totalModeledLiabilities -
          year.netWorth,
      ) < 0.01,
    );
  }
});

test("the current age is presented as a baseline snapshot without annual activity", () => {
  const plan = createSampleRetirementPlan();
  const projection = calculateProjection(plan);
  const currentAge = plan.people.person1.income.currentAge;
  const statement = buildAnnualStatement(projection, plan, currentAge);

  assert.equal(statement.isBaselineSnapshot, true);
  assert.equal(statement.profitLoss.income.grossIncome, 0);
  assert.equal(statement.balanceSheet.opening.netWorth, statement.balanceSheet.closing.netWorth);
});
