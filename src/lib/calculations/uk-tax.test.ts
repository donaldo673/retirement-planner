import assert from "node:assert/strict";
import test from "node:test";
import type { TaxInputs } from "@/types/retirement";
import { calculateUkTax } from "./uk-tax";

function taxInputs(overrides: Partial<TaxInputs> = {}): TaxInputs {
  return {
    taxYear: 2026,
    inflationRate: 0.025,
    jurisdiction: "england",
    age: 40,
    statePensionAge: 67,
    employmentIncomes: [],
    rentalProfit: 0,
    otherTaxableIncome: 0,
    pensionIncome: 0,
    statePensionIncome: 0,
    savingsInterest: 0,
    dividendIncome: 0,
    capitalGains: 0,
    ...overrides,
  };
}

test("2026/27 England income tax and employee National Insurance use current bands", () => {
  const result = calculateUkTax(
    taxInputs({ employmentIncomes: [65_000] }),
  );

  assert.equal(result.incomeTax, 13_432);
  assert.ok(Math.abs(result.nationalInsurance - 3_310.6) < 1e-10);
});

test("Scottish employment income uses Scottish progressive bands", () => {
  const result = calculateUkTax(
    taxInputs({
      jurisdiction: "scotland",
      employmentIncomes: [50_000],
    }),
  );

  const expected =
    3_967 * 0.19 + 12_989 * 0.2 + 14_136 * 0.21 + 6_338 * 0.42;
  assert.ok(Math.abs(result.incomeTax - expected) < 1e-10);
});

test("multiple jobs aggregate for income tax but calculate employee NI per job", () => {
  const twoJobs = calculateUkTax(
    taxInputs({ employmentIncomes: [40_000, 40_000] }),
  );
  const oneJob = calculateUkTax(
    taxInputs({ employmentIncomes: [80_000] }),
  );

  assert.equal(twoJobs.incomeTax, oneJob.incomeTax);
  assert.ok(Math.abs(twoJobs.nationalInsurance - 4_388.8) < 1e-10);
  assert.ok(twoJobs.nationalInsurance > oneJob.nationalInsurance);
});

test("employment income is not charged employee NI from State Pension age", () => {
  const result = calculateUkTax(
    taxInputs({
      age: 67,
      employmentIncomes: [40_000],
    }),
  );

  assert.equal(result.nationalInsurance, 0);
});

test("savings and dividends use their allowances and current rates", () => {
  const result = calculateUkTax(
    taxInputs({
      employmentIncomes: [30_000],
      savingsInterest: 1_500,
      dividendIncome: 1_000,
    }),
  );

  assert.ok(Math.abs(result.incomeTax - 3_639.75) < 1e-10);
});

test("savings allowance is applied to the highest-rate interest", () => {
  const result = calculateUkTax(
    taxInputs({
      employmentIncomes: [49_000],
      savingsInterest: 2_000,
    }),
  );

  assert.ok(Math.abs(result.incomeTax - (7_286 + 346)) < 1e-10);
});

test("dividend allowance does not consume rate-band headroom", () => {
  const result = calculateUkTax(
    taxInputs({
      employmentIncomes: [49_000],
      dividendIncome: 2_000,
    }),
  );

  assert.ok(Math.abs(result.incomeTax - (7_286 + 218.75)) < 1e-10);
});

test("personal allowance tapers above £100,000", () => {
  const result = calculateUkTax(
    taxInputs({ employmentIncomes: [110_000] }),
  );

  assert.equal(result.incomeTax, 32_432);
});

test("capital gains use the annual exempt amount and basic-rate headroom", () => {
  const result = calculateUkTax(
    taxInputs({
      employmentIncomes: [30_000],
      capitalGains: 5_000,
    }),
  );

  assert.equal(result.capitalGainsTax, 360);
});

test("thresholds inflate after the current freeze period", () => {
  const frozenYear = calculateUkTax(
    taxInputs({ taxYear: 2027, employmentIncomes: [50_270] }),
  );
  const indexedYear = calculateUkTax(
    taxInputs({ taxYear: 2028, employmentIncomes: [50_270] }),
  );

  assert.ok(indexedYear.incomeTax < frozenYear.incomeTax);
});

test("negative investment income is rejected as a taxable-income input", () => {
  assert.throws(
    () => calculateUkTax(taxInputs({ savingsInterest: -100 })),
    /cannot be negative/,
  );
});
