/**
 * Unit Test Suite for Dropper OS V2 Algorithmic Systems
 * File: dropper-os/tests/v2-algorithms.test.ts
 * Run with: npx tsx tests/v2-algorithms.test.ts
 */

import assert from 'assert';
import {
  Experiment,
  selectWinningVariant,
  MultiArmedBanditEngine,
} from '../lib/algorithms/multi-armed-bandit';
import {
  calculateDailyBurnVelocity,
  calculateDaysRemaining,
  calculateSuggestedReorder,
  forecastProductRunout,
  ProductInventoryState,
} from '../lib/algorithms/inventory-forecaster';
import { edgeCollector } from '../lib/telemetry/edge-collector';

console.log('\n======================================================');
console.log('  RUNNING DROPPER OS V2 ALGORITHM & TELEMETRY TESTS');
console.log('======================================================\n');

let passedTests = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✕ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// =========================================================================
// 1. MULTI-ARMED BANDIT (MAB) ALGORITHM TESTS
// =========================================================================

test('MAB: Exploit mode selects variant with highest conversion rate', () => {
  const experiment: Experiment = {
    id: 'test-exp-exploit',
    name: 'Test Exploit',
    epsilon: 0.0, // 0% exploration -> 100% exploitation
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    variants: [
      { id: 'variant-a', name: 'A', value: 35, impressions: 100, conversions: 2, weight: 0.33 }, // CR: 2%
      { id: 'variant-b', name: 'B', value: 50, impressions: 100, conversions: 8, weight: 0.33 }, // CR: 8% (Winner)
      { id: 'variant-c', name: 'C', value: 65, impressions: 100, conversions: 4, weight: 0.34 }, // CR: 4%
    ],
  };

  for (let i = 0; i < 50; i++) {
    const winner = selectWinningVariant(experiment);
    assert.strictEqual(winner, 'variant-b', 'Exploit must always select highest CR variant-b');
  }
});

test('MAB: Explore mode (epsilon=1.0) distributes randomly across all variants', () => {
  const experiment: Experiment = {
    id: 'test-exp-explore',
    name: 'Test Explore',
    epsilon: 1.0, // 100% exploration
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    variants: [
      { id: 'variant-a', name: 'A', value: 1, impressions: 100, conversions: 50, weight: 0.33 },
      { id: 'variant-b', name: 'B', value: 2, impressions: 100, conversions: 1, weight: 0.33 },
      { id: 'variant-c', name: 'C', value: 3, impressions: 100, conversions: 1, weight: 0.34 },
    ],
  };

  const counts: Record<string, number> = { 'variant-a': 0, 'variant-b': 0, 'variant-c': 0 };
  const iterations = 600;

  for (let i = 0; i < iterations; i++) {
    const selected = selectWinningVariant(experiment);
    counts[selected]++;
  }

  // Each variant should get approximately 1/3 (~200) of traffic
  assert(counts['variant-a'] > 120, 'Variant A must be explored');
  assert(counts['variant-b'] > 120, 'Variant B must be explored');
  assert(counts['variant-c'] > 120, 'Variant C must be explored');
});

test('MAB: Handles zero impressions without division by zero errors', () => {
  const experiment: Experiment = {
    id: 'test-exp-cold',
    name: 'Cold Start',
    epsilon: 0.0,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    variants: [
      { id: 'v1', name: 'V1', value: 1, impressions: 0, conversions: 0, weight: 0.5 },
      { id: 'v2', name: 'V2', value: 2, impressions: 0, conversions: 0, weight: 0.5 },
    ],
  };

  const chosen = selectWinningVariant(experiment);
  assert(chosen === 'v1' || chosen === 'v2', 'Should pick a valid variant under zero impressions');
});

test('MAB: MultiArmedBanditEngine tracks impressions and conversions', () => {
  const engine = new MultiArmedBanditEngine();
  const decision = engine.selectVariant('free-shipping-threshold', true);

  assert(decision.selectedVariantId, 'Decision must return a selectedVariantId');
  assert(typeof decision.conversionRate === 'number', 'Conversion rate must be a number');

  const beforeExp = engine.getExperiment('free-shipping-threshold');
  const variant = beforeExp?.variants.find(v => v.id === decision.selectedVariantId);
  const convBefore = variant?.conversions || 0;

  engine.recordConversion('free-shipping-threshold', decision.selectedVariantId);
  const convAfter = variant?.conversions || 0;

  assert.strictEqual(convAfter, convBefore + 1, 'Conversion count must increment by 1');
});

// =========================================================================
// 2. INVENTORY FORECASTER & BURN-RATE MODEL TESTS
// =========================================================================

test('Forecaster: Daily burn velocity formula (unitsSold14Days / 14)', () => {
  const v1 = calculateDailyBurnVelocity(42);
  assert.strictEqual(v1, 3.0, '42 units in 14 days = 3.0 units/day');

  const v2 = calculateDailyBurnVelocity(14);
  assert.strictEqual(v2, 1.0, '14 units in 14 days = 1.0 units/day');

  const v3 = calculateDailyBurnVelocity(0);
  assert.strictEqual(v3, 0.0, '0 units in 14 days = 0.0 units/day');
});

test('Forecaster: Days remaining formula (currentStock / v)', () => {
  const days1 = calculateDaysRemaining(15, 3.0);
  assert.strictEqual(days1, 5.0, '15 stock / 3.0 velocity = 5.0 days remaining');

  const days2 = calculateDaysRemaining(0, 2.0);
  assert.strictEqual(days2, 0.0, '0 stock = 0 days remaining');

  const days3 = calculateDaysRemaining(10, 0);
  assert.strictEqual(days3, 999, '0 velocity = default 999 days');
});

test('Forecaster: Suggested reorder quantity formula with 1.5x buffer', () => {
  // Q = v * leadTimeDays * 1.5
  // For v=3.0, leadTime=10: 3 * 10 * 1.5 = 45 -> rounded up to 50
  const q = calculateSuggestedReorder(3.0, 10);
  assert(q >= 45, 'Reorder quantity must cover lead time buffer');
  assert.strictEqual(q % 10, 0, 'Reorder quantity rounds to clean multiple of 10');
});

test('Forecaster: Correctly classifies CRITICAL runout when DIR < 7 days', () => {
  const criticalProduct: ProductInventoryState = {
    productId: 'test-crit',
    variantId: 'crit-var',
    title: 'Limited Edition Brass Bookmark',
    sku: 'TEST-SKU-CRIT',
    currentStock: 12,
    unitsSold14Days: 42, // v = 3.0 units/day -> DIR = 4.0 days
    unitCost: 2.0,
    retailPrice: 14.0,
    leadTimeDays: 7,
  };

  const result = forecastProductRunout(criticalProduct);
  assert.strictEqual(result.status, 'CRITICAL', 'DIR < 7 days must flag as CRITICAL');
  assert.strictEqual(result.daysRemaining, 4.0, 'Days remaining must equal 4.0');
  assert(result.runoutTrajectory.length > 0, 'Runout trajectory array must be populated');
});

test('Forecaster: Correctly classifies HEALTHY inventory when DIR > 14 days', () => {
  const healthyProduct: ProductInventoryState = {
    productId: 'test-healthy',
    variantId: 'healthy-var',
    title: 'LumaGlow Pro Wand',
    sku: 'TEST-SKU-HEALTHY',
    currentStock: 100,
    unitsSold14Days: 28, // v = 2.0 units/day -> DIR = 50.0 days
    unitCost: 10.0,
    retailPrice: 39.99,
    leadTimeDays: 14,
  };

  const result = forecastProductRunout(healthyProduct);
  assert.strictEqual(result.status, 'HEALTHY', 'DIR > 14 days must flag as HEALTHY');
  assert.strictEqual(result.daysRemaining, 50.0);
});

// =========================================================================
// 3. TELEMETRY EDGE RING BUFFER TESTS
// =========================================================================

test('EdgeCollector: Ring buffer caps at maxSize (500 events)', () => {
  edgeCollector.clear();

  for (let i = 0; i < 550; i++) {
    edgeCollector.recordEvent({
      type: 'pageview',
      sessionId: `s_${i}`,
      path: '/products/mystery-crate',
      device: 'mobile',
    });
  }

  const recent = edgeCollector.getRecentEvents(600);
  assert.strictEqual(recent.length, 500, 'Ring buffer must cap at exactly 500 events');
});

console.log(`\n======================================================`);
console.log(`  ALL ${passedTests} ALGORITHM & TELEMETRY TESTS PASSED (100%)`);
console.log('======================================================\n');
