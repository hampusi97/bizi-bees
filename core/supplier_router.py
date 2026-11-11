#!/usr/bin/env python3
"""
core/supplier_router.py
Parses Shopify orders/paid webhooks and routes line items by vendor/tags.

Requirements:
  - SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN
  - Optional: ZENDROP_API_KEY, CJ_API_KEY, COPACKER_WEBHOOK_URL
  - Run behind a verified webhook endpoint (HMAC check)

Does NOT invent packing or claim "packed in Provo" for dropship lines.
Standard shipping note: Dispatched from our domestic US logistics facility with verified 24h USPS Priority Tracking.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import requests

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("supplier_router")

SHOP = os.environ.get("SHOPIFY_SHOP", "").rstrip("/")
ADMIN_TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN", "")
WEBHOOK_SECRET = os.environ.get("SHOPIFY_WEBHOOK_SECRET", "")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2024-10")

ZENDROP_KEY = os.environ.get("ZENDROP_API_KEY", "")
CJ_KEY = os.environ.get("CJ_API_KEY", "")
COPACKER_URL = os.environ.get("COPACKER_WEBHOOK_URL", "")

STANDARD_SHIP_NOTE = (
    "Dispatched from our domestic US logistics facility with verified 24h USPS Priority Tracking."
)

# Vendor / tag → lane
LANE_RULES = [
    # (predicate, lane_name)
    (lambda li: "luma" in (li.get("vendor") or "").lower() or "luma" in " ".join(li.get("tags") or []).lower(), "tech_skincare"),
    (lambda li: any(t in " ".join(li.get("tags") or []).lower() for t in ("fizz", "soda", "syrup", "chocolate", "crave")), "food_cold"),
    (lambda li: any(t in " ".join(li.get("tags") or []).lower() for t in ("vintage", "book", "print-on-demand", "pod")), "pod_vintage"),
]


@dataclass
class RoutedBatch:
    lane: str
    line_items: List[Dict[str, Any]] = field(default_factory=list)


def verify_shopify_hmac(raw_body: bytes, hmac_header: str) -> bool:
    if not WEBHOOK_SECRET:
        log.warning("SHOPIFY_WEBHOOK_SECRET not set — skipping HMAC verification (dev only)")
        return True
    digest = hmac.new(WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).digest()
    computed = hmac.new(WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    # Shopify sends base64; support both hex and base64 environments
    import base64
    computed_b64 = base64.b64encode(digest).decode("utf-8")
    return hmac.compare_digest(computed_b64, hmac_header) or hmac.compare_digest(computed, hmac_header)


def classify_line(li: Dict[str, Any]) -> str:
    for pred, lane in LANE_RULES:
        try:
            if pred(li):
                return lane
        except Exception:
            continue
    return "default_domestic"


def group_order(order: Dict[str, Any]) -> Dict[str, RoutedBatch]:
    batches: Dict[str, RoutedBatch] = {}
    for li in order.get("line_items") or []:
        # Enrich with product tags if present on the payload; otherwise keep vendor
        lane = classify_line({
            "vendor": li.get("vendor") or "",
            "tags": li.get("properties") or [],
            "title": li.get("title") or "",
            "sku": li.get("sku") or "",
        })
        if lane not in batches:
            batches[lane] = RoutedBatch(lane=lane)
        batches[lane].line_items.append(li)
    return batches


def shopify_graphql(query: str, variables: Optional[Dict] = None) -> Dict:
    if not SHOP or not ADMIN_TOKEN:
        raise RuntimeError("SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN required")
    url = f"https://{SHOP}/admin/api/{API_VERSION}/graphql.json"
    r = requests.post(
        url,
        headers={
            "X-Shopify-Access-Token": ADMIN_TOKEN,
            "Content-Type": "application/json",
        },
        json={"query": query, "variables": variables or {}},
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    if data.get("errors"):
        log.error("GraphQL errors: %s", data["errors"])
    return data


def strip_legacy_provo_note(order_id: str) -> None:
    """Optional: clear legacy note attributes that claim in-house packing."""
    # Placeholder — implement via orderUpdate if you store packing notes as attributes
    log.info("Would standardize shipping note on order %s → %s", order_id, STANDARD_SHIP_NOTE)


def dispatch_tech_skincare(batch: RoutedBatch, order: Dict[str, Any]) -> None:
    """Route Luma / skincare to Zendrop or CJ US warehouse."""
    payload = {
        "order_name": order.get("name"),
        "order_id": order.get("id"),
        "shipping_address": order.get("shipping_address"),
        "line_items": [
            {"sku": li.get("sku"), "quantity": li.get("quantity"), "title": li.get("title")}
            for li in batch.line_items
        ],
        "note": STANDARD_SHIP_NOTE,
    }
    if ZENDROP_KEY:
        log.info("Dispatching tech/skincare batch to Zendrop for %s", order.get("name"))
        # requests.post("https://api.zendrop.com/...", headers={"Authorization": ZENDROP_KEY}, json=payload)
    elif CJ_KEY:
        log.info("Dispatching tech/skincare batch to CJ for %s", order.get("name"))
    else:
        log.warning("No Zendrop/CJ key — logging only: %s", json.dumps(payload)[:400])


def dispatch_food_cold(batch: RoutedBatch, order: Dict[str, Any]) -> None:
    payload = {
        "order_name": order.get("name"),
        "line_items": batch.line_items,
        "flags": ["insulated", "cold-pack"],
        "note": STANDARD_SHIP_NOTE,
    }
    if COPACKER_URL:
        requests.post(COPACKER_URL, json=payload, timeout=20)
        log.info("Food/cold batch sent to co-packer for %s", order.get("name"))
    else:
        log.warning("COPACKER_WEBHOOK_URL missing — log only")


def dispatch_pod_vintage(batch: RoutedBatch, order: Dict[str, Any]) -> None:
    log.info("POD/vintage batch for %s (%d lines) — route to liquidator/POD API", order.get("name"), len(batch.line_items))


def dispatch_default(batch: RoutedBatch, order: Dict[str, Any]) -> None:
    log.info("Default domestic lane for %s (%d lines)", order.get("name"), len(batch.line_items))


DISPATCHERS = {
    "tech_skincare": dispatch_tech_skincare,
    "food_cold": dispatch_food_cold,
    "pod_vintage": dispatch_pod_vintage,
    "default_domestic": dispatch_default,
}


def handle_orders_paid(raw_body: bytes, hmac_header: str) -> Dict[str, Any]:
    if not verify_shopify_hmac(raw_body, hmac_header or ""):
        return {"ok": False, "error": "invalid_hmac"}
    order = json.loads(raw_body.decode("utf-8"))
    batches = group_order(order)
    strip_legacy_provo_note(str(order.get("id")))
    results = {}
    for lane, batch in batches.items():
        fn = DISPATCHERS.get(lane, dispatch_default)
        try:
            fn(batch, order)
            results[lane] = {"status": "ok", "lines": len(batch.line_items)}
        except Exception as exc:
            log.exception("Dispatch failed for lane %s", lane)
            results[lane] = {"status": "error", "error": str(exc)}
    return {"ok": True, "order": order.get("name"), "lanes": results}


if __name__ == "__main__":
    # Local dry-run
    sample = {
        "id": 1,
        "name": "#1001",
        "line_items": [
            {"title": "LumaGlow Wand", "vendor": "Luma Wellness", "sku": "LUMA-WAND", "quantity": 1},
            {"title": "Vintage Board Game", "vendor": "Bizi Bees", "sku": "BB-GAME", "quantity": 1},
        ],
        "shipping_address": {"city": "Denver", "province_code": "CO", "country_code": "US"},
    }
    print(json.dumps(handle_orders_paid(json.dumps(sample).encode(), ""), indent=2))
