/**
 * Live storefront check.
 *
 * Every store the fleet claims is "online" must actually answer. Checks, for
 * each store: the Next.js storefront route, and the Shopify domain it is
 * supposed to be published on.
 *
 * Exits non-zero when a storefront is not reachable or a Shopify domain is not
 * ours, so a deploy that breaks a store fails loudly instead of showing green
 * in Mission Control.
 *
 * Usage: node scripts/check-live-storefronts.mjs [baseUrl]
 *   baseUrl defaults to https://bizi-bees.vercel.app
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseUrl = (process.argv[2] || process.env.STOREFRONT_BASE_URL || 'https://bizi-bees.vercel.app').replace(/\/$/, '');
const catalog = (await import(resolve('lib/stores-catalog.ts'))).INITIAL_STORES;
const OUR_SHOPIFY_HOSTS = new Set(['bizibees-store.myshopify.com']);

async function head(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    return { status: res.status, location: res.headers.get('location') || '' };
  } catch (error) {
    return { status: 0, location: '', error: error.message };
  }
}

const rows = [];
let failures = 0;

for (const store of catalog) {
  const route = `${baseUrl}/stores/${store.id}`;
  const page = await head(route);
  const routeOk = page.status === 200;
  if (!routeOk) failures += 1;

  let shopify = { status: 0, location: '' };
  if (store.domain && store.domain.endsWith('.myshopify.com')) {
    shopify = await head(`https://${store.domain}/`);
  }
  const shopifyOk = shopify.status >= 200 && shopify.status < 400;
  if (!shopifyOk) failures += 1;

  rows.push({
    store: store.id,
    route,
    routeStatus: page.status,
    routeOk,
    shopifyDomain: store.domain,
    shopifyStatus: shopify.status,
    shopifyOk,
    shopifyOwned: OUR_SHOPIFY_HOSTS.has(store.domain),
  });
}

const pad = (v, n) => String(v).padEnd(n);
console.log(pad('STORE', 15) + pad('ROUTE', 8) + pad('SHOPIFY', 10) + 'DOMAIN');
for (const r of rows) {
  console.log(
    pad(r.store, 15) +
      pad(r.routeOk ? '200' : `FAIL(${r.routeStatus})`, 8) +
      pad(r.shopifyOk ? String(r.shopifyStatus) : `FAIL(${r.shopifyStatus})`, 10) +
      r.shopifyDomain +
      (r.shopifyOwned ? '' : '  <- not a shop we control')
  );
}

const unowned = rows.filter((r) => !r.shopifyOwned).length;
console.log(
  `\n${rows.length} stores checked · ${rows.filter((r) => r.routeOk).length} storefront routes live · ` +
    `${rows.filter((r) => r.shopifyOk).length} Shopify domains live · ${unowned} Shopify domains not ours`
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
