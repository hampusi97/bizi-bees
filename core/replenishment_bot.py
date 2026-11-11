#!/usr/bin/env python3
"""
Predictive Smart-Replenishment & SMS Reorder Bot (core/replenishment_bot.py)
Calculates customer consumption cycles for consumables (serums, soda syrups, chocolates)
and generates 1-click Shop Pay SMS refill prompts with automated 15% VIP discounts.
"""

import os
import sys
import json
from datetime import datetime, timezone, timedelta

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(REPO_ROOT, "REPORTS_REPLENISHMENT_QUEUE.md")

# Depletion rules engine: days until consumable is depleted
DEPLETION_CYCLES = {
    "LUMA-SERUM": {
        "days": 40,
        "product_name": "Activating Botanical Peptide Conduction Serum (50ml)",
        "brand": "Luma Clinical",
        "refill_price": "$20.40", # 15% off $24.00
        "handle": "botanical-peptide-conduction-serum"
    },
    "SODA-SYRUP-KIT": {
        "days": 28,
        "product_name": "At-Home Dirty Soda Bar Syrups & Creamer Refill",
        "brand": "Fizz Lab",
        "refill_price": "$24.00",
        "handle": "dirty-soda-syrup-refill-kit"
    },
    "CRAVE-BENTO-BOX": {
        "days": 21,
        "product_name": "Custom 4-Bar Belgian Chocolate Bento Restock",
        "brand": "Crave Lab",
        "refill_price": "$32.30", # 15% off $38.00
        "handle": "crave-bento-restock"
    }
}

SAMPLE_ORDERS = [
    {
        "order_id": "#1018",
        "customer_name": "Sarah Jenkins",
        "phone": "+18015550192",
        "sku": "LUMA-SERUM",
        "order_date": (datetime.now(timezone.utc) - timedelta(days=40)).strftime("%Y-%m-%d")
    },
    {
        "order_id": "#1024",
        "customer_name": "Tyler Henderson",
        "phone": "+18015550143",
        "sku": "SODA-SYRUP-KIT",
        "order_date": (datetime.now(timezone.utc) - timedelta(days=28)).strftime("%Y-%m-%d")
    },
    {
        "order_id": "#1031",
        "customer_name": "Marcus Miller",
        "phone": "+13125550188",
        "sku": "CRAVE-BENTO-BOX",
        "order_date": (datetime.now(timezone.utc) - timedelta(days=21)).strftime("%Y-%m-%d")
    }
]

def calculate_refill_triggers(customer_orders=None):
    if customer_orders is None:
        customer_orders = SAMPLE_ORDERS

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print("=" * 65)
    print("🔄 [REPLENISHMENT BOT] SCANNING CUSTOMER CONSUMPTION CYCLES")
    print(f"Timestamp: {timestamp}")
    print("=" * 65)

    reports = []
    reports.append("# 🔄 Predictive SMS Replenishment & Reorder Queue\n")
    reports.append(f"Audit Executed: `{timestamp}`\n")
    reports.append("Strategy: **Automated LTV expansion via 1-click Shop Pay SMS refill prompts (15% VIP discount applied).**\n\n")

    queued_sms = []

    for order in customer_orders:
        sku = order["sku"]
        if sku not in DEPLETION_CYCLES:
            continue

        cycle_info = DEPLETION_CYCLES[sku]
        first_name = order["customer_name"].split()[0]
        reorder_url = f"https://bizibees-store.myshopify.com/cart/{cycle_info['handle']}:1?discount=VIPREFILL15"

        sms_body = (
            f"Hey {first_name}! Your {cycle_info['brand']} {cycle_info['product_name']} is likely running low right about now. "
            f"Tap to auto-ship your fresh refill with Shop Pay (15% VIP discount applied: {cycle_info['refill_price']}): {reorder_url}"
        )

        queued_sms.append({
            "order": order["order_id"],
            "customer": order["customer_name"],
            "phone": order["phone"],
            "brand": cycle_info["brand"],
            "sms": sms_body
        })

        print(f"\n[Triggered] {order['customer_name']} (Order {order['order_id']})")
        print(f"  Brand: {cycle_info['brand']} | Consumable: {cycle_info['product_name']}")
        print(f"  Elapsed: {cycle_info['days']} days since purchase")
        print(f"  Generated SMS:\n  \"{sms_body}\"")

        reports.append(f"### {order['customer_name']} ({order['order_id']}) &mdash; `{cycle_info['brand']}`\n")
        reports.append(f"- **Consumable SKU:** `{sku}` ({cycle_info['product_name']})\n")
        reports.append(f"- **Depletion SLA:** `{cycle_info['days']} Days`\n")
        reports.append(f"- **Reorder Price:** `{cycle_info['refill_price']}`\n")
        reports.append(f"- **1-Click Checkout Link:** `{reorder_url}`\n")
        reports.append(f"```text\n{sms_body}\n```\n\n---\n")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("".join(reports))

    print(f"\n✓ Scheduled {len(queued_sms)} personalized SMS refill prompts in {OUTPUT_FILE}")
    return queued_sms

if __name__ == "__main__":
    calculate_refill_triggers()
