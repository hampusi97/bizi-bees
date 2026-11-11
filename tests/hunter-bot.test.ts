import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTO_APPROVE_SCORE,
  evaluateCandidates,
  evaluateProductCandidate,
  type ProductCandidate,
} from '../lib/bots/hunter-bot.ts';

const strong: ProductCandidate = {
  title: 'LumaGlow Pro 630nm Red Light Wand',
  landedCost: 19,
  retailPrice: 89,
  weightOz: 9,
  solvesPainPoint: true,
  hasVisualDemoHook: true,
  defectReturnRate: 0.02,
  hasUpsellEcosystem: true,
  shippingDays: 6,
  targetStoreId: 'luma-clinical',
  supplierSku: 'DROP-LG630',
  supplierUrl: 'https://example.invalid/DROP-LG630',
};

test('a strong product is auto-approved', () => {
  const p = evaluateProductCandidate(strong);
  assert.equal(p.score, 100);
  assert.deepEqual(p.blockers, []);
  assert.equal(p.verdict, 'AUTO_APPROVE');
});

test('net profit subtracts the gateway fee, not just cost from price', () => {
  const p = evaluateProductCandidate(strong);
  // 89 - 19 - (89 * 0.029 + 0.30) = 67.12
  assert.equal(p.netProfitPerUnit, 67.12);
  assert.equal(p.grossMarginPercent, 78.7);
});

test('a cheap-cost product does not get an elite margin for a low absolute profit', () => {
  // $4 -> $14 is 71% margin but only $9.29 profit, under the $10 floor.
  const p = evaluateProductCandidate({
    ...strong,
    landedCost: 4,
    retailPrice: 14,
  });
  assert.equal(p.grossMarginPercent, 71.4);
  assert.ok(
    p.blockers.some((b) => b.includes('Net profit')),
    'must block on the absolute profit floor'
  );
  assert.notEqual(p.verdict, 'AUTO_APPROVE');
});

test('a photogenic product that fails every margin test cannot auto-approve', () => {
  // Regression: the v5 rubric could reach 80+ on soft points alone.
  const p = evaluateProductCandidate({
    ...strong,
    landedCost: 30,
    retailPrice: 40,
  });
  assert.ok(p.score >= 60, 'soft points alone can still score well');
  assert.notEqual(p.verdict, 'AUTO_APPROVE');
  assert.equal(p.verdict, 'REJECT');
});

test('the score is exactly 0..100 and the rubric sums to 100', () => {
  const best = evaluateProductCandidate(strong);
  const worst = evaluateProductCandidate({
    ...strong,
    landedCost: 89,
    retailPrice: 89,
    weightOz: 200,
    solvesPainPoint: false,
    hasVisualDemoHook: false,
    defectReturnRate: 0.5,
    hasUpsellEcosystem: false,
    shippingDays: 40,
  });
  assert.equal(best.score, 100);
  assert.equal(worst.score, 0);
});

test('heavy or slow products are blocked even at a good margin', () => {
  const heavy = evaluateProductCandidate({ ...strong, weightOz: 64 });
  assert.ok(heavy.blockers.some((b) => b.includes('Weight')));
  assert.notEqual(heavy.verdict, 'AUTO_APPROVE');

  const slow = evaluateProductCandidate({ ...strong, shippingDays: 21 });
  assert.ok(slow.blockers.some((b) => b.includes('Shipping')));
  assert.notEqual(slow.verdict, 'AUTO_APPROVE');
});

test('a high return rate blocks auto-approval', () => {
  const p = evaluateProductCandidate({ ...strong, defectReturnRate: 0.12 });
  assert.ok(p.blockers.some((b) => b.includes('Return rate')));
  assert.notEqual(p.verdict, 'AUTO_APPROVE');
});

test('the approve threshold is honoured at its boundary', () => {
  // Lose the upsell term (10 pts) and the visual hook (15) => 75, below 80.
  const p = evaluateProductCandidate({ ...strong, hasUpsellEcosystem: false, hasVisualDemoHook: false });
  assert.equal(p.score, 75);
  assert.equal(p.verdict, 'MANUAL_REVIEW');
  assert.ok(p.score < AUTO_APPROVE_SCORE);
});

test('a zero-cost product does not divide by zero', () => {
  const p = evaluateProductCandidate({ ...strong, landedCost: 0, retailPrice: 0 });
  assert.equal(p.grossMarginPercent, 0);
  assert.equal(p.markupMultiple, 0);
  assert.equal(p.verdict, 'REJECT');
});

test('batch evaluation preserves order and partitions by verdict', () => {
  const result = evaluateCandidates([
    strong,
    { ...strong, landedCost: 30, retailPrice: 40 },
    { ...strong, hasUpsellEcosystem: false, hasVisualDemoHook: false },
  ]);
  assert.equal(result.approved.length, 1);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.review.length, 1);
  assert.equal(result.approved[0].title, strong.title);
});
