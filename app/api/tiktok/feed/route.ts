import { NextResponse } from "next/server";
import { INITIAL_STORES } from "@/lib/stores-catalog";
import storeMatrix from "@/config/store_matrix.json";

export const dynamic = "force-dynamic";

// TikTok Shop Category Mapping by Niche / Store ID
const TIKTOK_CATEGORIES: Record<string, { id: string; name: string; tag: string }> = {
  "luma-clinical": { id: "600102", name: "Beauty & Personal Care > Skin Care Tools > Facial Cleansing & Toning", tag: "#skintok" },
  "luma-relief": { id: "601200", name: "Health & Personal Care > Pain Relief & Therapy > Hot & Cold Compresses", tag: "#migrainerelief" },
  "bizi-bees": { id: "700300", name: "Books, Movies & Music > Books > Curated Fiction & Gift Editions", tag: "#booktok" },
  "ember-oak": { id: "100800", name: "Home & Kitchen > Bar & Smoking Accessories > Humidors & Cutters", tag: "#cigartok" },
  "fizz-lab": { id: "800200", name: "Food & Beverages > Beverage Flavoring & Drink Mixes > Syrups & Frothers", tag: "#dirtysoda" },
  "crave-lab": { id: "800250", name: "Food & Beverages > Confectionery & Chocolate > Artisanal Chocolate Boxes", tag: "#chocolatetok" },
  "aura-sculpt": { id: "900100", name: "Apparel & Accessories > Women's Activewear > Leggings & Sets", tag: "#pilatestok" },
  "pawglow": { id: "500400", name: "Pet Supplies > Dogs > Grooming Tools > Brushes & Deshedders", tag: "#dogsoftiktok" },
  "zenith-sleep": { id: "601400", name: "Health & Wellness > Sleep & Sound Therapy > Bluetooth Sleep Masks", tag: "#sleephacks" },
  "aura-posture": { id: "400100", name: "Health & Wellness > Ergonomics & Posture Correctors > Smart Sensors", tag: "#posturecheck" },
  "lumicarve": { id: "300200", name: "Tools & Home Improvement > Power Rotary Tools > Cordless Engravers", tag: "#satisfyingcrafts" },
  "dermasonic": { id: "600105", name: "Beauty & Personal Care > Skin Care Tools > Pore Extractors & Scrubbers", tag: "#poredetox" },
  "calmcore": { id: "601250", name: "Health & Wellness > Aromatherapy & Thermal Relief > Weighted Wraps", tag: "#selfcare" },
  "floraspring": { id: "200500", name: "Patio, Lawn & Garden > Watering Equipment > Self-Watering Spikes", tag: "#planttok" },
  "velobrew": { id: "800400", name: "Kitchen & Dining > Coffee, Tea & Espresso > Portable Espresso Makers", tag: "#coffeetiktok" },
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "xml";
  const storeIdFilter = searchParams.get("storeId");

  const matrixMap = new Map<string, any>();
  for (const m of storeMatrix) {
    matrixMap.set(m.store_id, m);
  }

  // Aggregate all products across stores
  const allProducts: any[] = [];

  for (const store of INITIAL_STORES) {
    if (storeIdFilter && store.id !== storeIdFilter) continue;

    const m = matrixMap.get(store.id) || {};
    const cat = TIKTOK_CATEGORIES[store.id] || {
      id: "100000",
      name: "General Merchandise > Curated Lifestyle",
      tag: "#tiktokfinds",
    };

    const hostDomain = store.domain || "bizibees-store.myshopify.com";

    for (const prod of store.products) {
      const price = prod.price || 29.99;
      const comparePrice = prod.compareAtPrice || price * 1.5;
      const commissionAmount = Number((price * 0.25).toFixed(2));
      const sku = prod.sku || `${store.id.toUpperCase()}-${prod.id.toUpperCase()}`;

      allProducts.push({
        id: `${store.id}_${prod.id}`,
        sku: sku,
        storeId: store.id,
        storeName: store.name,
        title: `${store.name} · ${prod.title}`,
        description: `${prod.description}. Curated exclusively for ${store.name}. Includes 24h Utah priority dispatch with our 60-Day Trial Guarantee.`,
        link: `https://${hostDomain}/products/${prod.id}?utm_source=tiktok_shop&utm_medium=catalog_sync&utm_campaign=${store.id}`,
        imageLink: `https://${hostDomain}/cdn/shop/files/${store.id}-${prod.id}.jpg`,
        price: `${price.toFixed(2)} USD`,
        salePrice: `${price.toFixed(2)} USD`,
        comparePrice: `${comparePrice.toFixed(2)} USD`,
        availability: (prod.inStockCount ?? 100) > 0 ? "in stock" : "out of stock",
        brand: store.name,
        condition: "new",
        googleProductCategory: cat.name,
        tiktokCategoryId: cat.id,
        tiktokTag: cat.tag,
        commissionRate: "25%",
        commissionAmount: `${commissionAmount.toFixed(2)} USD`,
        shippingWeight: "1.2 lbs",
        customLabel0: store.id,
        customLabel1: cat.tag,
        customLabel2: m.free_gift || "Complimentary VIP Gift",
        customLabel3: "24h Utah Dispatch",
      });
    }
  }

  // 1. JSON Format
  if (format === "json") {
    return NextResponse.json({
      success: true,
      feed_type: "tiktok_shop_catalog_json",
      version: "2.0",
      synced_at: new Date().toISOString(),
      total_products: allProducts.length,
      default_creator_commission: "25%",
      products: allProducts,
    });
  }

  // 2. RSS 2.0 / XML Format for TikTok Shop Seller Center & Google Merchant Feed
  const xmlItems = allProducts
    .map(
      (p) => `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.title)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:link>${escapeXml(p.link)}</g:link>
      <g:image_link>${escapeXml(p.imageLink)}</g:image_link>
      <g:availability>${p.availability}</g:availability>
      <g:price>${p.comparePrice}</g:price>
      <g:sale_price>${p.salePrice}</g:sale_price>
      <g:brand>${escapeXml(p.brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(p.googleProductCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(p.googleProductCategory)}</g:product_type>
      <g:mpn>${escapeXml(p.sku)}</g:mpn>
      <g:shipping_weight>${p.shippingWeight}</g:shipping_weight>
      <g:custom_label_0>${escapeXml(p.customLabel0)}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(p.customLabel1)}</g:custom_label_1>
      <g:custom_label_2>${escapeXml(p.customLabel2)}</g:custom_label_2>
      <g:custom_label_3>${escapeXml(p.customLabel3)}</g:custom_label_3>
      <g:custom_label_4>Commission 25%: ${escapeXml(p.commissionAmount)}</g:custom_label_4>
    </item>`
    )
    .join("\n");

  const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Repo-OS Fleet Master Catalog · TikTok Shop Scheduled Feed</title>
    <link>https://bizibees-store.myshopify.com</link>
    <description>Automated 15-Store TikTok Shop Catalog Synchronizer with Real-Time Stock &amp; 25% Creator Commission</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xmlFeed, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
