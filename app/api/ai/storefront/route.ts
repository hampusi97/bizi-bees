import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getStoreContext(storeId: string) {
  try {
    const matrixPath = path.join(process.cwd(), "config", "store_matrix.json");
    if (fs.existsSync(matrixPath)) {
      const stores = JSON.parse(fs.readFileSync(matrixPath, "utf-8"));
      return stores.find((s: any) => s.store_id === storeId) || stores[0];
    }
  } catch (e) {
    console.error("Error reading store matrix:", e);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { storeId = "bizi-bees", saveToFile = false } = await request.json();

    const store = getStoreContext(storeId);
    if (!store) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_SECONDARY,
      ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(",") : [])
    ];
    const availableKeys = Array.from(new Set(rawKeys.filter(Boolean))) as string[];

    const filename = `storefront-${store.store_id}.liquid`;
    const filePath = path.join(process.cwd(), "sections", filename);
    const existingLiquid = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf-8")
      : `<!-- ${store.name} Storefront Section -->\n<section class="storefront-${store.store_id}" style="padding: 3rem 1.5rem;">\n  <h1>${store.name} — ${store.hero}</h1>\n  <p>Solo: $${store.price} | VIP Bundle: $${store.bundle_price} (+ Free ${store.free_gift})</p>\n</section>`;

    if (availableKeys.length === 0) {
      return NextResponse.json({
        success: true,
        storeId: store.store_id,
        storeName: store.name,
        model: "built-in-theme-engine",
        keyIndex: 1,
        savedPath: `sections/${filename}`,
        liquid: existingLiquid,
        liquidCode: existingLiquid,
        size: Buffer.byteLength(existingLiquid, "utf-8"),
      });
    }

    const systemInstruction = `You are a Principal Shopify OS 2.0 Theme Architect and DTC Conversion Rate Optimization (CRO) Lead.
Your goal is to build a complete, production-ready, beautiful Shopify Liquid storefront section for the brand "${store.name}".
Brand Specifications:
- Store ID: "${store.store_id}"
- Niche: "${store.niche}"
- Hero Product: "${store.hero}"
- Solo Price: "$${store.price}"
- VIP Bundle Price: "$${store.bundle_price}"
- Free Gift with Bundle: "${store.free_gift}"
- Color Palette: Background ${store.theme_bg}, Text ${store.theme_text}, Accent ${store.theme_accent}
- Typography: "${store.font_style}"

REQUIREMENTS FOR THE STOREFRONT COMPONENT:
1. Complete semantic HTML, inline CSS with responsive grid, and vanilla JavaScript micro-interactions.
2. Section includes:
   - Sticky conversion banner with dynamic free shipping / dispatch notification
   - Hero banner with high-converting headline, subhead, and social proof rating
   - Interactive 2-Tier Selector (Solo $${store.price} vs VIP Bundle $${store.bundle_price})
   - Free Gift Unlocked notification for "${store.free_gift}"
   - 3-Pillar Guarantee strip (Utah Dispatch, 60-Day Trial, Free US Delivery)
   - 1-Click Buy button wired to /collections/all
3. Valid Shopify OS 2.0 {% schema %} block at the bottom with name and presets.
4. Output ONLY the raw Liquid code inside a single \`\`\`liquid ... \`\`\` code block with zero markdown preamble.`;

    const prompt = `Generate the complete Shopify Liquid storefront section for "${store.name}".`;

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-1.5-pro"
    ];
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

            // Extract code if wrapped in markdown
            const codeMatch = text.match(/```(?:liquid)?([\s\S]*?)```/i);
            const liquidCode = codeMatch ? codeMatch[1].trim() : text.trim();

            let savedPath = null;
            if (saveToFile) {
              fs.writeFileSync(filePath, liquidCode, "utf-8");
              savedPath = `sections/${filename}`;
            }

            return NextResponse.json({
              success: true,
              storeId: store.store_id,
              storeName: store.name,
              model: m,
              keyIndex: kIdx + 1,
              savedPath,
              liquid: liquidCode,
              liquidCode,
              size: Buffer.byteLength(liquidCode, "utf-8"),
            });
          } else {
            lastError = data.error || { message: "Storefront generation failed" };
            if (data.error?.code === 429) {
              break;
            }
            continue;
          }
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    return NextResponse.json({
      success: true,
      storeId: store.store_id,
      storeName: store.name,
      model: "built-in-theme-engine",
      keyIndex: 1,
      savedPath: `sections/${filename}`,
      liquid: existingLiquid,
      liquidCode: existingLiquid,
      size: Buffer.byteLength(existingLiquid, "utf-8"),
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || "bizi-bees";
    const filename = `storefront-${storeId}.liquid`;
    const filePath = path.join(process.cwd(), "sections", filename);

    if (fs.existsSync(filePath)) {
      const code = fs.readFileSync(filePath, "utf-8");
      return NextResponse.json({
        success: true,
        storeId,
        filename,
        code,
        size: Buffer.byteLength(code, "utf-8"),
      });
    }

    return NextResponse.json({
      success: false,
      storeId,
      filename,
      error: "File not found",
    }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
