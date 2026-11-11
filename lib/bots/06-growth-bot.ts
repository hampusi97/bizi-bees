/**
 * 06-GrowthBot — Google Shopping JSON-LD, 60 SEO Guides, 75 Ad Scripts & 90 Email Flows
 * Dropper OS — Phase 6 of 7
 *
 * Generates the complete traffic & retention vault across all 15 stores:
 *  - snippets/json-ld-schema.liquid (Product, AggregateRating, FAQPage) — injected into themes
 *  - content/seo/{store-id}/ — 4 buyer's guides per store = 60 total
 *  - marketing/ads/{store-id}.json — 5 viral video ad scripts per store = 75 total
 *  - marketing/emails/{store-id}.json — 6 lifecycle flows per store = 90 total
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUILD = join(ROOT, ".build-themes");

interface Store {
  id: string;
  name: string;
  domain: string;
  niche: string;
  palette: { accent: string };
  explodedHero: string;
}

class GrowthBot {
  private stores: Store[] = [];

  constructor() {
    this.loadStores();
  }

  private loadStores(): void {
    const raw = readFileSync(join(ROOT, "config", "stores-15.config.json"), "utf8");
    const cfg = JSON.parse(raw);
    this.stores = cfg.stores as Store[];
  }

  run(): void {
    mkdirSync(join(ROOT, "marketing", "ads"), { recursive: true });
    mkdirSync(join(ROOT, "marketing", "emails"), { recursive: true });
    let seo = 0, ads = 0, emails = 0;
    for (const store of this.stores) {
      // JSON-LD schema snippet per store
      this.writeJsonLd(store);

      // 4 SEO buyer's guides per store
      const seoDir = join(ROOT, "content", "seo", store.id);
      mkdirSync(seoDir, { recursive: true });
      for (let i = 1; i <= 4; i++) {
        this.writeSeoGuide(store, seoDir, i);
        seo++;
      }

      // 5 ad scripts per store
      this.writeAds(store);
      ads += 5;

      // 6 email flows per store
      this.writeEmails(store);
      emails += 6;

      process.stdout.write(`[GrowthBot] ${store.id}: 4 SEO + 5 ads + 6 emails\n`);
    }

    process.stdout.write(`[GrowthBot] TOTAL: ${seo} SEO guides, ${ads} ad scripts, ${emails} email flows across ${this.stores.length} stores\n`);
  }

  private writeJsonLd(store: Store): void {
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": store.explodedHero,
      "brand": store.name,
      "url": `https://${store.domain}/`,
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "124" },
      "offers": { "@type": "Offer", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
      "faqPage": {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is the shipping time?", "acceptedAnswer": { "@type": "Answer", "text": "Orders ship within 1-2 business days; US delivery in 4-8 days." } },
          { "@type": "Question", "name": "Is there a guarantee?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, 60-day risk-free guarantee on every order." } },
        ],
      },
    };
    writeFileSync(join(BUILD, store.id, "snippets", "json-ld-schema.liquid"), `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  }

  private writeSeoGuide(store: Store, dir: string, index: number): void {
    const titles = [
      `The Ultimate Buyer's Guide to ${store.niche}`,
      `How to Choose the Best ${store.niche.split(" & ")[0]} in 2027`,
      `${store.niche}: FAQ, Benefits & What to Know Before You Buy`,
      `Top ${store.niche} Mistakes (and How to Avoid Them)`,
    ];
    const content = `# ${titles[index - 1]}\n\n` +
      `Looking for the best ${store.niche}? This guide covers everything you need to know before buying.\n\n` +
      `## Why ${store.name}\n\n` +
      `At ${store.name}, we focus on quality you can feel. Our ${store.niche.toLowerCase()} are selected for performance, durability, and real-world value.\n\n` +
      `## Key Benefits\n\n- Solves an immediate pain point\n- Built to last\n- Backed by a 60-day risk-free guarantee\n\n` +
      `## Frequently Asked Questions\n\n` +
      `### How long does shipping take?\nOrders are processed within 1-2 business days and typically arrive within 4-8 days.\n\n` +
      `### Is there a warranty or guarantee?\nYes. Every purchase is covered by our 60-day risk-free guarantee.\n\n` +
      `## Conclusion\n\nReady to experience ${store.niche} the right way? Shop the collection at https://${store.domain}/.\n`;
    writeFileSync(join(dir, `guide-${index}.md`), content);
  }

  private writeAds(store: Store): void {
    const scripts = Array.from({ length: 5 }, (_, i) => ({
      id: `${store.id}-ad-${i + 1}`,
      title: `Viral Ad Script ${i + 1}`,
      hook: `3-second hook: ${this.hookFor(store, i)}`,
      demo: "3D exploded mechanism demo showing how the product works internally",
      problemSolution: `Problem: ${this.problemFor(store.niche)} | Solution: ${store.explodedHero}`,
      cta: `Shop now at https://${store.domain}/ — limited stock`,
      durationSeconds: 30,
      platform: ["tiktok", "instagram-reels", "youtube-shorts"],
    }));
    writeFileSync(join(ROOT, "marketing", "ads", `${store.id}.json`), JSON.stringify({ storeId: store.id, storeName: store.name, scriptCount: scripts.length, scripts }, null, 2));
  }

  private hookFor(store: Store, i: number): string {
    const hooks = [
      "Stop scrolling — this solves it in 30 seconds",
      "You've been doing it wrong. Here's the fix.",
      "The one thing your routine is missing.",
      "See inside the product before you buy.",
      "Why everyone is switching.",
    ];
    return hooks[i];
  }

  private problemFor(niche: string): string {
    return `Everyday friction with ${niche.toLowerCase()}`;
  }

  private writeEmails(store: Store): void {
    const flows = [
      { id: "welcome", name: "Welcome $15 Off + 250 VIP Pts", trigger: "signup", delayMinutes: 0 },
      { id: "cart-abandon-1", name: "Abandoned Cart Reminder #1", trigger: "cart_abandon", delayMinutes: 60 },
      { id: "cart-abandon-2", name: "Abandoned Cart Reminder #2", trigger: "cart_abandon", delayMinutes: 1440 },
      { id: "browse-abandon", name: "Browse Abandonment", trigger: "browse_abandon", delayMinutes: 180 },
      { id: "post-purchase", name: "Post-Purchase Ritual", trigger: "order_paid", delayMinutes: 600 },
      { id: "winback-60", name: "60-Day Winback", trigger: "no_order_60d", delayMinutes: 0 },
    ];
    writeFileSync(join(ROOT, "marketing", "emails", `${store.id}.json`), JSON.stringify({ storeId: store.id, storeName: store.name, flowCount: flows.length, flows }, null, 2));
  }
}

const bot = new GrowthBot();
bot.run();

export { GrowthBot };
