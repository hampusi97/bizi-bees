import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_STORES, getStoreById } from '../lib/stores-catalog.ts';

test('every store in the fleet resolves by its own id', () => {
  for (const store of INITIAL_STORES) {
    assert.equal(getStoreById(store.id)?.id, store.id, `${store.id} does not resolve`);
  }
});

test('every store has at least one product', () => {
  for (const store of INITIAL_STORES) {
    assert.ok(store.products.length > 0, `${store.id} has no products`);
  }
});

test('every store has a unique id', () => {
  const ids = INITIAL_STORES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate store id in the catalog');
});

test('no store reuses another store\'s product ids', () => {
  const seen = new Map<string, string>();
  for (const store of INITIAL_STORES) {
    for (const product of store.products) {
      const owner = seen.get(product.id);
      assert.equal(owner, undefined, `product ${product.id} appears in both ${owner} and ${store.id}`);
      seen.set(product.id, store.id);
    }
  }
});

test('an unknown store id resolves to nothing', () => {
  // Regression: the storefront page used to fabricate a store from the first
  // catalog entry, so /stores/anything rendered Bizi Bees products.
  assert.equal(getStoreById('not-a-store'), undefined);
  assert.equal(getStoreById(''), undefined);
  assert.equal(getStoreById('bizi-bees '), getStoreById('bizi-bees'), 'surrounding whitespace should be tolerated');
});
