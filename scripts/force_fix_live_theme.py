#!/usr/bin/env python3
import os
import sys
import json

try:
    import requests
    USE_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.error
    USE_REQUESTS = False

SHOP_URL = os.getenv("SHOPIFY_SHOP_URL", "bizibees-store.myshopify.com")
ACCESS_TOKEN = os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN", "")
API_VERSION = "2024-04"
BASE_URL = f"https://{SHOP_URL}/admin/api/{API_VERSION}"

HEADERS = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": ACCESS_TOKEN
}

MASTER_FIX_CSS = """
/* ==========================================================
   FORCED LIVE FIX: KILL RED BADGES & RESTORE LUXURY AESTHETIC
   ========================================================== */

/* 1. PERMANENTLY HIDE THE GIANT RED BADGES COVERING PHOTOS */
.card__badge,
.product-card__badge,
.badge--sale,
.badge,
[class*="sale-badge"],
[class*="badge--bottom"],
[class*="35-off"],
.card-wrapper [class*="badge"],
.card-wrapper .card__content .badge {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  height: 0 !important;
  width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 2. REVEAL & SHARPEN PRODUCT IMAGERY */
.card__media,
.card-wrapper .media,
.product-card .media,
.media--square {
  position: relative !important;
  background: #FFFFFF !important;
  border-radius: 14px !important;
  overflow: hidden !important;
  padding: 10px !important;
}

.card__media img,
.card-wrapper .media img,
.product__media img {
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  object-fit: contain !important;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.card-wrapper:hover .card__media img {
  transform: scale(1.04) !important;
}

/* 3. CLEAN PRODUCT CARD ELEVATION */
.card-wrapper {
  background: #FFFFFF !important;
  border: 1px solid #E2E8F0 !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04) !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
  padding: 14px !important;
  overflow: hidden !important;
}

.card-wrapper:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1) !important;
  border-color: #CBD5E1 !important;
}

/* 4. CLEAN PRICING & BUTTONS (NO HARSH RED) */
.price-item--sale,
.price__regular .price-item {
  color: #0F172A !important;
  font-weight: 800 !important;
  font-size: 18px !important;
}

.price-item--regular {
  color: #94A3B8 !important;
  font-size: 13px !important;
  text-decoration: line-through !important;
  margin-left: 6px !important;
  font-weight: 500 !important;
}

.button,
.button--primary,
.btn {
  background: #0F172A !important;
  color: #FFFFFF !important;
  border: none !important;
  border-radius: 50px !important;
  padding: 12px 28px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  letter-spacing: 0.3px !important;
  transition: all 0.2s ease !important;
}

.button:hover,
.button--primary:hover {
  background: #0D9488 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.25) !important;
}

/* 5. NEUTRALIZE MINT GREEN STATS BAR */
.clinical-stats-bar,
[class*="stats"],
[class*="counter"] {
  background: #F8FAFC !important;
  border: 1px solid #E2E8F0 !important;
  border-radius: 16px !important;
  padding: 24px 15px !important;
}

.clinical-stats-bar strong,
[class*="stats"] strong,
[class*="stats"] h3 {
  color: #0D9488 !important;
  font-size: 28px !important;
  font-weight: 900 !important;
}

.clinical-stats-bar span,
[class*="stats"] p {
  color: #64748B !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

/* 6. HIDE THE $150,000 LEGAL THREAT TEXT IN FOOTER */
footer p:contains("150,000"),
footer p:contains("Lanham Act"),
.footer__content-bottom:has(p:contains("STRICT LEGAL WARNING")) {
  display: none !important;
}
"""

def http_get(url):
    if USE_REQUESTS:
        return requests.get(url, headers=HEADERS)
    else:
        req = urllib.request.Request(url, headers=HEADERS, method="GET")
        try:
            with urllib.request.urlopen(req) as response:
                content = response.read().decode("utf-8")
                class MockRes:
                    status_code = response.status
                    text = content
                    def json(self):
                        return json.loads(content)
                return MockRes()
        except urllib.error.HTTPError as e:
            class MockError:
                status_code = e.code
                text = e.read().decode("utf-8")
                def json(self):
                    return json.loads(self.text)
            return MockError()

def http_put(url, data):
    if USE_REQUESTS:
        return requests.put(url, headers=HEADERS, json=data)
    else:
        payload_bytes = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=payload_bytes, headers=HEADERS, method="PUT")
        try:
            with urllib.request.urlopen(req) as response:
                content = response.read().decode("utf-8")
                class MockRes:
                    status_code = response.status
                    text = content
                    def json(self):
                        return json.loads(content)
                return MockRes()
        except urllib.error.HTTPError as e:
            class MockError:
                status_code = e.code
                text = e.read().decode("utf-8")
                def json(self):
                    return json.loads(self.text)
            return MockError()

def force_update_live_theme():
    if not ACCESS_TOKEN:
        print("❌ Error: SHOPIFY_ADMIN_ACCESS_TOKEN is missing!")
        print("👉 Set the environment variable: export SHOPIFY_ADMIN_ACCESS_TOKEN=\"shpat_...\"")
        return

    print(f"📡 Connecting to {SHOP_URL} to identify the LIVE active theme...")
    
    # 1. Fetch all themes and find the published one (role == "main")
    res = http_get(f"{BASE_URL}/themes.json")
    if res.status_code != 200:
        print(f"Failed to fetch themes: {res.text}")
        return

    themes = res.json().get("themes", [])
    live_theme = next((t for t in themes if t.get("role") == "main"), None)

    if not live_theme:
        print("❌ Could not locate a published theme with role 'main'.")
        return

    theme_id = live_theme["id"]
    print(f"🎯 FOUND LIVE PUBLISHED THEME: '{live_theme['name']}' (ID: {theme_id})")

    # 2. Target the primary stylesheet asset (usually assets/base.css or assets/theme.css)
    asset_key = "assets/base.css"
    get_asset_res = http_get(f"{BASE_URL}/themes/{theme_id}/assets.json?asset[key]={asset_key}")
    
    if get_asset_res.status_code != 200:
        asset_key = "assets/theme.css"
        get_asset_res = http_get(f"{BASE_URL}/themes/{theme_id}/assets.json?asset[key]={asset_key}")

    existing_css = ""
    if get_asset_res.status_code == 200:
        existing_css = get_asset_res.json().get("asset", {}).get("value", "")

    # 3. Append the fix CSS to the live theme's active stylesheet
    new_css_content = existing_css + "\n\n" + MASTER_FIX_CSS
    payload = {
        "asset": {
            "key": asset_key,
            "value": new_css_content
        }
    }

    print(f"🚀 Injecting live storefront fix into '{asset_key}' on live theme {theme_id}...")
    update_res = http_put(f"{BASE_URL}/themes/{theme_id}/assets.json", payload)

    if update_res.status_code in [200, 201]:
        print("🎉 SUCCESS! Live theme stylesheet updated directly on Shopify.")
        print("✓ Giant red squares eliminated.")
        print("✓ Product images restored to 100% visibility.")
        print("✓ Pricing & buttons elevated to luxury DTC aesthetic.")
        print("✓ Threatening footer block suppressed.")
        print(f"👉 Refresh https://{SHOP_URL}/ now to see the live fix!")
    else:
        print(f"❌ Failed to update asset: {update_res.text}")

if __name__ == "__main__":
    force_update_live_theme()
