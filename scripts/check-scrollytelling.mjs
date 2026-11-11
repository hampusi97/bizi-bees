/**
 * Validates the exploded-view showcase content for every store.
 *
 * Fails when a showcase points at a product that does not exist, when a store
 * has no showcase, when the bundle price is not actually cheaper than the
 * compare-at, or when the copy is missing. Content bugs here are silent in the
 * browser (the section just does not render), so they are checked in CI.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const catalog = (await import(resolve('lib/stores-catalog.ts'))).INITIAL_STORES;
const { EXPLODED_SHOWCASES } = await import(resolve('lib/exploded-showcase.ts'));

const problems = [];
const byId = new Map(catalog.map((s) => [s.id, s]));
const showcaseByStore = new Map(EXPLODED_SHOWCASES.map((s) => [s.storeId, s]));

for (const store of catalog) {
  const showcase = showcaseByStore.get(store.id);
  if (!showcase) {
    problems.push(`${store.id}: no exploded showcase`);
    continue;
  }
  const ids = new Set(store.products.map((p) => p.id));
  if (!ids.has(showcase.productId)) {
    problems.push(`${store.id}: showcase product "${showcase.productId}" is not in the catalog`);
  }
  for (const include of showcase.bundle.includes) {
    if (!ids.has(include)) {
      problems.push(`${store.id}: bundle includes unknown product "${include}"`);
    }
  }
  if (showcase.bundle.price >= showcase.bundle.compareAtPrice) {
    problems.push(
      `${store.id}: bundle price $${showcase.bundle.price} is not below compare-at $${showcase.bundle.compareAtPrice}`
    );
  }
  if (showcase.layers.length < 3) {
    problems.push(`${store.id}: needs at least 3 exploded layers, has ${showcase.layers.length}`);
  }
  if (showcase.layers.length > 5) {
    problems.push(`${store.id}: ${showcase.layers.length} layers is too many to read on a phone`);
  }
  if (showcase.companions.length !== 2) {
    problems.push(`${store.id}: needs exactly 2 companion items`);
  }
  for (const field of ['backdropHeadline', 'productName', 'productSpec']) {
    if (!showcase[field]?.trim()) problems.push(`${store.id}: ${field} is empty`);
  }
  showcase.layers.forEach((layer, i) => {
    if (!layer.title?.trim()) problems.push(`${store.id}: layer ${i + 1} has no title`);
    if (!layer.spec?.trim()) problems.push(`${store.id}: layer ${i + 1} has no spec`);
    if (layer.spec.length > 90) {
      problems.push(`${store.id}: layer ${i + 1} spec is ${layer.spec.length} chars (max 90)`);
    }
    if (!layer.title.startsWith(`${String(i + 1).padStart(2, '0')} / `)) {
      problems.push(`${store.id}: layer ${i + 1} title should start with "${String(i + 1).padStart(2, '0')} / "`);
    }
  });
  // Offsets must be monotonically increasing so the stack separates in order.
  const offsets = showcase.layers.map((l) => l.offsetY);
  for (let i = 1; i < offsets.length; i += 1) {
    if (offsets[i] <= offsets[i - 1]) {
      problems.push(`${store.id}: layer offsets are not increasing (${offsets.join(', ')})`);
    }
  }
}

for (const showcase of EXPLODED_SHOWCASES) {
  if (!byId.has(showcase.storeId)) {
    problems.push(`${showcase.storeId}: showcase exists for a store that is not in the catalog`);
  }
}

if (problems.length > 0) {
  console.error('Scrollytelling check failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

const layerCount = EXPLODED_SHOWCASES.reduce((n, s) => n + s.layers.length, 0);
console.log(
  `Scrollytelling OK: ${EXPLODED_SHOWCASES.length} stores, ${layerCount} layers, ${EXPLODED_SHOWCASES.length} bundles.`
);
