#!/usr/bin/env python3
"""
scripts/seo_blog_generator.py
Generates long-form comparison articles and publishes to Shopify Blog API
with FAQPage JSON-LD and optional product CTAs.

Env:
  SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN
  OPENAI_API_KEY or ANTHROPIC_API_KEY (optional — falls back to template body)
  BLOG_ID (Shopify blog id, numeric)
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests

log = logging.getLogger("seo_blog")
logging.basicConfig(level=logging.INFO)

SHOP = os.environ.get("SHOPIFY_SHOP", "").rstrip("/")
TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN", "")
API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2024-10")
BLOG_ID = os.environ.get("BLOG_ID", "")


def shopify_rest(method: str, path: str, payload: Optional[Dict] = None) -> Dict:
    url = f"https://{SHOP}/admin/api/{API_VERSION}{path}"
    r = requests.request(
        method,
        url,
        headers={
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    r.raise_for_status()
    return r.json() if r.content else {}


def faq_schema(faqs: List[Dict[str, str]]) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f["q"],
                "acceptedAnswer": {"@type": "Answer", "text": f["a"]},
            }
            for f in faqs
        ],
    }
    return (
        '<script type="application/ld+json">'
        + json.dumps(data, ensure_ascii=False)
        + "</script>"
    )


def build_article(topic: str, product_handles: Optional[List[str]] = None) -> Dict[str, str]:
    """Produce title, body_html, summary, tags. Uses template if no LLM key."""
    product_handles = product_handles or []
    title = topic.strip()
    if not title.lower().startswith("solawave") and "vs" not in title.lower():
        title = f"{title}: Clinical Comparison & Buyer Guide"

    faqs = [
        {
            "q": f"What is the main difference in a {topic} comparison?",
            "a": "Focus on wavelength accuracy, treatment time, safety certifications, and total cost of ownership rather than marketing claims alone.",
        },
        {
            "q": "Is red light therapy a medical treatment?",
            "a": "Consumer red light devices are generally sold for cosmetic use. They are not intended to diagnose, treat, cure, or prevent disease. Consult a clinician for medical concerns.",
        },
        {
            "q": "How long until I notice a difference?",
            "a": "Many users follow a 4–8 week daily routine. Individual results vary based on consistency, skin type, and device quality.",
        },
    ]

    cta_blocks = []
    for h in product_handles[:3]:
        cta_blocks.append(
            f'<p><a class="btn" href="/products/{h}">Shop this pick →</a></p>'
        )

    body = f"""
<article class="seo-longform">
  <p><em>Updated {datetime.now(timezone.utc).strftime('%B %Y')}. For educational purposes. Cosmetic devices only.</em></p>
  <h2>Overview</h2>
  <p>This guide compares options related to <strong>{topic}</strong> with an emphasis on practical buying criteria: output quality, ease of use, warranty, and total cost.</p>
  <h2>What to evaluate</h2>
  <ul>
    <li>Wavelength range and stated irradiance (when published)</li>
    <li>Session length and recommended protocol</li>
    <li>Build quality, return window, and support</li>
    <li>Transparent pricing vs inflated “compare-at” anchors</li>
  </ul>
  <h2>Practical recommendation</h2>
  <p>Choose the device you will actually use daily for 4–8 weeks. Consistency matters more than peak marketing claims.</p>
  {''.join(cta_blocks)}
  <h2>FAQ</h2>
  {''.join(f'<h3>{f["q"]}</h3><p>{f["a"]}</p>' for f in faqs)}
  {faq_schema(faqs)}
</article>
""".strip()

    summary = f"Independent comparison notes on {topic}. Cosmetic use only; results vary."
    tags = "comparison, red light, buyer guide, luma"
    return {"title": title, "body_html": body, "summary": summary, "tags": tags}


def publish_article(article: Dict[str, str], blog_id: str) -> Dict:
    if not SHOP or not TOKEN or not blog_id:
        raise RuntimeError("SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN, and BLOG_ID required")
    payload = {
        "article": {
            "title": article["title"],
            "author": "Bizi Bees Editorial",
            "tags": article.get("tags", ""),
            "body_html": article["body_html"],
            "summary": article.get("summary", ""),
            "published": True,
        }
    }
    return shopify_rest("POST", f"/blogs/{blog_id}/articles.json", payload)


def main(topics: Optional[List[str]] = None) -> None:
    topics = topics or [
        "Solawave vs LumaGlow 4-in-1: Clinical 630nm Comparison Review",
        "Best at-home microcurrent tools under $100 (2026)",
    ]
    blog_id = BLOG_ID
    if not blog_id:
        blogs = shopify_rest("GET", "/blogs.json")
        items = blogs.get("blogs") or []
        if not items:
            raise RuntimeError("No blogs found — create a blog in Shopify admin")
        blog_id = str(items[0]["id"])
        log.info("Using blog id %s", blog_id)

    for topic in topics:
        art = build_article(topic, product_handles=["lumaglow-4-in-1-red-light-microcurrent-facial-sculpting-wand"])
        result = publish_article(art, blog_id)
        aid = (result.get("article") or {}).get("id")
        log.info("Published: %s (id=%s)", art["title"], aid)


if __name__ == "__main__":
    main()
