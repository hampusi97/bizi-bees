# Bizi Bees Vintage (`bizi-bees-vintage`)

**Storefront Configuration & Assets for Bizi Bees Vintage & Curated Books**

- **Primary Custom Domain**: [https://shopbizibees.com](https://shopbizibees.com)
- **Shopify Endpoint**: `bizibees-store.myshopify.com`
- **Niche**: Curated used books, puzzles, vintage paperbacks & gift bundles
- **Target AOV**: $24 – $35
- **Primary Acquisition**: eBay, Etsy, Organic TikTok, Local Utah Popups

## Structure

- `store.json`: Store metadata, URLs, target channels, and secret mapping.
- `catalog/products.json`: Verified seed catalog with Blind Date with a Book, 1000-Piece Puzzles, and Vintage Bookstack Trios.
- `theme/`: Dedicated Shopify OS 2.0 theme components including `home`, `bizi-zero-gravity-hub`, `bizi-blind-date-book`, `bizi-holiday-bundle-builder`, `bizi-inspection-matrix`, and `bizi-bees-vault`.

## Deployment

To deploy this store from the repository root:

```bash
# Verify connection
python3 scripts/manage_stores.py --store bizi-bees-vintage --action check

# Seed or update product catalog
python3 scripts/manage_stores.py --store bizi-bees-vintage --action seed-catalog

# Export theme zip for manual or CLI upload
python3 scripts/manage_stores.py --store bizi-bees-vintage --action export-theme-zip
```
