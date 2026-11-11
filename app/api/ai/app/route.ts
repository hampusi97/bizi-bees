import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Store Matrix Helper to ground Gemini in exact brand facts
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
    const {
      storeId = "bizi-bees",
      query,
      appType = "consultant",
      userProfile = {}
    } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
    }

    const store = getStoreContext(storeId) || {
      store_id: storeId,
      name: "Bizi Bees Boutique",
      niche: "Curated Vintage & Cozy Gifts",
      hero: "Blind Date with a Book & Cozy Evening Crate",
      price: "14.99",
      bundle_price: "38.00",
      free_gift: "Solid Brass Honeybee Bookmark ($12 Value)",
      theme_accent: "#D9822B",
      theme_bg: "#FAF7F2",
      theme_text: "#29231E"
    };

    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_SECONDARY,
      ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(",") : [])
    ];
    const availableKeys = Array.from(new Set(rawKeys.filter(Boolean))) as string[];

    const fallbackResponse = `✨ **${store.name} Specialist Protocol**\n\n- **Tailored Recommendation:** Based on your request (*"${query}"*), we recommend starting with the flagship **${store.hero}** ($${store.price}).\n- **Pro Ritual & Protocol:** Pair your daily routine with the **VIP Bundle ($${store.bundle_price})** for maximum efficacy and sensory enjoyment.\n- **Complimentary Gift Unlocked:** Upgrading to the VIP Bundle automatically includes the **${store.free_gift}** at zero extra cost.\n- **Dispatch Status:** Ready for priority 24-hour dispatch from our Utah fulfillment hub with our 60-Day Trial Guarantee.`;

    if (availableKeys.length === 0) {
      return NextResponse.json({
        success: true,
        storeId: store.store_id,
        storeName: store.name,
        hero: store.hero,
        price: store.price,
        bundlePrice: store.bundle_price,
        freeGift: store.free_gift,
        accentColor: store.theme_accent || "#10B981",
        model: "built-in-specialist",
        keyIndex: 1,
        response: fallbackResponse
      });
    }

    const systemInstruction = `You are the specialized AI Storefront Application Engine for "${store.name}".
Niche: "${store.niche}".
Flagship Hero Product: "${store.hero}" (Solo: $${store.price}, VIP Bundle: $${store.bundle_price}).
Complimentary Gift Unlocked with Bundle: "${store.free_gift}".
Brand Aesthetics: Background ${store.theme_bg}, Accent ${store.theme_accent}, Typography ${store.font_style || "Editorial"}.

YOUR GOAL AS THIS STORE'S AI APPLICATION:
1. Provide deep, expert, delightful guidance tailored to this specific niche.
2. Act as the specialized assistant for this brand:
   - If Ember & Oak: Spanish Cedar Humidor & Aficionado Tasting Sommelier.
   - If Bizi Bees: Book Matchmaker & Cozy Ritual Concierge.
   - If Luma Clinical: Clinical Derm-Tech & Phototherapy Routine Architect.
   - If Luma Relief: Cold Compression Protocol & Acupressure Advisor.
   - If Fizz Lab: Dirty Soda Mixologist & Frothing Recipe Creator.
   - If Crave Lab: Belgian Chocolate Sommelier & Bento Box Curator.
   - If Aura Sculpt: Seamless Activewear Stylist & Fit Consultant.
   - If PawGlow: Pet Deshedding & Ultrasonic Coat Health Advisor.
   - If Zenith Sleep: Chronobiology & 3D Blackout Biohack Coach.
   - If Aura Posture: Spine Ergonomics & Haptic Feedback Specialist.
   - If LumiCarve: Micro-Engraving Speed, Feed & Bit Selector.
   - If Dermasonic: Ultrasonic Water-Ion Pore Extraction Specialist.
   - If CalmCore: Weighted Thermal Therapy & Acupressure Guide.
   - If FloraSpring: Terracotta Self-Watering Plant Care Doctor.
   - If VeloBrew: 20-Bar Portable Barista & Extraction Dial-In Pro.
3. Recommend the perfect ritual, recipe, or protocol based on user input.
4. Naturally anchor the VIP Bundle ($${store.bundle_price}) highlighting the unlocked free gift: "${store.free_gift}".
5. Keep your tone upscale, engaging, authoritative, and concise (under 180 words). Include bullet points, emojis, and clear next steps.`;

    const prompt = `User Query / Input: "${query}"
Context / App Type: "${appType}"
User Profile / Inputs: ${JSON.stringify(userProfile)}

Provide the personalized recommendation and ritual breakdown for "${store.name}".`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.8-flash"];
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
                maxOutputTokens: 1024,
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
                storeId: store.store_id,
                storeName: store.name,
                hero: store.hero,
                price: store.price,
                bundlePrice: store.bundle_price,
                freeGift: store.free_gift,
                accentColor: store.theme_accent || "#10B981",
                model: m,
                keyIndex: kIdx + 1,
                response: text
              });
            }
          } else {
            lastError = data.error || { message: "AI response failed" };
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
      storeId: store.store_id,
      storeName: store.name,
      hero: store.hero,
      price: store.price,
      bundlePrice: store.bundle_price,
      freeGift: store.free_gift,
      accentColor: store.theme_accent || "#10B981",
      model: "built-in-specialist",
      keyIndex: 1,
      response: fallbackResponse
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
