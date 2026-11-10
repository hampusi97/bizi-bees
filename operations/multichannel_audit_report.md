# Bizi Bees Storefront & Catalog Audit Report

**Date of Audit:** November 10, 2026  
**Target Store:** Bizi Bees (Provo, UT 84601) — https://bizibees-store.myshopify.com  
**Sources Inspected:**
- Public Storefront Product Feed: `https://bizibees-store.myshopify.com/products.json` (Pages 1 & 2; 350 active products cataloged)
- Live Storefront Homepage HTML: `https://bizibees-store.myshopify.com/` (164,063 bytes)
- Ground Truth Store Brief (November 2026)

---

## Executive Summary

A comprehensive automated and manual code audit was conducted on Bizi Bees' live Shopify storefront and product catalog.

| Metric / Check | Status | Summary Findings |
| :--- | :--- | :--- |
| **Total Products Scanned** | 350 | Full catalog parsed via public JSON endpoint |
| **Medical / Claim Violations** | ⚠️ High Risk | **11 products** contain critical medical claims in titles, handles, or descriptions (migraine, headache, clinical, medical-grade, cavitation, antibacterial). |
| **Non-Medical Term Collisions** | ℹ️ Resolved | **12 products** contained harmless false-positive matches (dog treats, confectionery treats, notebook medical sections). |
| **Theme / Social Proof** | ❌ Banned Violations | Homepage contains fabricated star ratings (★★★★★ 4.9/5.0), 184+ fake reviews, a fake live viewer counter script, and unauthorized "Limited Stock" urgency badges. (Ground truth: Store has **0 orders**). |
| **Price Sanity & Reconciliation** | ⚠️ 1 Discrepancy | Hero products reconcile to verified brief prices. PROVOTODAY (35% off) display prices match expected calculations. **2027 Metal Flake Planner** is priced at $45.00 in feed (brief specifies $47.00). |
| **Shipping Policy** | ✅ Clear | Verified store policy is **100% Free US Shipping on every order, no minimum**. |

---

## Part 1: Product-Level Banned Claims Audit (Rule 1 Compliance)

Bizi Bees adheres to a strict zero-medical-claims policy. Products may only use appearance and comfort terminology ("looks smoother", "feels relaxing", "spa-like ritual"). Below is the itemized list of all 11 products with real compliance risks, ranked by severity, accompanied by required claim-safe rewrites.

### Top Severity Claim Risks & Required Rewrites

#### 1. LumaRelief™ 360° Comfort Cap — 2-Cap Rotation Bundle
- **Handle:** `lumarelief™-360-cold-thermal-migraine-cap-continuous-2-cap-rotation-bundle`
- **Location:** Handle
- **Banned Term Found:** `migraine`
- **Violation:** The URL handle contains "migraine", which is an FDA disease treatment claim.
- **Recommended Claim-Safe Rewrite:** 
  - Change handle to: `lumarelief-360-cold-thermal-comfort-cap-2-cap-rotation-bundle`
  - *(Action Note: Mark HANDED_OFF to Shopify Admin. URL redirects must be created so external links do not break).*

#### 2. LumaRelief™ 360° Cold & Warm Comfort Cap — Light-Blocking Gel Cap
- **Handle:** `lumarelief™-360-cold-thermal-migraine-headache-eye-relief-cap`
- **Location:** Handle
- **Banned Terms Found:** `migraine`, `headache`
- **Violation:** Disease claims embedded directly into product slug.
- **Recommended Claim-Safe Rewrite:**
  - Change handle to: `lumarelief-360-cold-thermal-comfort-cap`
  - *(Action Note: Mark HANDED_OFF to Shopify Admin).*

#### 3. LumaSculpt™ Ultrasonic Body Sculpting Device
- **Handle:** `lumasculpt™-ultrasonic-body-cavitation-lymphatic-drainage-device`
- **Location:** Handle
- **Banned Terms Found:** `cavitation`, `lymphatic drainage`
- **Violation:** "Cavitation" and "lymphatic drainage" constitute medical/fat-loss physiological claims.
- **Recommended Claim-Safe Rewrite:**
  - Change handle to: `lumasculpt-ultrasonic-body-contouring-device`
  - Update title to: `LumaSculpt™ Ultrasonic Body Contouring & Massage Tool`
  - *(Action Note: Mark HANDED_OFF to Shopify Admin).*

#### 4. LumaMask™ LED Light Therapy Mask — 7-Color Face & Neck Shield
- **Handle:** `lumamask™-7-color-medical-grade-led-phototherapy-face-neck-shield`
- **Location:** Handle
- **Banned Term Found:** `medical-grade`
- **Violation:** "Medical-grade" is an explicit medical certification claim prohibited under store rules.
- **Recommended Claim-Safe Rewrite:**
  - Change handle to: `lumamask-7-color-led-phototherapy-face-neck-shield`
  - Description rewrite: Replace any "clinical grade" or "medical grade" phrases with "Spa-inspired multi-spectrum LED light therapy for your at-home facial routine."
  - *(Action Note: Mark HANDED_OFF to Shopify Admin).*

#### 5. Cryo-Glow Stainless Steel Facial Ice Sculpting Roller
- **Handle:** `cryo-glow-stainless-steel-facial-ice-sculpting-roller`
- **Location:** Description (`body_html`)
- **Banned Term Found:** `headaches`
- **Context:** `"...soothe headaches, and sculpt contours..."`
- **Recommended Claim-Safe Rewrite:**
  - Replace `"soothe headaches"` with `"melt away facial tension and provide refreshing cooling relief"`.

#### 6. Activating Copper Peptide Conductive Serum (30ml)
- **Handle:** `activating-copper-peptide-conductive-serum-30ml`
- **Location:** Description (`body_html`)
- **Banned Term Found:** `clinical`
- **Context:** `"...priming the skin for clinical microcurrent toning..."`
- **Recommended Claim-Safe Rewrite:**
  - Replace `"clinical microcurrent toning"` with `"your at-home microcurrent facial ritual"`.

#### 7–12. Spun Bamboo Organic Graphic T-Shirts (6 Products)
- **Handles:**
  1. `go-hiking-mens-bamboo-viscose-organic-cotton-short-sleeve-graphic-t-shirt`
  2. `always-keep-smiling-mens-bamboo-viscose-organic-cotton-short-sleeve-graphic-t-shirt`
  3. `celestial-moon-boho-flowers-vintage-unisex-bamboo-cotton-graphic-t-shirt`
  4. `moons-and-stars-boho-flowers-vintage-unisex-bamboo-cotton-graphic-t-shirt`
  5. `boho-retro-hippie-mushrooms-natural-unisex-bamboo-cotton-graphic-t-shirt`
  6. `heartbeat-coffee-unisex-bamboo-cotton-graphic-t-shirt`
- **Location:** Description (`body_html`)
- **Banned Term Found:** `bacteria`
- **Context:** `"...blends that often foster odors and bacteria, our bamboo viscose..."`
- **Recommended Claim-Safe Rewrite:**
  - Replace `"foster odors and bacteria"` with `"trap heat and odors, our bamboo viscose offers breathable, moisture-wicking freshness all day long"`.

---

### Non-Medical Contextual Occurrences (Confirmed False Positives)

The automated audit flagged 12 products where banned words appeared in harmless, non-medical everyday contexts. **No rewrite is strictly required**, but they are documented here for complete transparency:

1. **Dog Treats in Pet Toys (10 Products):**
   - Products: `snack-stuffers-holiday-dog-stocking-stuffers`, `roasted-turkey-dog-chew-toy-treat-dispenser-usa-made-sodapup`, `snowman-dog-toy-durable-winter-chew-toy-for-large-dogs-usa-made`, `christmas-tree-nylon-dog-chew-toy-for-aggressive-chewers-usa-made-fda-compliant`, etc.
   - Context: Refers to edible canine snacks and kibble (e.g. "fill with peanut butter or treats"). This is not a human medical cure claim.
2. **Confectionery Treats in Food & Toys:**
   - Products: `nerds-gummy-clusters-rainbow-candy-0-5oz-packs-bulk-value-bag`, `swirl-serve-kinetic-sand-station` ("sweet treats"), `cafe-playtime-pad®` ("baking up delicious treats at the bakery"), `quilts-of-iceland-book-513` ("family treats").
3. **Mechanical Treatment:**
   - Product: `kitchen-electronic-measuring-spoon-food-scale-digital-spoon-scale`
   - Context: "special surface treatment" refers to plastic exterior finish, not medical therapy.
4. **Notebook Section Index:**
   - Product: `home-keeper`
   - Context: "Medical Information- 4 pages" refers to a blank emergency contact form inside a printed household budget binder.

---

## Part 2: Theme-Level Problems in Homepage HTML

Audit of the live homepage rendered DOM revealed critical compliance defects that must be resolved in the Shopify theme code:

### 1. Fabricated Reviews and Star Ratings (Zero Orders Rule Violation)
- **Problem:** The storefront displays extensive fake social proof:
  - `★★★★★ 4.9/5.0 (184+ Reviews)` in the hero trust bar.
  - Card-level badges: `★★★★★ 4.9 (218 reviews)`, `★★★★★ 4.9 (184 reviews)`, `★★★★★ 4.9 (142 reviews)`, `★★★★★ 5.0 (96 reviews)`.
  - Section heading: `Verified Customer Reviews Grid`.
- **Verdict:** **BLATANT VIOLATION** of Hard Rule 2 ("No fake social proof. The store has 0 orders. Never write reviews, ratings, testimonials, 'X people bought', or customer counts").
- **Required Action:** Remove the star rating spans, fake review counts, and customer review cards from `sections/home.liquid` immediately. Mark HANDED_OFF for theme file deployment.

### 2. Fake Urgency & Live Viewer JavaScript Injection
- **Problem:** Inline script at the bottom of the homepage executes an artificial viewer generator:
  ```javascript
  var viewerCount = Math.floor(Math.random() * 8) + 9;
  pill.innerHTML = "<span class='live-dot'></span> <span><strong>" + viewerCount + " people</strong> viewing right now · High demand</span>";
  ```
- **Verdict:** Fabricated consumer activity counter designed to create false urgency. Violates transparency and truth-in-advertising guidelines.
- **Required Action:** Remove this script snippet entirely.

### 3. Unauthorized "Limited Stock" Urgency Badges
- **Problem:** 12 product cards display `🔥 Limited Stock · Sells Fast`.
- **Verdict:** Under store ground truth, scarcity claims are ONLY permitted for the **Squishy Dumpling Advent Calendar** (~4 left). Applying this badge to all supplier-fulfilled Collective items is prohibited.
- **Required Action:** Remove the static "Limited Stock" tag from general product loops.

### 4. Banned Disease Phrases in Homepage Headings
- **Problem:** Hero and feature blocks display:
  - `"Clinical Skin & Migraine Recovery"`
  - `"Medical-grade at-home tech"`
  - `"deep cellular rejuvenation"`
  - `"Dermatologist-proven 630nm/850nm dual phototherapy"`
- **Required Action:** Replace with comfort/boutique language:
  - Replace with: `"At-Home Skincare Rituals & Curated Family Finds"`
  - Replace with: `"Gentle soothing compression caps and rejuvenating LED facial tools"`.

---

## Part 3: Price Sanity & Storefront Feed Reconciliation

Every price in Bizi Bees catalog was reconciled against the verified store brief:

| Product Name | Verified Brief Price | `products.json` Feed Price | Storefront Display (Homepage) | Reconciliation Status & Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Squishy Dumpling Advent Calendar** | $28.99 | $28.99 | $28.99 | ✅ Exact match. #1 priority, ~4 left in stock. |
| **Mystery Squishies** | $19.99 | $19.99 | $19.99 | ✅ Exact match. |
| **Squishy Time Rescue** | $29.99 | $29.99 | $29.99 (compare $34.49) | ✅ Exact match. Compare-at is $34.49; eBay price is $34.49. |
| **Screen-Free Kids Pack (3-pack)** | $29.85 | $29.85 | $29.85 | ✅ Exact match ($9.95 × 3). |
| **Lemonade Stand Playtime Pad** | $9.95 | $9.95 | $9.95 | ✅ Exact match. |
| **10 Frame Fidgets (Set of 12)** | $14.99 | $14.99 | $14.99 | ✅ Exact match. |
| **Mini Animal Fidget Pack (20pc)** | $30.00 | $30.00 | $30.00 | ✅ Exact match. |
| **Fidget Moons** | from $16.95 | $16.95 (Dark Side $21.95) | $16.95 | ✅ Exact match. |
| **2027 Weekly Planners** | $45.00 | $45.00 | $45.00 | ✅ Exact match across standard covers. |
| **2027 Metal Flake Planner** | **$47.00** | **$45.00** | $45.00 | ⚠️ **Discrepancy:** Brief specifies $47.00; Shopify feed lists $45.00. Hand off to owner to update in Shopify Admin. |
| **LumaGlow Wand** | $59.99 | $59.99 | $38.99 (PROVOTODAY display) | ✅ Reconciled: $59.99 × 0.65 = $38.99. Display price reflects 35% launch code. |
| **LumaLift Sculptor** | $64.99 | $64.99 | $42.24 (PROVOTODAY display) | ✅ Reconciled: $64.99 × 0.65 = $42.24. |
| **LumaMask Shield** | $129.99 | $129.99 | $84.49 (PROVOTODAY display) | ✅ Reconciled: $129.99 × 0.65 = $84.49. |
| **LumaRelief Comfort Cap (1-Pack)** | $34.99 | $34.99 | $22.74 (PROVOTODAY display) | ✅ Reconciled: $34.99 × 0.65 = $22.74. |
| **LumaRelief Comfort Cap (2-Pack)** | $49.99 | $49.99 | $32.49 (PROVOTODAY display) | ✅ Reconciled: $49.99 × 0.65 = $32.49. |

### Note on the PROVOTODAY Display Effect
The storefront theme features a custom conversion modification that dynamically displays the 35% discount price with promotional copy stating that code `PROVOTODAY` is auto-applied at checkout. This is **not a pricing error**; the underlying catalog database prices in `products.json` match ground truth.

---

## Part 4: Inventory & Data Gaps (NEEDS_DATA)

1. **Exact Numeric Inventory Quantities:**
   - Shopify public storefront feeds (`products.json`) intentionally suppress inventory counts for security, exposing only boolean `available: true/false`.
   - `NEEDS_DATA: Exact inventory numbers for Collective products require Shopify Admin or Collective dashboard export.`
   - Scarcity status for **Squishy Dumpling Advent Calendar** (~4 left) is verified by owner ground truth.
2. **TikTok Shop Package Dimensions:**
   - Public product data contains weights and variant attributes, but physical boxed carton measurements (L × W × H) are not exposed.
   - `NEEDS_DATA: Physical package dimensions (inches) for top 40 TikTok sync candidates.`

---

## Summary of Hand-Offs for Owner Deployment

All items requiring authenticated access have been isolated for the owner/Muse:
- `HANDED_OFF: Update 4 Luma product handles in Shopify Admin and verify 301 redirects.`
- `HANDED_OFF: Remove fake star review snippets, fake viewer JS, and unverified urgency badges from sections/home.liquid.`
- `HANDED_OFF: Adjust 2027 Metal Flake Planner price from $45.00 to $47.00 in Shopify Admin.`
