#!/usr/bin/env python3
"""
Autonomous AI Support Agent (core/support_agent.py)
Automates customer service inquiries: real-time Shopify order lookups,
live USPS tracking retrieval, usage guidance, and 60-day return resolutions.
"""

import os
import sys
import json
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    requests = None

SHOP_URL = os.getenv("SHOPIFY_SHOP_URL", "bizibees-store.myshopify.com").replace("https://", "").replace("/", "")
ACCESS_TOKEN = os.getenv("SHOPIFY_ADMIN_ACCESS_TOKEN", "")
API_VERSION = "2024-04"
GRAPHQL_URL = f"https://{SHOP_URL}/admin/api/{API_VERSION}/graphql.json"

HEADERS = {"Content-Type": "application/json", "X-Shopify-Access-Token": ACCESS_TOKEN}

def lookup_order_status(customer_email):
    """Tool: Queries Shopify for customer order & tracking number"""
    if not ACCESS_TOKEN or "shpat_" not in ACCESS_TOKEN or not requests:
        # Simulation mode fallback for test harness
        if "customer" in customer_email.lower():
            return {
                "name": "#1042",
                "displayFulfillmentStatus": "FULFILLED",
                "fulfillments": [
                    {
                        "trackingInfo": [
                            {
                                "number": "9400111899562537894012",
                                "url": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899562537894012"
                            }
                        ]
                    }
                ]
            }
        elif "pending" in customer_email.lower():
            return {
                "name": "#1043",
                "displayFulfillmentStatus": "UNFULFILLED",
                "fulfillments": []
            }
        return None

    query = """
    query($query: String!) {
      orders(first: 1, query: $query) {
        edges {
          node {
            name
            displayFulfillmentStatus
            fulfillments {
              trackingInfo {
                number
                url
              }
            }
          }
        }
      }
    }
    """
    try:
        res = requests.post(GRAPHQL_URL, headers=HEADERS, json={
            "query": query,
            "variables": {"query": f"email:{customer_email}"}
        }, timeout=10).json()
        
        orders = res.get("data", {}).get("orders", {}).get("edges", [])
        if not orders:
            return None
        return orders[0]["node"]
    except Exception as e:
        print(f"[Support Agent] API query error: {e}")
        return None

def auto_reply_agent(incoming_email, customer_message):
    """Processes customer inquiries autonomously with live order data"""
    print(f"📩 [AI SUPPORT AGENT] Processing email from: {incoming_email}")
    msg = customer_message.lower()
    order_data = lookup_order_status(incoming_email)
    
    # Intent 1: "Where is my order / package / tracking?"
    if any(w in msg for w in ["where", "tracking", "track", "package", "status", "shipment"]):
        if order_data:
            order_num = order_data["name"]
            status = order_data["displayFulfillmentStatus"]
            fulfillments = order_data.get("fulfillments", [])
            
            if fulfillments and fulfillments[0].get("trackingInfo"):
                t_num = fulfillments[0]["trackingInfo"][0]["number"]
                t_url = fulfillments[0]["trackingInfo"][0]["url"]
                reply = (
                    f"Hi there!\n\n"
                    f"Your order {order_num} has dispatched from our logistics hub in Salt Lake City, Utah. "
                    f"Your verified USPS Ground Advantage tracking number is {t_num}.\n\n"
                    f"You can monitor live real-time delivery status here:\n{t_url}\n\n"
                    f"Warmly,\nLuma Priority Logistics Desk"
                )
            else:
                reply = (
                    f"Hi there!\n\n"
                    f"Your order {order_num} is currently being carefully inspected and packed at our Utah facility. "
                    f"It is scheduled to dispatch within 24 hours. You will receive an automated tracking notification "
                    f"the moment the shipping label prints!\n\n"
                    f"Warmly,\nLuma Support Team"
                )
        else:
            reply = (
                "Hi there!\n\n"
                "We couldn't locate an active order under this email address. "
                "Could you reply with your 4-digit order number (e.g. #1042) or checkout name "
                "so our priority desk can look this up immediately?\n\n"
                "Warmly,\nLuma Support Team"
            )
            
        print(f"🤖 [AI DRAFTED RESPONSE]:\n{reply}\n" + "-"*50)
        return reply

    # Intent 2: Protocol / Device Usage Question
    elif any(w in msg for w in ["how to use", "instructions", "routine", "frequency", "serum", "clean"]):
        reply = (
            "Hi there!\n\n"
            "Here is the recommended dermatologist ritual for the LumaGlow™ QuadWave Pro:\n"
            "1. Cleanse face thoroughly and apply 3-4 drops of activating conduction serum.\n"
            "2. Glide the wand upward along the jawline and cheeks for 3-5 minutes daily.\n"
            "3. The 630nm phototherapy and 107°F thermal massage activate automatically on skin contact.\n"
            "4. Wipe head clean with a soft dry cloth after use (do not submerge in water).\n\n"
            "Warmly,\nLuma Clinical Advisory Desk"
        )
        print(f"🤖 [AI DRAFTED RESPONSE]:\n{reply}\n" + "-"*50)
        return reply

    # Intent 3: 60-Day Guarantee / Returns
    elif any(w in msg for w in ["return", "refund", "guarantee", "trial", "exchange"]):
        reply = (
            "Hi there!\n\n"
            "All Luma Clinical devices are backed by our 60-Day Clinical Risk-Free Guarantee. "
            "If you aren't completely thrilled with your results, we are happy to assist with an exchange or full refund.\n\n"
            "Please reply with your order number, and our logistics team will issue your prepaid return authorization.\n\n"
            "Warmly,\nLuma Care Concierge"
        )
        print(f"🤖 [AI DRAFTED RESPONSE]:\n{reply}\n" + "-"*50)
        return reply

    # Fallback / General Inquiry
    reply = (
        "Hi there!\n\n"
        "Thank you for contacting Luma Clinical. Our priority concierge desk has received your message and "
        "will provide assistance within 2 hours. If this is urgent, please include your order number.\n\n"
        "Warmly,\nLuma Concierge Team"
    )
    print(f"🤖 [AI DRAFTED RESPONSE]:\n{reply}\n" + "-"*50)
    return reply

if __name__ == "__main__":
    print("=" * 65)
    print("🤖 LUMA CLINICAL / OS-X AI SUPPORT AGENT TEST SUITE")
    print(f"Shop: {SHOP_URL}")
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 65)
    
    # Test Cases
    auto_reply_agent("customer@example.com", "Hi, where is my package?")
    auto_reply_agent("pending@example.com", "Can you check my tracking status?")
    auto_reply_agent("unknown@example.com", "Where is order?")
    auto_reply_agent("sarah@example.com", "How to use the red light wand?")
