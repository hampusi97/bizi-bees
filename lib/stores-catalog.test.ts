import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_STORES,
  getStoreById,
  calculateBundleSavings,
  calculateCartSummary,
} from "./stores-catalog";

test("all 15 fleet stores are provisioned with 4 curated products each", () => {
  assert.equal(INITIAL_STORES.length, 15);
  for (const store of INITIAL_STORES) {
    assert.ok(store.id.length > 0, `Store missing id`);
    assert.ok(store.name.length > 0, `Store ${store.id} missing name`);
    assert.equal(store.products.length, 4, `Store ${store.id} should have 4 products`);
    assert.ok(store.bundlePrice > store.soloPrice, `Store ${store.id} bundlePrice > soloPrice`);
    assert.ok(store.freeGift.length > 0, `Store ${store.id} has freeGift`);
  }
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
