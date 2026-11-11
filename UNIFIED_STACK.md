# Unified Bizi Bees Stack

Two repos, one store: **bizibees-store.myshopify.com**

| Repo | Role |
|------|------|
| **bizi-bees** (this repo) | Shopify theme (OS 2.0), conversion UI, post-order helpers, growth/SEO scripts |
| **shopify-autonomous-dropship** | Discovery → vetting → creative → catalog ingest → prune → order_router |

Primary catalog automation: https://github.com/hampusi97/shopify-autonomous-dropship

---

## What lives where

### This repo (theme + conversion)
- `layout/theme.liquid` — fonts, critical CSS, emergency + ultra-dynamic assets
- `assets/emergency-storefront-repair.css` — kill red overlays, restore product photos
- `assets/ultra-dynamic-core.js` / `.css` — magnetic CTAs, 3D tilt, radar pill
- `snippets/dynamic-free-shipping-bar.liquid` — $40 free Priority Shipping progress
- `sections/luma-flagship-offer.liquid` — Solo / Glow Kit / Master ladder
- `sections/luma-before-after.liquid` — Day 1 / Day 28 slider
- `snippets/cart-drawer-upsell.liquid` — serum 1-click upsell
- `core/supplier_router.py` — mirror of dropship `integrations/order_router.py`
- `core/autonomous_growth_scientist.py`, `auto_healer.py`, `executive_alerts.py`
- `scripts/seo_blog_generator.py`

### Dropship bot repo
- Modules A–D: TrendScout → EconVetter → CreativeDirector → CatalogJanitor
- `integrations/order_router.py` — **canonical** orders/paid router
- `integrations/bizi_growth_bridge.py` — revenue vs $1,666.67/day + theme tips
- GitHub Actions cron + Docker 24/7 daemon

---

## Shared contracts (keep in sync)

**Shipping note (customer-facing):**
> Dispatched from our domestic US logistics facility with verified 24h USPS Priority Tracking.

**Lanes:** `tech_skincare` | `food_cold` | `pod_vintage` | `default_domestic`

**Safety:** `AUTOPILOT_AUTO_PUBLISH=false` and growth `DRY_RUN=1` until live conversion is proven.

**Cosmetic only** — no disease treatment claims on Luma / skincare copy.

---

## Activate

1. Publish **this** theme (Shopify admin or GitHub theme sync).
2. Configure secrets on **shopify-autonomous-dropship** Actions / `.env`.
3. Point Shopify `orders/paid` webhook at a host running `order_router.handle_orders_paid`.
4. Run `python main.py run-pipeline` (or `start-cron`) in the dropship repo.
5. Add Flagship Offer + Before/After sections in the theme editor.

See also: `shopify-autonomous-dropship/UNIFIED_STACK.md`
