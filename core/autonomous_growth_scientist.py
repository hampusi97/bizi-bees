#!/usr/bin/env python3
"""
core/autonomous_growth_scientist.py
Tracks progress toward $50k/month ($1,666.67/day) and proposes / optionally applies
controlled fixes via Shopify GraphQL.

Safety:
  - Default DRY_RUN=1 (no writes)
  - Never silently changes prices without logging
  - Stock-out drafting is optional and tagged

Env:
  SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN
  DRY_RUN=1|0
  TARGET_DAILY_REVENUE=1666.67
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests

log = logging.getLogger("growth_scientist")
logging.basicConfig(level=logging.INFO)

SHOP = os.environ.get("SHOPIFY_SHOP", "").rstrip("/")
TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN", "")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2024-10")
DRY_RUN = os.environ.get("DRY_RUN", "1") != "0"
TARGET_DAILY = float(os.environ.get("TARGET_DAILY_REVENUE", "1666.67"))
TARGET_AOV = float(os.environ.get("TARGET_AOV", "65"))
TARGET_CVR = float(os.environ.get("TARGET_CVR", "0.02"))  # 2%


@dataclass
class Metrics:
    revenue_24h: float
    orders_24h: int
    aov: float
    sessions_24h: int
    cvr: float


def gql(query: str, variables: Optional[Dict] = None) -> Dict:
    url = f"https://{SHOP}/admin/api/{API_VERSION}/graphql.json"
    r = requests.post(
        url,
        headers={"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"},
        json={"query": query, "variables": variables or {}},
        timeout=45,
    )
    r.raise_for_status()
    return r.json()


def fetch_order_metrics() -> Metrics:
    """Pull recent orders; sessions/CVR may need ShopifyQL or analytics API — approximate here."""
    query = """
    {
      orders(first: 50, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            createdAt
            totalPriceSet { shopMoney { amount } }
          }
        }
      }
    }
    """
    data = gql(query)
    edges = (((data.get("data") or {}).get("orders") or {}).get("edges")) or []
    now = datetime.now(timezone.utc)
    revenue = 0.0
    count = 0
    for e in edges:
        node = e["node"]
        created = datetime.fromisoformat(node["createdAt"].replace("Z", "+00:00"))
        if (now - created).total_seconds() <= 86400:
            revenue += float(node["totalPriceSet"]["shopMoney"]["amount"])
            count += 1
    aov = (revenue / count) if count else 0.0
    # Sessions unknown without analytics — leave 0 / cvr 0 unless provided
    sessions = int(os.environ.get("SESSIONS_24H", "0"))
    cvr = (count / sessions) if sessions else 0.0
    return Metrics(revenue_24h=revenue, orders_24h=count, aov=aov, sessions_24h=sessions, cvr=cvr)


def recommend(m: Metrics) -> List[str]:
    actions = []
    gap = TARGET_DAILY - m.revenue_24h
    actions.append(f"24h revenue ${m.revenue_24h:.2f} vs target ${TARGET_DAILY:.2f} (gap ${gap:.2f})")
    actions.append(f"Orders {m.orders_24h} | AOV ${m.aov:.2f} | CVR {m.cvr*100:.2f}%")

    if m.cvr and m.cvr < TARGET_CVR:
        actions.append("CVR below 2% → surface trust badges, 60-day guarantee, and simplify PDP CTA")
    if m.aov and m.aov < 50:
        actions.append("AOV under $50 → promote $59.99 Glow Kit and cart upsell serum")
    if m.orders_24h == 0:
        actions.append("Zero orders in 24h → verify checkout, payment methods, and top PDP links")
    return actions


def apply_trust_tags_if_needed(m: Metrics) -> None:
    if m.cvr and m.cvr >= TARGET_CVR:
        return
    log.info("[trust] Would inject urgency/trust tags on key PDPs (DRY_RUN=%s)", DRY_RUN)
    if DRY_RUN:
        return
    # Example: add a tag to a known product — expand carefully
    # mutation tagsAdd(id: ..., tags: ["trust-60day", "urgency-low-stock"])


def draft_oos_skus(skus: List[str]) -> None:
    if not skus:
        return
    log.info("[inventory] OOS SKUs to draft: %s (DRY_RUN=%s)", skus, DRY_RUN)
    if DRY_RUN:
        return
    # Implement productUpdate status DRAFT via GraphQL for safety


def run() -> Dict[str, Any]:
    if not SHOP or not TOKEN:
        return {"ok": False, "error": "missing Shopify credentials"}
    m = fetch_order_metrics()
    recs = recommend(m)
    for line in recs:
        log.info(line)
    apply_trust_tags_if_needed(m)
    return {
        "ok": True,
        "metrics": m.__dict__,
        "recommendations": recs,
        "dry_run": DRY_RUN,
        "target_daily": TARGET_DAILY,
    }


if __name__ == "__main__":
    print(run())
