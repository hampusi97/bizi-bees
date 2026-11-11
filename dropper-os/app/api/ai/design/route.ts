import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const {
      storeId,
      storeName,
      niche,
      designGoal = "Hero Banner & Value Props",
      aesthetic = "Luxury DTC with warm linen/honey accents and micro-interactions"
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

    if (availableKeys.length === 0) {
      return NextResponse.json({ success: false, error: "No GEMINI_API_KEY configured" }, { status: 500 });
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

    const modelsToTry = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"];
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
              systemInstruction: { parts: [{ text: systemInstruction }] }
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
            // If 429 quota exhausted on this key, break to next key
            if (data.error?.code === 429) {
              break;
            }
            // If 503 high demand or model error, continue to next model in loop
            continue;
          }
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: lastError?.message || "All Gemini API models and keys temporarily busy. Please retry in a few moments."
    }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
