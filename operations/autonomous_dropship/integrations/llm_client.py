"""
Unified LLM Client supporting Google Gemini API and OpenAI API.
Generates Shopify OS 2.0 copy, benefit bullets, FAQ accordions,
multi-channel taxonomy mapping, and the 3-Hook viral ad blueprint.
Includes a robust deterministic fallback generator for offline testing.
"""

import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from config.settings import Settings, get_settings

logger = logging.getLogger("LLMClient")


class LLMClient:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.gemini_key = self.settings.gemini_api_key
        self.openai_key = self.settings.openai_api_key
        self.provider = self.settings.primary_llm_provider

    async def generate_creative_bundle(
        self,
        product_title: str,
        category: str,
        pain_point: str,
        retail_price: float,
        compare_at_price: float,
        supplier_notes: str,
    ) -> Dict[str, Any]:
        """
        Generate complete creative assets, Shopify OS 2.0 HTML, taxonomy, and 3-hook ad scripts.
        """
        # Attempt Gemini if configured
        if self.provider == "gemini" and self.gemini_key and not self.gemini_key.startswith("AIzaSyxxxx"):
            try:
                res = await self._generate_with_gemini(
                    product_title, category, pain_point, retail_price, compare_at_price, supplier_notes
                )
                if res:
                    return res
            except Exception as e:
                logger.warning("Gemini generation failed, falling back: %s", e)

        # Attempt OpenAI if configured
        if self.openai_key and not self.openai_key.startswith("sk-proj-xxxx"):
            try:
                res = await self._generate_with_openai(
                    product_title, category, pain_point, retail_price, compare_at_price, supplier_notes
                )
                if res:
                    return res
            except Exception as e:
                logger.warning("OpenAI generation failed, falling back: %s", e)

        # Fallback to deterministic high-converting template engine
        return self._generate_deterministic_bundle(
            product_title, category, pain_point, retail_price, compare_at_price, supplier_notes
        )

    async def _generate_with_gemini(
        self,
        product_title: str,
        category: str,
        pain_point: str,
        retail_price: float,
        compare_at_price: float,
        supplier_notes: str,
    ) -> Optional[Dict[str, Any]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        prompt = self._build_prompt(product_title, category, pain_point, retail_price, compare_at_price, supplier_notes)
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"},
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                raw_json = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(raw_json)
        return None

    async def _generate_with_openai(
        self,
        product_title: str,
        category: str,
        pain_point: str,
        retail_price: float,
        compare_at_price: float,
        supplier_notes: str,
    ) -> Optional[Dict[str, Any]]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
        prompt = self._build_prompt(product_title, category, pain_point, retail_price, compare_at_price, supplier_notes)
        
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a world-class direct response e-commerce copywriter. Output strictly valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4,
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                raw = res.json()["choices"][0]["message"]["content"]
                return json.loads(raw)
        return None

    def _build_prompt(
        self,
        product_title: str,
        category: str,
        pain_point: str,
        retail_price: float,
        compare_at_price: float,
        supplier_notes: str,
    ) -> str:
        return f"""
Analyze this e-commerce winning candidate:
Title: {product_title}
Category: {category}
Pain Point Solved: {pain_point}
Retail Price: ${retail_price:.2f} (Compare at: ${compare_at_price:.2f})
Supplier Details: {supplier_notes}

Generate a JSON object matching this schema:
{{
  "shopify_title": "Clean, punchy, high-converting product title (under 65 chars)",
  "shopify_description_html": "Full Shopify OS 2.0 formatted HTML: A compelling hook paragraph, 4-5 bullet points with emojis, a clean HTML specifications table, and a 3-question FAQ accordion using <details><summary> tags.",
  "google_product_category_id": "Numeric Google Product Category (GPC) ID (e.g. 569, 614, 2697)",
  "ebay_item_specifics": {{
     "Brand": "Bizibees Select",
     "MPN": "BZB-AUT-XXXX",
     "CategoryID": "12345",
     "Condition": "New"
  }},
  "tiktok_shop_taxonomy": "Category > Subcategory > Leaf Category",
  "hook_1_curiosity": "0-3s visual pattern interrupt script",
  "hook_2_price_disruption": "Competitor price disruption script ('Why pay $100+...')",
  "hook_3_problem_agitation": "Agitation of daily frustration script",
  "social_caption": "Captivating TikTok/Instagram caption",
  "hashtags": ["#TikTokMadeMeBuyIt", "#LifeHack", "#ViralFinds"]
}}
"""

    def _generate_deterministic_bundle(
        self,
        product_title: str,
        category: str,
        pain_point: str,
        retail_price: float,
        compare_at_price: float,
        supplier_notes: str,
    ) -> Dict[str, Any]:
        """
        High-converting deterministic generator ensuring flawless Shopify OS 2.0
        formatting and compliance even without live LLM credentials.
        """
        clean_title = product_title.replace("Smart", "").replace("Replica", "").strip()
        brand_name = "Bizibees Select"
        sku_code = f"BZB-{abs(hash(product_title)) % 10000:04d}"

        # Taxonomies and categories mapping
        if "posture" in pain_point or "neck" in clean_title.lower():
            gpc_id = "569" # Health & Beauty > Personal Care
            ebay_cat = "294" # Orthopedic Supports
            tt_tax = "Health & Personal Care > Medical & Physical Therapy > Posture & Neck Supports"
            hook1 = "👀 STOP SCROLLING: If your neck feels like it’s holding up a bowling ball right now, watch this 5-second stretch."
            hook2 = f"💡 Why spend $120+ on physical therapy visits when this ${retail_price:.2f} orthopedic cradle restores your posture in 8 minutes a day?"
            hook3 = "😫 Working at a desk all day is destroying your cervical curve. Here is the exact routine that fixes tech-neck instantly."
        elif "skin" in pain_point or "roller" in clean_title.lower() or "cryo" in clean_title.lower():
            gpc_id = "2697" # Health & Beauty > Personal Care > Skin Care Tools
            ebay_cat = "180927" # Skin Care Tools
            tt_tax = "Beauty & Personal Care > Skin Care Tools > Facial Rollers & Sculpting"
            hook1 = "❄️ The 10-second ice-sculpting trick top aesthetic dermatologists won't share for free."
            hook2 = f"💸 Stop buying $150 designer ice globes that break. This medical-grade stainless cryo-roller stays freezing cold for hours for only ${retail_price:.2f}."
            hook3 = "🥱 Waking up with bloated, puffy skin and dark morning bags? Glide this over your jawline and watch the puffiness disappear."
        elif "organization" in pain_point or "spice" in clean_title.lower():
            gpc_id = "614" # Home & Garden > Kitchen & Dining > Kitchen Organizers
            ebay_cat = "20638" # Kitchen Racks & Holders
            tt_tax = "Home & Kitchen > Storage & Organization > Racks & Holders"
            hook1 = "🤯 The 3-second pantry transformation that will make your kitchen look like a Pinterest board."
            hook2 = f"🏷️ Custom pantry organizers quote $200+. This 360° magnetic carousel gives you double the storage for just ${retail_price:.2f}."
            hook3 = "😤 Nothing is more annoying than knocking over 10 spice jars just to find the garlic powder. Spin this instead."
        elif "sleep" in pain_point or "mask" in clean_title.lower():
            gpc_id = "2847" # Health & Beauty > Personal Care > Sleeping Aids > Sleep Masks
            ebay_cat = "168864" # Sleep Masks & Eye Pillows
            tt_tax = "Health & Personal Care > Sleep & Wellness > Eye Masks"
            hook1 = "🌙 If you sleep with someone who snores or you can’t fall asleep in total silence, this will change your life."
            hook2 = f"🎧 Why wear uncomfortable $180 earbuds to bed that hurt your ears when this memory-foam blackout audio mask is only ${retail_price:.2f}?"
            hook3 = "😵 Tossing and turning because every sliver of morning light wakes you up at 5 AM? Experience true pitch-black sleep."
        else:
            gpc_id = "569"
            ebay_cat = "12345"
            tt_tax = "General Merchandise > Innovative Lifestyle Essentials"
            hook1 = "🔥 The viral home hack taking over our feeds this week."
            hook2 = f"💰 Don't overpay $80+ at big-box retailers. Grab the original direct for only ${retail_price:.2f}."
            hook3 = f"⚠️ Still struggling with {pain_point}? Here is the effortless fix everyone is raving about."

        # Shopify OS 2.0 HTML description with hero, benefit bullets, spec table, and FAQ accordion
        description_html = f"""
<div class="bizibees-product-container">
  <div class="product-hero-badge" style="background:#f4f6f8; padding:12px; border-radius:8px; margin-bottom:16px;">
    <p style="margin:0; font-weight:600; color:#1a1a1a;">✨ <strong>Trending Daily Find:</strong> Engineered for immediate relief and everyday convenience. Ships directly from verified US Domestic Warehouses in 3-7 business days.</p>
  </div>

  <p class="product-tagline" style="font-size:16px; line-height:1.6; color:#333;">
    Say goodbye to daily discomfort and frustrating compromises. The <strong>{clean_title}</strong> delivers professional-grade results from the comfort of your home. Designed with ergonomic precision and premium materials to solve {pain_point} once and for all.
  </p>

  <h3 style="margin-top:24px; color:#111; border-bottom:2px solid #eee; padding-bottom:8px;">🌟 Key Benefits & Highlights</h3>
  <ul style="list-style-type: none; padding-left: 0; line-height: 1.8;">
    <li>✅ <strong>Instant Visible Relief:</strong> Notice a measurable difference in under 5 minutes of regular daily use.</li>
    <li>⚡ <strong>Ergonomic & Portable:</strong> Engineered lightweight and ultra-durable for home, office, or travel.</li>
    <li>🛡️ <strong>Certified Non-Toxic Materials:</strong> 100% skin-safe, hypoallergenic, and built to withstand years of daily use.</li>
    <li>🇺🇸 <strong>Fast US Domestic Fulfillment:</strong> Dispatched within 24-48 hours from verified US distribution centers.</li>
  </ul>

  <h3 style="margin-top:24px; color:#111; border-bottom:2px solid #eee; padding-bottom:8px;">📋 Technical Specifications</h3>
  <table style="width:100%; border-collapse: collapse; margin-top:12px;">
    <tbody>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight:600;">Brand</td><td style="padding: 8px;">{brand_name}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight:600;">Model SKU</td><td style="padding: 8px;">{sku_code}</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight:600;">Primary Application</td><td style="padding: 8px;">Targeted {pain_point.capitalize()} Management</td></tr>
      <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight:600;">Origin & Shipping</td><td style="padding: 8px;">US Domestic Fulfillment (3-7 Day Delivery)</td></tr>
      <tr><td style="padding: 8px; font-weight:600;">Warranty</td><td style="padding: 8px;">30-Day Happiness Guarantee</td></tr>
    </tbody>
  </table>

  <h3 style="margin-top:24px; color:#111; border-bottom:2px solid #eee; padding-bottom:8px;">❓ Frequently Asked Questions</h3>
  
  <details style="background:#fafafa; border:1px solid #e0e0e0; border-radius:6px; padding:12px; margin-bottom:10px; cursor:pointer;">
    <summary style="font-weight:600; color:#222;">How soon will I receive my order?</summary>
    <p style="margin-top:8px; color:#555; font-size:14px;">Every unit is dispatched from our verified US domestic distribution centers within 24-48 hours. Estimated delivery window is 3 to 7 business days with end-to-end USPS/UPS tracking.</p>
  </details>

  <details style="background:#fafafa; border:1px solid #e0e0e0; border-radius:6px; padding:12px; margin-bottom:10px; cursor:pointer;">
    <summary style="font-weight:600; color:#222;">How do I use this for best results?</summary>
    <p style="margin-top:8px; color:#555; font-size:14px;">Incorporate into your daily morning or evening routine for just 5-10 minutes. Detailed instructions and best-practice care guides are included inside the package.</p>
  </details>

  <details style="background:#fafafa; border:1px solid #e0e0e0; border-radius:6px; padding:12px; margin-bottom:10px; cursor:pointer;">
    <summary style="font-weight:600; color:#222;">What if I am not satisfied?</summary>
    <p style="margin-top:8px; color:#555; font-size:14px;">We stand behind every item with our 30-Day Risk-Free Satisfaction Guarantee. If it doesn't solve your pain point, contact our support team for a hassle-free return or exchange.</p>
  </details>
</div>
"""

        caption = f"The life-hack you didn't know you needed ✨ Solves {pain_point} in minutes! US Domestic Shipping 🚚 Tap the link in bio to shop the limited-time drop! #BizibeesFinds"
        hashtags = [
            "#TikTokMadeMeBuyIt",
            "#ViralProducts",
            "#LifeHack",
            f"#{pain_point.replace(' ', '')}relief",
            "#ShopifyFinds",
            "#HomeHacks",
        ]

        return {
            "shopify_title": f"{clean_title} | Premium Ergonomic Edition",
            "shopify_description_html": description_html.strip(),
            "google_product_category_id": gpc_id,
            "ebay_item_specifics": {
                "Brand": brand_name,
                "MPN": sku_code,
                "CategoryID": ebay_cat,
                "Condition": "New with tags",
                "Country/Region of Manufacture": "United States",
            },
            "tiktok_shop_taxonomy": tt_tax,
            "hook_1_curiosity": hook1,
            "hook_2_price_disruption": hook2,
            "hook_3_problem_agitation": hook3,
            "social_caption": caption,
            "hashtags": hashtags,
        }
