// scripts/generate-google-shopping-feeds.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const stores = JSON.parse(fs.readFileSync(path.join(root, 'config/stores-15.config.json'), 'utf8'));
fs.mkdirSync(path.join(root, 'public/feeds'), { recursive: true });
const esc = (s) => String(s ?? '').replace(/&(?!amp;|lt;|gt;|quot;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const st of stores) {
  const catalogPath = path.join(root, 'catalogs', `${st.id}.json`);
  const catalog = fs.existsSync(catalogPath) ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')).products : [];
  // physical products + 2 digital vault items per store
  const digital = [
    { sku: `DIGITAL-${st.id.toUpperCase().slice(6,10) || 'VAULT'}-MASTERCLASS`, title: `${st.name} Instant Digital Masterclass & Ritual Vault`, priceUsd: 12, handle: 'digital-masterclass-vault' },
    { sku: `DIGITAL-${st.id.toUpperCase().slice(6,10) || 'VAULT'}-TEMPLATES`, title: `${st.name} Printable Templates & Protocol Pack`, priceUsd: 19, handle: 'digital-templates-pack' },
  ];
  const all = [...catalog.map((p, i) => ({ sku: p.sku || `${st.skuPrefix}${100+i}`, title: p.title, priceUsd: p.priceUsd ?? p.retailPriceUsd ?? 49, handle: p.handle || `edition-${i+1}` })), ...digital];
  const itemsXml = all.map((p) => `
    <item>
      <g:id>${esc(p.sku)}</g:id>
      <g:title><![CDATA[${p.title} - ${st.name}]]></g:title>
      <g:description><![CDATA[${st.niche}. Includes 60-Day Risk-Free Trial & ${st.vipClub} VIP Rewards.]]></g:description>
      <g:link>https://${st.custom || st.domain}/products/${esc(p.handle)}</g:link>
      <g:image_link>https://${st.custom || st.domain}/images/${esc(p.handle)}.jpg</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${Number(p.priceUsd).toFixed(2)} USD</g:price>
      <g:brand><![CDATA[${st.name}]]></g:brand>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${esc(st.name)} — Official Google Shopping Feed</title>
    <link>https://${st.custom || st.domain}</link>
    <description>${esc(st.niche)}</description>
    ${itemsXml}
  </channel>
</rss>`;
  fs.writeFileSync(path.join(root, 'public/feeds', `google-shopping-${st.id}.xml`), xml, 'utf8');
}
console.log(`✅ [05-TRAFFICTOOLBOT]: Generated ${stores.length} Google Shopping XML Feeds in public/feeds/`);
