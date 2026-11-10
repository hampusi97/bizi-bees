# Luma Clinical Wellness (`luma-clinical`)

**Storefront Configuration & Assets for Luma Clinical**

- **Primary Custom Domain**: [https://lumaclinical.com](https://lumaclinical.com)
- **Shopify Endpoint**: `luma-clinical.myshopify.com`
- **Niche**: Clinical beauty, at-home phototherapy & therapeutic recovery
- **Target AOV**: $39 – $119
- **Primary Acquisition**: TikTok Shop, Meta Ads, Google Shopping

## Structure

- `store.json`: Store metadata, URLs, target channels, and secret mapping.
- `catalog/products.json`: Verified seed catalog with compliant clinical copy, variants, and bundle pricing.
- `theme/`: Dedicated Shopify OS 2.0 theme components including `luma-clinical-hero`, `luma-comparison-matrix`, `luma-before-after`, `luma-results-tabs`, `luma-bundle-builder`, and `luma-trust-footer`.

## Deployment

To deploy this store from the repository root:

```bash
# Verify connection
python3 scripts/manage_stores.py --store luma-clinical --action check

# Seed or update product catalog
python3 scripts/manage_stores.py --store luma-clinical --action seed-catalog

# Export theme zip for manual or CLI upload
python3 scripts/manage_stores.py --store luma-clinical --action export-theme-zip
```
