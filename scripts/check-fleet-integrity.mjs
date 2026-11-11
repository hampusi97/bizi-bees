/**
 * Fleet integrity check.
 *
 * Fails when the 15 stores we claim are not actually wired up: a store in the
 * matrix with no catalog entry, a catalog entry with no matrix row, a store
 * with no products, a storefront section missing, or a domain that points at a
 * storefront that is not ours.
 *
 * This does not prove a store is live — see scripts/check-live-storefronts.mjs
 * for the network check.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const matrix = JSON.parse(readFileSync(resolve('config/store_matrix.json'), 'utf8'));
const catalogSource = readFileSync(resolve('lib/stores-catalog.ts'), 'utf8');
const catalog = (await import(resolve('lib/stores-catalog.ts'))).INITIAL_STORES;

assert.ok(Array.isArray(matrix) && matrix.length > 0, 'config/store_matrix.json must be a non-empty array.');

const problems = [];
const catalogById = new Map(catalog.map((store) => [store.id, store]));

for (const row of matrix) {
  const store = catalogById.get(row.store_id);
  if (!store) {
    problems.push(`${row.store_id}: in store_matrix.json but missing from lib/stores-catalog.ts`);
    continue;
  }
  if (!store.products?.length) {
    problems.push(`${row.store_id}: has no products in the catalog`);
  }
  if (store.domain !== row.domain) {
    problems.push(
      `${row.store_id}: catalog domain "${store.domain}" does not match matrix domain "${row.domain}"`
    );
  }
  const section = resolve('sections', `storefront-${row.store_id}.liquid`);
  if (!existsSync(section)) {
    problems.push(`${row.store_id}: missing sections/storefront-${row.store_id}.liquid`);
  }
}

for (const store of catalog) {
  if (!matrix.some((row) => row.store_id === store.id)) {
    problems.push(`${store.id}: in lib/stores-catalog.ts but missing from config/store_matrix.json`);
  }
}

// The only Shopify host that is ours today. Any other .myshopify.com domain in
// the fleet data is either unclaimed or owned by someone else.
const OUR_SHOPIFY_HOSTS = new Set(['bizibees-store.myshopify.com']);
for (const row of matrix) {
  if (!/\.myshopify\.com$/.test(row.domain)) continue;
  if (!OUR_SHOPIFY_HOSTS.has(row.domain)) {
    problems.push(
      `${row.store_id}: domain "${row.domain}" is not a shop we control — do not publish links to it`
    );
  }
}

// The sitemap must only advertise hosts we control.
const sitemap = readFileSync(resolve('sitemap.xml'), 'utf8');
const hosts = new Set([...sitemap.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map((m) => m[1]));
for (const host of hosts) {
  if (host.endsWith('.myshopify.com') && !OUR_SHOPIFY_HOSTS.has(host)) {
    problems.push(`sitemap.xml advertises ${host}, which is not a shop we control`);
  }
}
assert.ok(catalogSource.includes('INITIAL_STORES'), 'stores-catalog.ts should export INITIAL_STORES.');

if (problems.length > 0) {
  console.error('Fleet integrity check failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

console.log(
  `Fleet integrity OK: ${catalog.length} stores, ${catalog.reduce((n, s) => n + s.products.length, 0)} products, all sections present.`
);
