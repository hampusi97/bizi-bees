import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_STORES,
  getStoreById,
  calculateBundleSavings,
  calculateCartSummary,
  auditEntireFleet,
} from "./stores-catalog";

test("all 15 fleet stores are provisioned with 6 categorized products each (90 total products)", () => {
  assert.equal(INITIAL_STORES.length, 15);
  let totalProducts = 0;
  for (const store of INITIAL_STORES) {
    assert.ok(store.id.length > 0, `Store missing id`);
    assert.ok(store.name.length > 0, `Store ${store.id} missing name`);
    assert.equal(store.products.length, 6, `Store ${store.id} should have 6 categorized products`);
    assert.ok(store.bundlePrice > store.soloPrice, `Store ${store.id} bundlePrice > soloPrice`);
    assert.ok((store.masterPrice ?? 0) > store.bundlePrice, `Store ${store.id} masterPrice > bundlePrice`);
    assert.ok(store.freeGift.length > 0, `Store ${store.id} has freeGift`);
    assert.ok(store.seoMeta && store.seoMeta.schemaOrgProduct, `Store ${store.id} has Schema.org JSON-LD metadata`);
    totalProducts += store.products.length;
  }
  assert.equal(totalProducts, 90);
});

test("fleet telemetry reflects accurate pre-target progress toward $25,000/day and 390 orders/day", () => {
  const totalRevenue = INITIAL_STORES.reduce((acc, s) => acc + s.revenue24h, 0);
  const totalOrders = INITIAL_STORES.reduce((acc, s) => acc + s.orders24h, 0);
  assert.ok(totalRevenue > 15000 && totalRevenue < 25000, `Expected pre-target revenue < 25000, got ${totalRevenue}`);
  assert.ok(totalOrders > 250 && totalOrders < 390, `Expected pre-target orders < 390, got ${totalOrders}`);
});

test("auditEntireFleet certifies 100% score across all 15 storefronts", () => {
  const audit = auditEntireFleet();
  assert.equal(audit.allVerified, true);
  assert.equal(audit.totalStores, 15);
  assert.equal(audit.totalProducts, 90);
  assert.equal(audit.averageScore, 100);
});

test("getStoreById resolves canonical and legacy hyphenated store IDs", () => {
  assert.equal(getStoreById("bizi-bees")?.name, "Bizi Bees Boutique");
  assert.equal(getStoreById("ember-oak")?.name, "Ember & Oak™ Reserve");
  assert.equal(getStoreById("paw-glow")?.id, "pawglow");
  assert.equal(getStoreById("lumi-carve")?.id, "lumicarve");
  assert.equal(getStoreById("calm-core")?.id, "calmcore");
  assert.equal(getStoreById("flora-spring")?.id, "floraspring");
});

test("calculateBundleSavings computes total value and percentage savings", () => {
  const result = calculateBundleSavings(14.99, 38.0, 12);
  assert.equal(result.totalValue, 41.98);
  assert.equal(result.savingsAmount, 3.98);
  assert.ok(result.savingsPercent > 0);
});

test("calculateCartSummary unlocks VIP gift and free shipping on VIP bundle", () => {
  const store = getStoreById("bizi-bees")!;
  const soloSummary = calculateCartSummary(
    [
      {
        productId: "bb-1",
        storeId: "bizi-bees",
        title: store.hero,
        variantLabel: "Solo Edition",
        unitPrice: 14.99,
        quantity: 1,
        isVipBundle: false,
      },
    ],
    store
  );
  assert.equal(soloSummary.subtotal, 14.99);
  assert.equal(soloSummary.freeShippingUnlocked, false);
  assert.equal(soloSummary.vipGiftUnlocked, false);
  assert.equal(soloSummary.shippingCost, 5.99);

  const vipSummary = calculateCartSummary(
    [
      {
        productId: "bb-2",
        storeId: "bizi-bees",
        title: store.hero,
        variantLabel: "VIP Bundle",
        unitPrice: 38.0,
        quantity: 1,
        isVipBundle: true,
      },
    ],
    store
  );
  assert.equal(vipSummary.subtotal, 38.0);
  assert.equal(vipSummary.freeShippingUnlocked, true);
  assert.equal(vipSummary.vipGiftUnlocked, true);
  assert.equal(vipSummary.unlockedGiftTitle, store.freeGift);
  assert.equal(vipSummary.shippingCost, 0);
  assert.equal(vipSummary.total, 38.0);
});
