import os
import requests
from datetime import datetime, timezone

SHOP_URL = os.getenv("SHOPIFY_SHOP_URL", "bizibees-store.myshopify.com")
ACCESS_TOKEN = os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN", "")
API_VERSION = "2024-04"
GRAPHQL_URL = f"https://{SHOP_URL}/admin/api/{API_VERSION}/graphql.json"

HEADERS = {"Content-Type": "application/json", "X-Shopify-Access-Token": ACCESS_TOKEN}

def run_nightly_audit():
    report = []
    timestamp = datetime.now(timezone.utc).isoformat()

    if not ACCESS_TOKEN:
        print("Note: SHOPIFY_ADMIN_ACCESS_TOKEN not set. Generating empty dry-run audit report.")
        with open("REPORTS_DAILY_AUDIT.md", "w") as f:
            f.write(f"# Daily Autonomous Audit Report\n*Run at: {timestamp} (Dry Run)*\n\n")
            f.write("- No active token configured; audit loop in standby mode.\n")
        print("Audit finished and logged.")
        return

    query = """
    query {
      products(first: 50, query: "status:active") {
        edges {
          node { id title tags }
        }
      }
    }
    """
    try:
        res = requests.post(GRAPHQL_URL, headers=HEADERS, json={"query": query}).json()
        products = res.get("data", {}).get("products", {}).get("edges", [])

        for item in products:
            node = item["node"]
            title = node["title"]
            p_id = node["id"]

            # Purge non-aligned clutter items from clinical brand
            if any(w in title.lower() for w in ["fidget", "planner", "filament", "used book"]):
                mutation = """
                mutation productUpdate($input: ProductInput!) {
                  productUpdate(input: $input) { product { id status } }
                }
                """
                requests.post(GRAPHQL_URL, headers=HEADERS, json={
                    "query": mutation,
                    "variables": {"input": {"id": p_id, "status": "DRAFT"}}
                })
                report.append(f"Archived Clutter: {title}")

        if not report:
            report.append("All active products pass clinical brand alignment verification.")

    except Exception as e:
        report.append(f"Audit exception encountered: {e}")

    with open("REPORTS_DAILY_AUDIT.md", "w") as f:
        f.write(f"# Daily Autonomous Audit Report\n*Run at: {timestamp}*\n\n")
        for line in report:
            f.write(f"- {line}\n")
    print("Audit finished and logged.")

if __name__ == "__main__":
    run_nightly_audit()
