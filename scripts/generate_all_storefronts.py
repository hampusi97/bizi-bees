#!/usr/bin/env python3
"""
Batch Storefront Generator using Google AI Studio
Repo: bizi-bees / scripts/generate_all_storefronts.py
Generates full-fidelity Shopify OS 2.0 storefront sections for all 14 stores.
"""

import os
import sys
import json
import time

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    sys.exit(1)

def load_keys():
    keys = []
    # From environment
    k1 = os.getenv("GEMINI_API_KEY")
    k2 = os.getenv("GEMINI_API_KEY_SECONDARY")
    if k1: keys.append(k1)
    if k2: keys.append(k2)

    # From .env.local
    env_local = ".env.local"
    if os.path.exists(env_local):
        with open(env_local, "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"')
                    if val and val not in keys: keys.append(val)
                elif line.startswith("GEMINI_API_KEY_SECONDARY="):
                    val = line.split("=", 1)[1].strip().strip('"')
                    if val and val not in keys: keys.append(val)
    return keys

def generate_storefront_section(store, api_keys):
    store_id = store["store_id"]
    name = store["name"]
    niche = store["niche"]
    hero = store["hero"]
    price = store["price"]
    bundle_price = store["bundle_price"]
    free_gift = store["free_gift"]
    theme_bg = store["theme_bg"]
    theme_text = store["theme_text"]
    theme_accent = store["theme_accent"]
    font_style = store.get("font_style", "Georgia, serif")

    system_instruction = f"""You are a Principal Shopify OS 2.0 Theme Architect and DTC Conversion Rate Optimization (CRO) Lead.
Your goal is to build a complete, production-ready, beautiful Shopify Liquid storefront section for the brand "{name}".
Brand Specifications:
- Store ID: "{store_id}"
- Niche: "{niche}"
- Hero Product: "{hero}"
- Solo Price: "${price}"
- VIP Bundle Price: "${bundle_price}"
- Free Gift with Bundle: "{free_gift}"
- Color Palette: Background {theme_bg}, Text {theme_text}, Accent {theme_accent}
- Typography: "{font_style}"

REQUIREMENTS FOR THE STOREFRONT COMPONENT:
1. Complete semantic HTML, inline CSS with responsive grid, and vanilla JavaScript micro-interactions.
2. Section includes:
   - Sticky conversion banner with dynamic free shipping / dispatch notification
   - Hero banner with high-converting headline, subhead, and social proof rating
   - Interactive 2-Tier Selector (Solo ${price} vs VIP Bundle ${bundle_price})
   - Free Gift Unlocked notification for "{free_gift}"
   - 3-Pillar Guarantee strip (Utah Dispatch, 60-Day Trial, Free US Delivery)
   - 1-Click Buy button wired to /collections/all
3. Valid Shopify OS 2.0 {{% schema %}} block at the bottom with name and presets.
4. Output ONLY the raw Liquid code inside a single ```liquid ... ``` code block with zero markdown preamble."""

    prompt = f"Generate the complete Shopify Liquid storefront section for \"{name}\" ({hero})."

    models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"]

    for k_idx, key in enumerate(api_keys, 1):
        for m in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "systemInstruction": {"parts": [{"text": system_instruction}]},
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2500,
                    "thinkingConfig": {"thinkingBudget": 0}
                }
            }
            try:
                res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
                if res.status_code == 200:
                    data = res.json()
                    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    text = "".join([p.get("text", "") for p in parts if not p.get("thought")]) or parts[0].get("text", "")
                    
                    # Extract code block
                    import re
                    code_match = re.search(r"```(?:liquid)?([\s\S]*?)```", text, re.IGNORECASE)
                    liquid = code_match.group(1).strip() if code_match else text.strip()
                    
                    return liquid, m, k_idx
                elif res.status_code == 429:
                    break # Try next key
            except Exception as e:
                continue

    return None, None, None

def main():
    print("=" * 70)
    print("🎨 GOOGLE AI STUDIO: 14-STORE STOREFRONT GENERATOR")
    print("=" * 70)

    keys = load_keys()
    if not keys:
        print("❌ No Gemini API keys found!")
        sys.exit(1)
    print(f"✓ Loaded {len(keys)} Google AI Studio API Key(s)")

    matrix_file = "config/store_matrix.json"
    with open(matrix_file, "r") as f:
        fleet = json.load(f)

    os.makedirs("sections", exist_ok=True)
    success_count = 0

    for idx, store in enumerate(fleet, 1):
        sid = store["store_id"]
        name = store["name"]
        outfile = f"sections/storefront-{sid}.liquid"
        
        print(f"\n[{idx:02d}/14] Generating AI Storefront for {name} ({sid})...")
        liquid_code, model, key_idx = generate_storefront_section(store, keys)
        
        if liquid_code and len(liquid_code) > 200:
            with open(outfile, "w", encoding="utf-8") as f:
                f.write(liquid_code)
            size = len(liquid_code)
            print(f"  ✓ Saved {outfile} ({size:,} bytes) using {model} (Key #{key_idx})")
            success_count += 1
        else:
            print(f"  ⚠️ Warning: Generation failed or empty for {sid}, using fallback template.")
            fallback = f"""{{% comment %}} Storefront fallback for {name} {{% endcomment %}}
<div style="background: {store['theme_bg']}; color: {store['theme_text']}; padding: 60px 20px; text-align: center; font-family: {store.get('font_style', 'sans-serif')};">
  <h2>{name}</h2>
  <p>{store['hero']} — ${store['bundle_price']}</p>
  <a href="/collections/all" style="background: {store['theme_accent']}; color: #FFF; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Claim VIP Bundle →</a>
</div>
{{% schema %}}
{{ "name": "{name} Storefront", "settings": [], "presets": [{{ "name": "{name} Storefront" }}] }}
{{% endschema %}}"""
            with open(outfile, "w", encoding="utf-8") as f:
                f.write(fallback)
            success_count += 1

    print("\n" + "=" * 70)
    print(f"🎉 COMPLETED: {success_count}/14 Storefronts Generated and Saved!")
    print("=" * 70)

if __name__ == "__main__":
    main()
