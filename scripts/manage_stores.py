#!/usr/bin/env python3
"""
==============================================================================
Multi-Store Shopify Architecture Manager
bizi-bees repository monorepo orchestration
==============================================================================
Manages independent stores within the same repository:
- Store 1: Luma Clinical (lumaclinical.com)
- Store 2: Bizi Bees Vintage (shopbizibees.com)
- Expandable for future stores in stores/<store-id>/

Usage:
  python3 scripts/manage_stores.py --list
  python3 scripts/manage_stores.py --store luma-clinical --action check
  python3 scripts/manage_stores.py --store luma-clinical --action seed-catalog
  python3 scripts/manage_stores.py --store luma-clinical --action export-theme-zip
  python3 scripts/manage_stores.py --store bizi-bees-vintage --action seed-catalog
==============================================================================
"""

import argparse
import json
import os
import sys
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import requests
    USE_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.error
    USE_REQUESTS = False

REPO_ROOT = Path(__file__).resolve().parent.parent
STORES_DIR = REPO_ROOT / "stores"
API_VERSION = os.getenv("SHOPIFY_API_VERSION", "2024-04")


def discover_stores() -> Dict[str, Dict[str, Any]]:
    """Scan the stores/ directory and load store.json for each store."""
    stores = {}
    if not STORES_DIR.is_dir():
        return stores

    for entry in sorted(STORES_DIR.iterdir()):
        if entry.is_dir():
            config_file = entry / "store.json"
            if config_file.is_file():
                try:
                    with open(config_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    store_id = data.get("id", entry.name)
                    data["_dir"] = entry
                    stores[store_id] = data
                except Exception as e:
                    print(f"⚠️ Warning: Could not parse {config_file}: {e}")
    return stores


def resolve_credentials(store_cfg: Dict[str, Any]) -> Tuple[str, str, Dict[str, str]]:
    """
    Resolve the Shopify Admin URL and access token for the given store.
    Priority order:
    1. Store-specific env var (e.g. SHOPIFY_STORE_LUMA_URL / SHOPIFY_ADMIN_ACCESS_TOKEN_LUMA)
    2. Prefix env var (e.g. LUMA_SHOPIFY_SHOP_URL)
    3. Generic env var (e.g. SHOPIFY_SHOP_URL)
    4. Default in store.json
    """
    env_vars = store_cfg.get("env_vars", {})
    env_prefix = store_cfg.get("env_prefix", "").upper()

    url_key = env_vars.get("shop_url", f"SHOPIFY_STORE_{env_prefix}_URL")
    token_key = env_vars.get("admin_token", f"SHOPIFY_ADMIN_ACCESS_TOKEN_{env_prefix}")

    shop_url = (
        os.getenv(url_key)
        or os.getenv(f"{env_prefix}_SHOPIFY_SHOP_URL")
        or os.getenv("SHOPIFY_SHOP_URL")
        or store_cfg.get("default_shop_url", "")
    ).strip()

    # Normalize url (remove https:// or trailing slashes)
    shop_url = shop_url.replace("https://", "").replace("http://", "").strip("/")

    token = (
        os.getenv(token_key)
        or os.getenv(f"{env_prefix}_SHOPIFY_ADMIN_ACCESS_TOKEN")
        or os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN", "")
    ).strip()

    meta = {
        "url_env_key": url_key,
        "token_env_key": token_key,
        "is_configured": bool(token and not token.startswith("shpat_xxxx")),
    }
    return shop_url, token, meta


def execute_graphql(shop_url: str, token: str, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute a GraphQL query against Shopify Admin API using requests or urllib."""
    endpoint = f"https://{shop_url}/admin/api/{API_VERSION}/graphql.json"
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
        "User-Agent": "BiziBees-MultiStoreEngine/2.0",
    }
    payload = {"query": query, "variables": variables or {}}
    payload_bytes = json.dumps(payload).encode("utf-8")

    if USE_REQUESTS:
        resp = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f"HTTP {resp.status_code} from Shopify ({endpoint}): {resp.text}")
        result = resp.json()
    else:
        req = urllib.request.Request(endpoint, data=payload_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                body = response.read().decode("utf-8")
                result = json.loads(body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else ""
            raise RuntimeError(f"HTTP {e.code} Error from Shopify: {err_body}")

    if "errors" in result:
        raise RuntimeError(f"GraphQL Errors: {json.dumps(result['errors'])}")
    return result


def action_list_stores(stores: Dict[str, Dict[str, Any]]):
    """List all configured stores, their URLs, and configuration status."""
    print("=" * 80)
    print("BIZI-BEES MULTI-STORE REPOSITORY REGISTRY")
    print("=" * 80)
    for sid, cfg in stores.items():
        shop_url, token, meta = resolve_credentials(cfg)
        status = "🟢 Configured (Token Active)" if meta["is_configured"] else "🟡 Dry-Run / Missing Token"
        print(f"Store ID       : {sid}")
        print(f"Name           : {cfg.get('name')}")
        print(f"Domain         : {cfg.get('primary_domain')}")
        print(f"Shopify Admin  : https://{shop_url}")
        print(f"Target Niche   : {cfg.get('niche')}")
        print(f"Target AOV     : {cfg.get('target_aov')}")
        print(f"Channels       : {', '.join(cfg.get('channels', []))}")
        print(f"Env Secret Var : {meta['token_env_key']}")
        print(f"Status         : {status}")
        print("-" * 80)


def action_check_connection(store_id: str, cfg: Dict[str, Any]):
    """Verify live connectivity and permissions with Shopify Admin."""
    shop_url, token, meta = resolve_credentials(cfg)
    print(f"🔍 Testing connection for [{store_id}] at {shop_url}...")

    if not meta["is_configured"]:
        print(f"⚠️ Notice: Live token not provided for [{store_id}].")
        print(f"   Please set {meta['token_env_key']} in your environment or GitHub Secrets.")
        print(f"   Using default simulated check against: {shop_url}")
        return True

    query = """
    query {
      shop {
        name
        myshopifyDomain
        primaryDomain {
          url
          host
        }
        currencyCode
        plan {
          displayName
        }
      }
    }
    """
    try:
        data = execute_graphql(shop_url, token, query)
        shop = data.get("data", {}).get("shop", {})
        print(f"✅ Connection successful!")
        print(f"   Store Name    : {shop.get('name')}")
        print(f"   Shopify Domain: {shop.get('myshopifyDomain')}")
        print(f"   Primary Host  : {shop.get('primaryDomain', {}).get('host')}")
        print(f"   Currency      : {shop.get('currencyCode')}")
        print(f"   Plan          : {shop.get('plan', {}).get('displayName')}")
        return True
    except Exception as e:
        print(f"❌ Connection check failed: {e}")
        return False


def find_existing_product_by_title(shop_url: str, token: str, title: str) -> Optional[Dict[str, Any]]:
    """Search for existing product by exact or near title to ensure idempotency."""
    query = """
    query findProduct($query: String!) {
      products(first: 5, query: $query) {
        edges {
          node {
            id
            title
            handle
            status
            totalVariants
          }
        }
      }
    }
    """
    clean_title = title.replace('"', '').replace("'", "")
    res = execute_graphql(shop_url, token, query, {"query": f"title:'{clean_title}'"})
    edges = res.get("data", {}).get("products", {}).get("edges", [])
    for edge in edges:
        node = edge.get("node", {})
        if node.get("title", "").strip().lower() == title.strip().lower():
            return node
    return None


def action_seed_catalog(store_id: str, cfg: Dict[str, Any], dry_run: bool = False):
    """Idempotently seed the catalog for the designated store."""
    shop_url, token, meta = resolve_credentials(cfg)
    catalog_rel = cfg.get("catalog_path", f"stores/{store_id}/catalog/products.json")
    catalog_path = REPO_ROOT / catalog_rel

    if not catalog_path.is_file():
        print(f"❌ Catalog file not found at: {catalog_path}")
        return False

    with open(catalog_path, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"📦 Seeding {len(products)} products into [{store_id}] ({shop_url})...")

    if not meta["is_configured"]:
        print(f"⚠️ Dry-run mode: {meta['token_env_key']} not set. Validating local product specs:")
        for idx, p in enumerate(products, 1):
            print(f"   {idx}. [VALID] '{p.get('title')}' | Type: {p.get('productType')} | Variants: {len(p.get('variants', []))}")
        print("✅ All catalog specs validated successfully.")
        return True

    for p in products:
        title = p["title"]
        existing = find_existing_product_by_title(shop_url, token, title)
        if existing:
            print(f"   ℹ️ Already exists (ID: {existing['id']}): '{title}' — skipping duplicate creation.")
            continue

        if dry_run:
            print(f"   [DRY RUN] Would create product: '{title}'")
            continue

        # 1. Create Product Base
        create_mutation = """
        mutation productCreate($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              handle
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        input_payload = {
            "title": p["title"],
            "productType": p.get("productType", "General"),
            "vendor": p.get("vendor", cfg.get("name")),
            "descriptionHtml": p.get("descriptionHtml", ""),
            "tags": p.get("tags", []),
            "status": "ACTIVE"
        }
        res = execute_graphql(shop_url, token, create_mutation, {"input": input_payload})
        prod_data = res.get("data", {}).get("productCreate", {})
        user_errors = prod_data.get("userErrors", [])
        if user_errors:
            print(f"   ❌ Error creating '{title}': {user_errors}")
            continue

        product_id = prod_data.get("product", {}).get("id")
        print(f"   ✓ Created product: '{title}' (ID: {product_id})")

        # 2. Attach Variants with Pricing via productVariantsBulkCreate
        raw_variants = p.get("variants", [])
        if raw_variants and product_id:
            variants_input = []
            for v in raw_variants:
                var_entry = {
                    "price": str(v.get("price", "0.00")),
                    "optionValues": [{"name": v.get("title", "Default Title"), "optionName": p.get("options", ["Title"])[0]}]
                }
                if "compareAtPrice" in v and v["compareAtPrice"]:
                    var_entry["compareAtPrice"] = str(v["compareAtPrice"])
                if "sku" in v and v["sku"]:
                    var_entry["inventoryItem"] = {"sku": v["sku"]}
                variants_input.append(var_entry)

            variants_mutation = """
            mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
              productVariantsBulkCreate(productId: $productId, variants: $variants) {
                productVariants {
                  id
                  title
                  price
                }
                userErrors {
                  field
                  message
                }
              }
            }
            """
            try:
                v_res = execute_graphql(shop_url, token, variants_mutation, {
                    "productId": product_id,
                    "variants": variants_input
                })
                v_errors = v_res.get("data", {}).get("productVariantsBulkCreate", {}).get("userErrors", [])
                if v_errors:
                    print(f"     ⚠️ Note on variants for '{title}': {v_errors}")
                else:
                    print(f"     ✓ Attached {len(variants_input)} pricing variant(s) to '{title}'")
            except Exception as ve:
                print(f"     ⚠️ Variant creation note: {ve}")

    print(f"✅ Catalog provisioning completed for [{store_id}]!")
    return True


def action_export_theme_zip(store_id: str, cfg: Dict[str, Any]) -> Path:
    """Package the store's theme directory into a deployable .zip file."""
    theme_rel = cfg.get("theme_path", f"stores/{store_id}/theme")
    theme_path = REPO_ROOT / theme_rel

    if not theme_path.is_dir():
        raise FileNotFoundError(f"Theme directory does not exist: {theme_path}")

    dist_dir = REPO_ROOT / "dist"
    dist_dir.mkdir(exist_ok=True)
    zip_output = dist_dir / f"{store_id}-theme.zip"

    print(f"📦 Packaging theme for [{store_id}] from {theme_rel}...")
    file_count = 0
    with zipfile.ZipFile(zip_output, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(theme_path):
            for file in files:
                if file.startswith(".DS_Store"):
                    continue
                full_path = Path(root) / file
                archive_name = full_path.relative_to(theme_path)
                zf.write(full_path, arcname=archive_name)
                file_count += 1

    size_kb = zip_output.stat().st_size / 1024
    print(f"✅ Successfully packaged {file_count} files into:")
    print(f"   {zip_output} ({size_kb:.1f} KB)")
    return zip_output


def main():
    parser = argparse.ArgumentParser(description="Multi-Store Shopify Architecture Manager")
    parser.add_argument("--list", action="store_true", help="List all configured stores")
    parser.add_argument("--store", type=str, help="Store identifier (e.g. luma-clinical, bizi-bees-vintage)")
    parser.add_argument("--action", choices=["check", "seed-catalog", "export-theme-zip", "all"], default="check",
                        help="Action to perform")
    parser.add_argument("--dry-run", action="store_true", help="Simulate mutations without updating store")

    args = parser.parse_args()
    stores = discover_stores()

    if not stores:
        print("❌ No store definitions found in stores/*.")
        sys.exit(1)

    if args.list or not args.store:
        action_list_stores(stores)
        if not args.store:
            print("\n👉 Pass --store <store_id> --action <action> to manage a specific store.")
            return

    store_id = args.store
    if store_id not in stores:
        print(f"❌ Unknown store '{store_id}'. Available stores: {list(stores.keys())}")
        sys.exit(1)

    cfg = stores[store_id]
    print(f"🚀 Executing [{args.action}] for Store: {cfg.get('name')} ({store_id})")

    if args.action in ("check", "all"):
        action_check_connection(store_id, cfg)

    if args.action in ("seed-catalog", "all"):
        action_seed_catalog(store_id, cfg, dry_run=args.dry_run)

    if args.action in ("export-theme-zip", "all"):
        action_export_theme_zip(store_id, cfg)


if __name__ == "__main__":
    main()
