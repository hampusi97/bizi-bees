# Multi-Store Architecture: `bizi-bees` Monorepo

This repository hosts and orchestrates multiple independent Shopify stores from a single unified codebase. Each store maintains its own dedicated theme assets, product catalog, custom domains, pricing strategy, and Shopify Admin API credentials.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        YOUR GITHUB REPO                                │
│                           bizi-bees                                    │
└───────────────┬────────────────────────────────────────┬───────────────┘
                │                                        │
                ▼                                        ▼
    [ STORE 1: LUMA CLINICAL ]             [ STORE 2: BIZI BEES VINTAGE ]
    • Clinical Beauty & Recovery           • Curated Used Books & Puzzles
    • High-AOV Bundles ($39 - $119)        • Gift Bundles ($24 - $35)
    • TikTok Shop + Meta Ads               • eBay + Etsy + Organic TikTok
    • Domain: LumaClinical.com             • Domain: ShopBiziBees.com
    • Folder: stores/luma-clinical/        • Folder: stores/bizi-bees-vintage/
```

---

## 1. Store Registry

| Store ID | Brand Name | Public Domain | Default Shopify Admin | Target Niche | Acquisition Channels |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `luma-clinical` | **Luma Clinical Wellness** | [lumaclinical.com](https://lumaclinical.com) | `luma-clinical.myshopify.com` | At-Home Phototherapy & Recovery | TikTok Shop, Meta Ads, Google Shopping |
| `bizi-bees-vintage` | **Bizi Bees Vintage** | [shopbizibees.com](https://shopbizibees.com) | `bizibees-store.myshopify.com` | Curated Used Books & Puzzles | eBay, Etsy, Organic TikTok, Popups |

---

## 2. Directory Layout

```
bizi-bees/
├── stores/
│   ├── luma-clinical/
│   │   ├── store.json               # Store metadata, URLs, target channels & env mapping
│   │   ├── .env.example             # Local environment variables template
│   │   ├── catalog/                 # Store-specific product definitions & variant pricing
│   │   │   └── products.json
│   │   ├── theme/                   # Complete OS 2.0 Theme (sections, snippets, templates)
│   │   │   ├── layout/
│   │   │   ├── sections/            # luma-clinical-hero, luma-comparison-matrix, etc.
│   │   │   ├── snippets/            # luma-design-tokens, luma-catalog-filter, etc.
│   │   │   └── templates/           # index.json configured for clinical beauty conversion
│   │   └── README.md
│   │
│   └── bizi-bees-vintage/
│       ├── store.json
│       ├── .env.example
│       ├── catalog/
│       │   └── products.json        # Curated used book bundles, puzzles & bookstacks
│       ├── theme/
│       │   ├── layout/
│       │   ├── sections/            # bizi-blind-date-book, bizi-holiday-bundle-builder, etc.
│       │   ├── snippets/            # bee, bizi-bees-schema, condition-guide, etc.
│       │   └── templates/           # index.json configured for vintage cozy book vibes
│       └── README.md
│
├── scripts/
│   ├── manage_stores.py             # Universal CLI engine (Python: zero dependencies)
│   └── manage_stores.rb             # Instant macOS native runner (Ruby: runs out-of-the-box)
│
├── .github/workflows/
│   └── deploy-stores.yml            # Matrix CI/CD deploying each store with its own secrets
│
└── STORES.md                        # This architecture guide
```

---

## 3. GitHub Secrets Configuration

To enable automated CI/CD deployments without stores colliding or deploying to the wrong URL, configure the following secrets in GitHub (**Settings > Secrets and variables > Actions**):

### For Store 1: Luma Clinical
- `SHOPIFY_STORE_LUMA_URL`: e.g. `luma-clinical.myshopify.com`
- `SHOPIFY_ADMIN_ACCESS_TOKEN_LUMA`: e.g. `shpat_xxxxxxxxxxxxxxxxxxxxxxxx`
- `SHOPIFY_CLI_THEME_TOKEN_LUMA` *(optional)*: Theme deployment token

### For Store 2: Bizi Bees Vintage
- `SHOPIFY_STORE_BIZIBEES_URL`: e.g. `bizibees-store.myshopify.com`
- `SHOPIFY_ADMIN_ACCESS_TOKEN_BIZIBEES`: e.g. `shpat_xxxxxxxxxxxxxxxxxxxxxxxx`
- `SHOPIFY_CLI_THEME_TOKEN_BIZIBEES` *(optional)*: Theme deployment token

> **Note on Backward Compatibility:** If `SHOPIFY_STORE_*_URL` is not set, the deployment workflow safely falls back to the legacy `SHOPIFY_SHOP_URL` and `SHOPIFY_ADMIN_ACCESS_TOKEN`.

---

## 4. Local CLI Operations

You can manage all stores using either Python or Ruby directly from the terminal.

### List All Configured Stores & Credentials Status
```bash
# Using Python
python3 scripts/manage_stores.py --list

# Using Ruby
ruby scripts/manage_stores.rb --list
```

### Validate and Seed Product Catalogs (Idempotent)
The engine checks if products already exist before attempting creation, ensuring no duplicate products are created:
```bash
# Seed Luma Clinical
python3 scripts/manage_stores.py --store luma-clinical --action seed-catalog

# Seed Bizi Bees Vintage
python3 scripts/manage_stores.py --store bizi-bees-vintage --action seed-catalog
```

### Package Theme Zip for Direct Upload
Creates a clean, production-ready theme zip archive in `dist/<store-id>-theme.zip`:
```bash
python3 scripts/manage_stores.py --store luma-clinical --action export-theme-zip
python3 scripts/manage_stores.py --store bizi-bees-vintage --action export-theme-zip
```
You can upload the resulting `.zip` file into Shopify Admin under **Online Store > Themes > Add Theme > Upload zip file**.

---

## 5. How to Add a 3rd Store

Adding a new store to this monorepo takes less than 2 minutes:

1. Create a new directory: `stores/<your-store-id>/`
2. Add `store.json` specifying `id`, `name`, `primary_domain`, `default_shop_url`, and `env_prefix`.
3. Add `catalog/products.json` with product definitions, tags, and pricing.
4. Add `theme/` containing the Shopify theme assets.
5. The `manage_stores` engine will automatically discover the new store on next run!
