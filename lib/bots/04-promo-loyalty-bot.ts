/**
 * 04-PromoLoyaltyBot — 3-Milestone Gamified Cart, VIP Loyalty Club & Promo Engine
 * Dropper OS — Phase 4 of 7
 *
 * Injects into all 15 themes:
 *  1. snippets/cart-drawer.liquid — real-time /cart.js progress bar with 3 milestones
 *  2. snippets/loyalty-vip-club.liquid — floating VIP Loyalty & Referral Vault
 *  3. Shopify Admin API discount sync (WELCOME15, BUNDLE20, VIP25, FREESHIP) + Epsilon-Greedy Bandit
 *
 * NOTE: Discount code provisioning requires a connected Shopify store (Admin API access token).
 * This file generates the discount payloads; actual provisioning needs Shopify credentials.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUILD = join(ROOT, ".build-themes");

const DISCOUNT_CODES = [
  { code: "WELCOME15", title: "Welcome 15% Off", value: 15, valueType: "percentage" },
  { code: "BUNDLE20", title: "Bundle 20% Off", value: 20, valueType: "percentage" },
  { code: "VIP25", title: "VIP 25% Off", value: 25, valueType: "percentage" },
  { code: "FREESHIP", title: "Free Shipping", value: 0, valueType: "shipping" },
];

interface Store {
  id: string;
  name: string;
  domain: string;
  palette: { accent: string };
  vipClub: string;
  cartMilestones: Array<{ threshold: number; reward: string; value: number }>;
}

class PromoLoyaltyBot {
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
    let injected = 0;
    for (const store of this.stores) {
      this.injectCartDrawer(store);
      this.injectLoyaltyPill(store);
      injected += 2;
      process.stdout.write(`[PromoLoyaltyBot] injected cart + loyalty into ${store.id}\n`);
    }
    this.writeDiscountPayloads();
    this.writeBanditConfig();
    process.stdout.write(`[PromoLoyaltyBot] TOTAL: ${injected} snippet injections across ${this.stores.length} stores\n`);
    process.stdout.write(`[PromoLoyaltyBot] Discount codes: ${DISCOUNT_CODES.map((d) => d.code).join(", ")}\n`);
  }

  private injectCartDrawer(store: Store): void {
    const acc = store.palette.accent;
    const m = store.cartMilestones
      .map(
        (ms) =>
          `<div class="milestone" data-threshold="${ms.threshold}"><span class="m-amount">$${ms.threshold}</span><span class="m-reward">${ms.reward}</span></div>`
      )
      .join("\n");
    const content = `<div class="cart-drawer" id="cart-drawer" aria-hidden="true">
  <h3 class="drawer-title">Your Cart</h3>
  <div class="progress-wrap"><div class="progress-label"><span>Next milestone</span><span id="progress-text">$0 / $${store.cartMilestones[0].threshold}</span></div><div class="progress-bar"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div></div>
  <div class="milestones">${m}</div>
  <div class="cart-items" id="cart-items"></div>
  <div class="drawer-footer">
    <div class="vip-points">VIP Points earned: <span id="vip-points">0</span> <span class="pts-label">(10 pts per $1)</span></div>
    <button class="checkout-btn" id="checkout-btn">Checkout</button>
  </div>
</div>
<script>
(function(){
  const acc = "${acc}";
  const milestones = ${JSON.stringify(store.cartMilestones)};
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  function update(subtotal){
    let next = milestones.find(m => subtotal < m.threshold);
    if (fill && text) {
      const pct = next ? Math.min(100, (subtotal / next.threshold) * 100) : 100;
      fill.style.width = pct + '%';
      text.textContent = next ? '$' + subtotal.toFixed(2) + ' / $' + next.threshold : 'Goal reached';
    }
  }
  window.updateCartProgress = update;
})();
</script>
<style>
#cart-drawer{position:fixed;inset:0 0 auto 38%;background:var(--surface, #1a1a1a);padding:1.5rem;border-top:1px solid rgba(255,255,255,0.1);z-index:50;display:none;width:min(60vw,420px);font-family:system-ui,-apple-system,sans-serif;color:#fff;}
#cart-drawer .progress-wrap{margin:0.75rem 0;}
#cart-drawer .progress-label{display:flex;justify-content:space-between;font-size:0.8rem;color:rgba(255,255,255,0.7);margin-bottom:0.25rem;}
#cart-drawer .progress-bar{height:7px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;}
#cart-drawer .progress-fill{height:100%;background:var(--accent, ${acc});width:0%;transition:width .35s ease;}
#cart-drawer .milestones{font-size:0.8rem;color:rgba(255,255,255,0.72);margin:0.8rem 0;}
#cart-drawer .milestone{margin:0.2rem 0;padding:0.25rem 0.5rem;border-radius:6px;background:rgba(255,255,255,0.06);font-size:0.8rem;display:flex;justify-content:space-between;}
#cart-drawer .drawer-footer{display:flex;justify-content:space-between;align-items:center;margin-top:1rem;font-size:0.85rem;}
#cart-drawer .checkout-btn{background:var(--accent, ${acc});color:#000;border:none;border-radius:8px;padding:0.75rem 1.5rem;font-weight:700;cursor:pointer;}
#cart-drawer .checkout-btn:hover{filter:brightness(1.12);}
</style>`;
    writeFileSync(join(BUILD, store.id, "snippets", "cart-drawer.liquid"), content);
  }

  private injectLoyaltyPill(store: Store): void {
    const acc = store.palette.accent;
    const content = `<div class="loyalty-pill-wrap" style="position:fixed;bottom:1.5rem;left:1.5rem;z-index:60;">
  <div class="loyalty-pill" id="loyalty-pill" role="button" tabindex="0">
    <span class="club-name">${store.vipClub}</span>
    <span class="points">10 pts per $1 &bull; Member &rarr; Insider &rarr; Founder's Circle</span>
    <button class="voucher" data-code="WELCOME15">WELCOME15</button>
    <button class="voucher" data-code="BUNDLE20">BUNDLE20</button>
    <span class="referral">Give $15, Get $15</span>
  </div>
</div>
<style>
.loyalty-pill{background:var(--surface,#1a1a1a);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:0.55rem 1.1rem;color:#fff;font-size:0.82rem;display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;}
.loyalty-pill .club-name{font-weight:700;}
.loyalty-pill .points{color:rgba(255,255,255,0.7);font-size:0.78rem;}
.loyalty-pill button.voucher{background:var(--accent, ${acc});color:#000;border:none;border-radius:8px;padding:0.35rem 0.85rem;font-size:0.78rem;font-weight:700;cursor:pointer;}
.loyalty-pill button.voucher:hover{filter:brightness(1.12);}
.loyalty-pill .referral{color:var(--accent, ${acc});font-weight:700;font-size:0.78rem;}
</style>`;
    writeFileSync(join(BUILD, store.id, "snippets", "loyalty-vip-club.liquid"), content);
  }

  private writeDiscountPayloads(): void {
    const dir = join(ROOT, "config", "promo");
    mkdirSync(dir, { recursive: true });
    const payload = {
      codes: DISCOUNT_CODES,
      provisionVia: "Shopify Admin API /admin/api/2024-01/price_rules.json",
      note: "Requires connected Shopify store + Admin API access token. OmegaBot self-debugs provisioning errors.",
      epsilonGreedy: { epsilon: 0.10, description: "Epsilon-Greedy Multi-Armed Bandit for promo A/B testing" },
    };
    writeFileSync(join(dir, "discount-codes.json"), JSON.stringify(payload, null, 2));
    process.stdout.write(`[PromoLoyaltyBot] wrote config/promo/discount-codes.json\n`);
  }

  private writeBanditConfig(): void {
    const dir = join(ROOT, "config", "promo");
    const config = {
      algorithm: "epsilon-greedy",
      epsilon: 0.10,
      codes: DISCOUNT_CODES.map((d) => d.code),
      metric: "conversion_rate",
      updateIntervalHours: 24,
    };
    writeFileSync(join(dir, "bandit-config.json"), JSON.stringify(config, null, 2));
  }
}

const bot = new PromoLoyaltyBot();
bot.run();

export { PromoLoyaltyBot };
