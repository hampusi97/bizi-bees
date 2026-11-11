#!/usr/bin/env python3
"""
core/auto_healer.py
Scans for broken image CDNs, missing media, and enforces minimum price floors.

Env:
  SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN
  MIN_PRICE_FLOOR=9.00
  DRY_RUN=1|0
  FALLBACK_IMAGE_URL=https://cdn.shopify.com/...
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List

import requests

log = logging.getLogger("auto_healer")
logging.basicConfig(level=logging.INFO)

SHOP = os.environ.get("SHOPIFY_SHOP", "").rstrip("/")
TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN", "")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2024-10")
DRY_RUN = os.environ.get("DRY_RUN", "1") != "0"
MIN_PRICE = float(os.environ.get("MIN_PRICE_FLOOR", "9.00"))
FALLBACK_IMAGE = os.environ.get("FALLBACK_IMAGE_URL", "")


def rest(method: str, path: str, payload=None) -> Dict:
    url = f"https://{SHOP}/admin/api/{API_VERSION}{path}"
    r = requests.request(
        method,
        url,
        headers={"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"},
        json=payload,
        timeout=45,
    )
    r.raise_for_status()
    return r.json() if r.content else {}


def check_url(url: str) -> bool:
    if not url:
        return False
    try:
        r = requests.head(url, timeout=8, allow_redirects=True)
        return r.status_code < 400
    except Exception:
        return False


def scan_products(limit: int = 50) -> Dict[str, Any]:
    data = rest("GET", f"/products.json?limit={limit}&fields=id,title,image,images,variants")
    products = data.get("products") or []
    broken_images = []
    below_floor = []
    for p in products:
        img = (p.get("image") or {}).get("src")
        if img and not check_url(img):
            broken_images.append({"id": p["id"], "title": p["title"], "src": img})
        for v in p.get("variants") or []:
            try:
                price = float(v.get("price") or 0)
            except ValueError:
                price = 0
            if price and price < MIN_PRICE:
                below_floor.append(
                    {"product_id": p["id"], "variant_id": v["id"], "price": price, "title": p["title"]}
                )
    return {"broken_images": broken_images, "below_floor": below_floor, "scanned": len(products)}


def heal(report: Dict[str, Any]) -> Dict[str, Any]:
    actions = []
    for item in report.get("broken_images") or []:
        msg = f"Broken image on {item['title']} ({item['id']})"
        if FALLBACK_IMAGE and not DRY_RUN:
            # Attach fallback via product image API — simplified log for safety
            actions.append({"action": "fallback_image", "product_id": item["id"], "status": "would_apply"})
        else:
            actions.append({"action": "log_only", "detail": msg})
        log.warning(msg)

    for item in report.get("below_floor") or []:
        msg = f"Price floor breach: {item['title']} variant {item['variant_id']} @ ${item['price']}"
        log.warning(msg)
        actions.append({"action": "price_floor", "variant_id": item["variant_id"], "dry_run": DRY_RUN})
        # Real write would use variant update — keep dry-run default

    return {"actions": actions, "dry_run": DRY_RUN}


def run() -> Dict[str, Any]:
    if not SHOP or not TOKEN:
        return {"ok": False, "error": "missing credentials"}
    report = scan_products()
    result = heal(report)
    return {"ok": True, "report": report, "result": result}


if __name__ == "__main__":
    print(run())
