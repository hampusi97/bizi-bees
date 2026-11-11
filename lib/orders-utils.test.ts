import test from "node:test";
import assert from "node:assert/strict";
import {
  validateStoreOrderPayload,
  filterAndSortOrders,
  computeOrdersSummary,
  getNextOrderStatus,
  INITIAL_PREVIEW_ORDERS,
} from "./orders-utils";
import {
  selectWinningVariant,
  MultiArmedBanditEngine,
} from "./algorithms/multi-armed-bandit";
import {
  calculateDailyBurnVelocity,
  calculateDaysRemaining,
  getFleetInventoryForecast,
} from "./algorithms/inventory-forecaster";

test("validateStoreOrderPayload enforces firebase-blueprint.json StoreOrderRecord schema", () => {
  const valid = validateStoreOrderPayload({
    ownerId: "user_12345",
    orderNumber: "UT-849201",
    storeSlug: "bizi-bees",
    tierLabel: "VIP Bundle (+ Free Gift)",
    totalAmount: 58.0,
    status: "processing",
  });
  assert.equal(valid.valid, true);

  const badOrderNum = validateStoreOrderPayload({
    ownerId: "user_12345",
    orderNumber: "UT $bad!",
    storeSlug: "bizi-bees",
    tierLabel: "VIP Bundle",
    totalAmount: 58.0,
    status: "processing",
  });
  assert.equal(badOrderNum.valid, false);

  const badStatus = validateStoreOrderPayload({
    ownerId: "user_12345",
    orderNumber: "UT-849201",
    storeSlug: "bizi-bees",
    tierLabel: "VIP Bundle",
    totalAmount: 58.0,
    status: "cancelled",
  });
  assert.equal(badStatus.valid, false);
});

test("filterAndSortOrders filters by status, storeSlug, search query, and sorts accurately", () => {
  const dispatchedOnly = filterAndSortOrders(INITIAL_PREVIEW_ORDERS, {
    statusFilter: "dispatched",
    storeFilter: "all",
    searchQuery: "",
    sortBy: "date-desc",
  });
  assert.equal(dispatchedOnly.length, 2);
  assert.equal(dispatchedOnly.every((o) => o.status === "dispatched"), true);

  const lumaSearch = filterAndSortOrders(INITIAL_PREVIEW_ORDERS, {
    statusFilter: "all",
    storeFilter: "all",
    searchQuery: "Luma Clinical",
    sortBy: "date-desc",
  });
  assert.equal(lumaSearch.length, 1);
  assert.equal(lumaSearch[0].storeSlug, "luma-clinical");

  const sortedByHighest = filterAndSortOrders(INITIAL_PREVIEW_ORDERS, {
    statusFilter: "all",
    storeFilter: "all",
    searchQuery: "",
    sortBy: "amount-desc",
  });
  assert.equal(sortedByHighest[0].orderNumber, "UT-848914");
  assert.equal(sortedByHighest[0].totalAmount, 145.2);
});

test("computeOrdersSummary and getNextOrderStatus calculate KPIs and enforce terminal state locking", () => {
  const summary = computeOrdersSummary(INITIAL_PREVIEW_ORDERS);
  assert.equal(summary.totalOrders, 5);
  assert.equal(summary.totalSpend, 442.95);
  assert.equal(summary.processingCount, 1);
  assert.equal(summary.dispatchedCount, 2);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.vipBundlesCount, 5);
  assert.equal(summary.unlockedGiftValueTotal > 0, true);

  assert.equal(getNextOrderStatus("processing"), "dispatched");
  assert.equal(getNextOrderStatus("dispatched"), "completed");
  assert.equal(getNextOrderStatus("completed"), null);
});

test("Dropper OS V2 Epsilon-Greedy Multi-Armed Bandit selects highest CR winner when epsilon=0", () => {
  const winnerId = selectWinningVariant({
    id: "free-shipping-threshold",
    epsilon: 0, // 100% exploit
    variants: [
      { id: "tier-35", impressions: 420, conversions: 15 },
      { id: "tier-50", impressions: 890, conversions: 43 },
      { id: "tier-65", impressions: 210, conversions: 6 },
    ],
  });
  assert.equal(winnerId, "tier-50");

  const engine = new MultiArmedBanditEngine();
  assert.equal(engine.recordConversion("free-shipping-threshold", "tier-50"), true);
});

test("Dropper OS V2 Inventory Forecaster computes Daily Burn Velocity (v) and DIR < 7d critical alerts", () => {
  const v = calculateDailyBurnVelocity(42);
  assert.equal(v, 3);
  const dir = calculateDaysRemaining(14, v);
  assert.equal(dir, 4.7);

  const forecasts = getFleetInventoryForecast();
  assert.equal(forecasts.length >= 4, true);
  assert.equal(forecasts.some((f) => f.status === "CRITICAL" && f.daysRemaining < 7), true);
});
