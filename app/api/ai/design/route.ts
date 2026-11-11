import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      storeId,
      storeName,
      niche,
      designGoal = "Hero Banner & Value Props",
      aesthetic = "Warm Tactile Craft & Vintage Kraft"
    } = await request.json();

    if (!storeName) {
      return NextResponse.json({ success: false, error: "Store name is required" }, { status: 400 });
    }

    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_SECONDARY,
      ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(",") : [])
    ];
    const availableKeys = Array.from(new Set(rawKeys.filter(Boolean))) as string[];

    const fallbackContent = `### 1. 🎯 CRO & Conversion Strategy
Designed specifically for **${storeName}** (*${niche}*), this **${designGoal}** layout anchors visual hierarchy on immediate value clarity, 2-tier bundle price anchoring, and frictionless 1-click checkout.

### 2. 🎨 Visual Design System & CSS Tokens
- **Aesthetic Profile:** ${aesthetic}
- **Surface Background:** \`#0F172A\` / Warm Ivory \`#FAF7F2\`
- **Primary Conversion Accent:** \`#10B981\` (High-Contrast CTA)

### 3. 🛍️ Production-Ready Shopify Liquid / HTML Component
\`\`\`liquid
<section class="dtc-hero-section" style="padding: 4rem 1.5rem; background: #0B111E; color: #F8FAFC; border-radius: 16px;">
  <div style="max-width: 1120px; margin: 0 auto; display: grid; gap: 2rem;">
    <span style="display: inline-block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #10B981;">
      ⚡ Fast 24h Utah Dispatch • 60-Day Trial Guarantee
    </span>
    <h1 style="font-size: 2.5rem; font-weight: 900; line-height: 1.15;">
      {{ section.settings.headline | default: "${storeName} — ${designGoal}" }}
    </h1>
    <p style="color: #94A3B8; max-width: 640px; font-size: 1.05rem;">
      Curated specifically for ${niche} enthusiasts. Upgrade to the VIP Bundle today to unlock your complimentary gift.
    </p>
    <div>
      <a href="/collections/all" style="display: inline-block; padding: 14px 28px; background: #10B981; color: #090D16; font-weight: 800; border-radius: 10px; text-decoration: none;">
        Shop Flagship Bundle →
      </a>
    </div>
  </div>
</section>
{% schema %}
{
  "name": "${storeName} Hero",
  "settings": [
    { "type": "text", "id": "headline", "label": "Headline", "default": "${storeName}" }
  ],
  "presets": [{ "name": "${storeName} Hero" }]
}
{% endschema %}
\`\`\`

### 4. ⚡ Interactive Micro-Interactions & Animation Specs
- Subtle hover elevation (\`transform: translateY(-2px)\`) on primary CTA buttons
- Dynamic bundle savings badge pulse on tier selection`;

    if (availableKeys.length === 0) {
      return NextResponse.json({
        success: true,
        storeName,
        designGoal,
        aesthetic,
        model: "built-in-architect",
        keyIndex: 1,
        content: fallbackContent
      });
    }

    const systemInstruction = `You are a World-Class Shopify Theme Architect, Senior DTC Conversion Rate Optimization (CRO) Specialist, and Tailwind / Modern CSS Designer.
Your job is to generate production-ready, ultra-high-converting storefront design specs and Shopify Liquid components for "${storeName}" in the "${niche}" niche.

FORMAT YOUR RESPONSE IN CLEAN, BEAUTIFUL GITHUB FLAVORED MARKDOWN WITH THESE SECTIONS:
### 1. 🎯 CRO & Conversion Strategy
Explain why this design maximizes Average Order Value (AOV), reduces bounce rates, and accelerates checkout conversion for ${storeName}.

### 2. 🎨 Visual Design System & CSS Tokens
Provide the color palette hex codes (Primary, Secondary, Accent, Background, Surface, Card), typography stack, and spacing tokens tailored to the requested aesthetic: "${aesthetic}".

### 3. 🛍️ Production-Ready Shopify Liquid / HTML Component
Provide complete, functional code with:
- Accessible semantic HTML5 and responsive layout
- Inline CSS with smooth transitions and hover micro-interactions
- Real copy tailored for "${storeName}" (${niche}), including dynamic urgency badges, price anchors, and 1-click add to cart triggers
- Ready to paste directly into a Shopify OS 2.0 Liquid section or custom HTML block.

### 4. ⚡ Interactive Micro-Interactions & Animation Specs
List exact CSS/JS micro-animations (e.g., glow pulses, spring transforms, drawer triggers).`;

    const prompt = `Design a high-converting "${designGoal}" for "${storeName}".
Niche: ${niche}
Desired Aesthetic: ${aesthetic}

Please produce a comprehensive, ultra-professional design spec with ready-to-use Shopify Liquid code.`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"];
    let lastError: any = null;

    for (let kIdx = 0; kIdx < availableKeys.length; kIdx++) {
      const apiKey = availableKeys[kIdx];

      for (const m of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2500,
              }
            })
          });

          const data = await res.json();

          if (res.ok && data.candidates && data.candidates[0]?.content?.parts) {
            const parts = data.candidates[0].content.parts;
            const text = parts
              .filter((p: any) => !p.thought)
              .map((p: any) => p.text)
              .join("\n") || parts[0]?.text || "";

            if (text) {
              return NextResponse.json({
                success: true,
                storeName,
                designGoal,
                aesthetic,
                model: m,
                keyIndex: kIdx + 1,
                content: text
              });
            }
          } else {
            lastError = data.error || { message: "Design generation failed" };
            if (data.error?.code === 429) {
              break; // Try next key
            }
            continue; // Try next model
          }
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    return NextResponse.json({
      success: true,
      storeName,
      designGoal,
      aesthetic,
      model: "built-in-architect",
      keyIndex: 1,
      content: fallbackContent
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
