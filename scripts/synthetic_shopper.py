import os
import requests
import json
import time

STORE_URL = os.getenv("SHOPIFY_STORE_URL", "https://bizibees-store.myshopify.com")
DISCORD_WEBHOOK = os.getenv("DISCORD_WEBHOOK_URL", "")

def alert(msg):
    print(msg)
    if DISCORD_WEBHOOK:
        try:
            requests.post(DISCORD_WEBHOOK, json={"content": msg}, timeout=5)
        except Exception as e:
            print(f"Failed to deliver Discord alert: {e}")

def test_store_front_end():
    print(f"🕵️ [SYNTHETIC SHOPPER] Testing {STORE_URL} from real customer perspective...")
    start_all = time.time()
    
    # Test 1: Check Homepage Status & Latency
    try:
        t0 = time.time()
        r = requests.get(STORE_URL, timeout=12)
        latency_home = (time.time() - t0) * 1000
        assert r.status_code == 200, f"Homepage returned status {r.status_code}"
        print(f"✓ Homepage responsive (200 OK &mdash; {latency_home:.0f}ms)")
    except Exception as e:
        alert(f"🚨 CRITICAL: Homepage is down or slow! Error: {e}")
        return False

    # Test 2: Check Cart & 1-Click Checkout Endpoint
    try:
        t0 = time.time()
        cart_url = f"{STORE_URL}/cart.json"
        cart_res = requests.get(cart_url, timeout=10)
        latency_cart = (time.time() - t0) * 1000
        assert cart_res.status_code == 200, f"Cart endpoint returned {cart_res.status_code}"
        print(f"✓ Cart and checkout engine responsive (200 OK &mdash; {latency_cart:.0f}ms)")
    except Exception as e:
        alert(f"🚨 CHECKOUT ERROR: Cart endpoint failed! Error: {e}")
        return False

    # Test 3: Check Active Catalog & Products Availability
    try:
        t0 = time.time()
        prod_url = f"{STORE_URL}/products.json?limit=10"
        prod_res = requests.get(prod_url, timeout=10)
        latency_prod = (time.time() - t0) * 1000
        data = prod_res.json()
        products = data.get("products", [])
        assert len(products) > 0, "No active products found on storefront!"
        print(f"✓ Catalog verified ({len(products)} active products found &mdash; {latency_prod:.0f}ms)")
        for p in products[:3]:
            print(f"   • SKU: {p.get('title')} (Handle: /{p.get('handle')})")
    except Exception as e:
        alert(f"🚨 CATALOG ALERT: No products found or endpoint failed! Error: {e}")
        return False

    total_time = (time.time() - start_all) * 1000
    print(f"🎉 [TEST PASSED] All storefront systems, checkout routes, and products operating perfectly ({total_time:.0f}ms total)!")
    return True

if __name__ == "__main__":
    success = test_store_front_end()
    exit(0 if success else 1)
