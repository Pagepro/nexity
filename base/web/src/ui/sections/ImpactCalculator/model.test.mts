import assert from "node:assert/strict";
import { test } from "node:test";

import { calculateImpact, formatMoney } from "./model.ts";

test("mockup defaults: 40 reps, $25K, 12 weeks", () => {
  const result = calculateImpact({ teamSize: 40, dealSize: 25_000, cycleWeeks: 12 });
  assert.equal(result.reductionPercent, 26);
  assert.equal(result.newCycleWeeks.toFixed(1), "8.9");
  assert.equal(Math.round(result.extraDeals), 61);
  assert.equal(formatMoney(result.pipelineRecovered), "$1.5M");
  assert.equal(result.paybackMonths, 1);
});

test("reduction is capped at 34%", () => {
  assert.equal(
    calculateImpact({ teamSize: 200, dealSize: 5_000, cycleWeeks: 4 }).reductionPercent,
    34,
  );
});

test("payback never drops below one month", () => {
  assert.equal(
    calculateImpact({ teamSize: 200, dealSize: 250_000, cycleWeeks: 24 }).paybackMonths,
    1,
  );
});

test("formatMoney thresholds", () => {
  assert.equal(formatMoney(900), "$900");
  assert.equal(formatMoney(25_000), "$25K");
  assert.equal(formatMoney(1_520_000), "$1.5M");
});
