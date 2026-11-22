import assert from "node:assert/strict";
import test from "node:test";
import { createSampleRetirementPlan } from "../../data/sample-plan";
import { calculateProjection } from "../calculations/retirement-engine";
import { analyzePlanning, generateInsights } from "./generateInsights";

test("insights are sorted by descending priority and explain projected shortfalls", () => {
  const plan = createSampleRetirementPlan();
  plan.spending.buckets[0].annualAmount = 1_000_000;
  const projection = calculateProjection(plan);

  const insights = generateInsights({ plan, projection });

  assert.equal(insights[0].id, "projected-funding-shortfall");
  assert.equal(insights[0].category, "warning");
  assert.equal(insights[0].priority, 10);
  assert.ok(insights[0].explanation.dataSource.length > 0);
  assert.deepEqual(
    insights.map((insight) => insight.priority),
    [...insights.map((insight) => insight.priority)].sort(
      (first, second) => second - first,
    ),
  );
});

test("planning analysis returns bounded readiness, health, metrics, and transparent unassessed risks", () => {
  const plan = createSampleRetirementPlan();
  const projection = calculateProjection(plan);
  const analysis = analyzePlanning({ plan, projection });

  assert.ok(analysis.readiness.score >= 0);
  assert.ok(analysis.readiness.score <= 100);
  assert.equal(analysis.health.length, 5);
  assert.equal(analysis.metrics.length, 6);
  assert.equal(
    analysis.risks.find((risk) => risk.id === "sequence")?.level,
    "not-assessed",
  );
});
