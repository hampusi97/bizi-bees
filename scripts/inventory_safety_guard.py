import os
import sys

try:
    import requests
    USE_REQUESTS = True
except ImportError:
    import urllib.request
    import json
    USE_REQUESTS = False

SHOP_URL = os.getenv("TARGET_STORE_DOMAIN", os.getenv("SHOPIFY_SHOP_URL", "bizibees-store.myshopify.com")).replace("https://", "").replace("/", "")
TARGET_STORE_ID = os.getenv("TARGET_STORE_ID", "default")
ACCESS_TOKEN = os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN", "")
API_VERSION = "2024-04"
GRAPHQL_URL = f"https://{SHOP_URL}/admin/api/{API_VERSION}/graphql.json"

HEADERS = {"Content-Type": "application/json", "X-Shopify-Access-Token": ACCESS_TOKEN}

def protect_inventory():
    if not ACCESS_TOKEN:
        print("Note: SHOPIFY_ADMIN_ACCESS_TOKEN not set. Exiting inventory check.")
        return

    query = """
    query {
      products(first: 50, query: "status:active") {
        edges {
          node {
            id
            title
            totalInventory
            tracksInventory
          }
        }
      }
    }
    """
    try:
        res = requests.post(GRAPHQL_URL, headers=HEADERS, json={"query": query}).json()
        products = res.get("data", {}).get("products", {}).get("edges", [])

        for p in products:
            node = p["node"]
            if node.get("tracksInventory") and (node.get("totalInventory") or 0) <= 0:
                mutation = """
                mutation productUpdate($input: ProductInput!) {
                  productUpdate(input: $input) { product { id status } }
                }
                """
                requests.post(GRAPHQL_URL, headers=HEADERS, json={
                    "query": mutation,
                    "variables": {"input": {"id": node["id"], "status": "DRAFT"}}
                })
                print(f"⚠️ [SAFETY ACTIVATED] Drafted {node['title']} — Zero stock detected.")
    except Exception as e:
        print(f"Error during inventory check: {e}")

if __name__ == "__main__":
    protect_inventory()
