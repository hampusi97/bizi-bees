import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_STORES } from '../lib/stores-catalog.ts';
import { EXPLODED_SHOWCASES, getExplodedShowcase } from '../lib/exploded-showcase.ts';

test('every store has a showcase', () => {
  for (const store of INITIAL_STORES) {
    assert.ok(getExplodedShowcase(store.id), `${store.id} has no showcase`);
  }
});

test('every showcase points at a real product in its own store', () => {
  for (const showcase of EXPLODED_SHOWCASES) {
    const store = INITIAL_STORES.find((s) => s.id === showcase.storeId);
    assert.ok(store, `${showcase.storeId} is not a store`);
    const ids = new Set(store.products.map((p) => p.id));
    assert.ok(ids.has(showcase.productId), `${showcase.storeId} -> ${showcase.productId} not in catalog`);
  }
});

test('a bundle is always cheaper than its compare-at, and never free', () => {
  for (const { storeId, bundle } of EXPLODED_SHOWCASES) {
    assert.ok(bundle.price > 0, `${storeId} bundle price must be positive`);
    assert.ok(bundle.price < bundle.compareAtPrice, `${storeId} bundle is not a discount`);
  }
});

test('layer offsets increase so the stack separates in order', () => {
  for (const { storeId, layers } of EXPLODED_SHOWCASES) {
    for (let i = 1; i < layers.length; i += 1) {
      assert.ok(
        layers[i].offsetY > layers[i - 1].offsetY,
        `${storeId} layer ${i + 1} does not sit below layer ${i}`
      );
    }
  }
});

test('layer copy is short enough to read on a phone', () => {
  for (const { storeId, layers } of EXPLODED_SHOWCASES) {
    for (const layer of layers) {
      assert.ok(layer.spec.length <= 90, `${storeId} "${layer.title}" spec is ${layer.spec.length} chars`);
      assert.ok(layer.title.length <= 60, `${storeId} "${layer.title}" title is too long`);
    }
  }
});

test('an unknown store has no showcase rather than a fabricated one', () => {
  assert.equal(getExplodedShowcase('not-a-store'), undefined);
  assert.equal(getExplodedShowcase(''), undefined);
});

test('showcase ids are unique', () => {
  const ids = EXPLODED_SHOWCASES.map((s) => s.storeId);
  assert.equal(new Set(ids).size, ids.length);
});
