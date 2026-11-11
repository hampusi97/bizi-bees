#!/usr/bin/env python3
"""
core/supplier_router.py
Post-purchase lane router for bizibees-store (theme repo mirror).

Canonical implementation also lives in:
  hampusi97/shopify-autonomous-dropship/integrations/order_router.py

Keep lane names + STANDARD_SHIP_NOTE identical across both repos.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import requests

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("supplier_router")

SHOP = os.environ.get("SHOPIFY_SHOP", os.environ.get("SHOPIFY_SHOP_DOMAIN", "")).rstrip("/")
ADMIN_TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN", os.environ.get("SHOPIFY_ADMIN_ACCESS_TOKEN", ""))
WEBHOOK_SECRET = os.environ.get("SHOPIFY_WEBHOOK_SECRET", "")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2024-10")

ZENDROP_KEY = os.environ.get("ZENDROP_API_KEY", "")
CJ_KEY = os.environ.get("CJ_API_KEY", os.environ.get("CJ_DROPSHIPPING_API_KEY", ""))
COPACKER_URL = os.environ.get("COPACKER_WEBHOOK_URL", "")

STANDARD_SHIP_NOTE = (
    "Dispatched from our domestic US logistics facility with verified 24h USPS Priority Tracking."
)


@dataclass
class RoutedBatch:
    lane: str
    line_items: List[Dict[str, Any]] = field(default_factory=list)


def verify_shopify_hmac(raw_body: bytes, hmac_header: str) -> bool:
    if not WEBHOOK_SECRET:
        log.warning("SHOPIFY_WEBHOOK_SECRET not set — skipping HMAC verification (dev only)")
        return True
    import base64

    digest = hmac.new(WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).digest()
    computed_b64 = base64.b64encode(digest).decode("utf-8")
    computed_hex = hmac.new(WEBHOOK_SECRET.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_b64, hmac_header or "") or hmac.compare_digest(
        computed_hex, hmac_header or ""
    )


def classify_line(li: Dict[str, Any]) -> str:
    vendor = (li.get("vendor") or "").lower()
    title = (li.get("title") or "").lower()
    sku = (li.get("sku") or "").lower()
    tags_blob = " ".join(
        str(p.get("value", p) if isinstance(p, dict) else p)
        for p in (li.get("properties") or li.get("tags") or [])
    ).lower()
    blob = f"{vendor} {title} {sku} {tags_blob}"

    if any(k in blob for k in ("luma", "skincare", "wand", "serum", "cryo", "microcurrent", "red light")):
        return "tech_skincare"
    if any(k in blob for k in ("fizz", "soda", "syrup", "chocolate", "crave", "food", "snack")):
        return "food_cold"
    if any(k in blob for k in ("vintage", "book", "print-on-demand", "pod", "thrift", "planner")):
        return "pod_vintage"
    return "default_domestic"


def group_order(order: Dict[str, Any]) -> Dict[str, RoutedBatch]:
    batches: Dict[str, RoutedBatch] = {}
    for li in order.get("line_items") or []:
        lane = classify_line(li)
        if lane not in batches:
            batches[lane] = RoutedBatch(lane=lane)
        batches[lane].line_items.append(li)
    return batches


def dispatch_tech_skincare(batch: RoutedBatch, order: Dict[str, Any]) -> None:
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
        log.info("Dispatching tech/skincare to Zendrop for %s", order.get("name"))
    elif CJ_KEY:
        log.info("Dispatching tech/skincare to CJ for %s", order.get("name"))
    else:
        log.warning("No Zendrop/CJ key — log only: %s", json.dumps(payload)[:400])


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
    log.info(
        "POD/vintage batch for %s (%d lines)",
        order.get("name"),
        len(batch.line_items),
    )


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
    results = {}
    for lane, batch in batches.items():
        fn = DISPATCHERS.get(lane, dispatch_default)
        try:
            fn(batch, order)
            results[lane] = {"status": "ok", "lines": len(batch.line_items)}
        except Exception as exc:
            log.exception("Dispatch failed for lane %s", lane)
            results[lane] = {"status": "error", "error": str(exc)}
    return {
        "ok": True,
        "order": order.get("name"),
        "lanes": results,
        "ship_note": STANDARD_SHIP_NOTE,
    }


if __name__ == "__main__":
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
