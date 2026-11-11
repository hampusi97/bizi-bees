import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { prompt, systemInstruction, model = "gemini-3.5-flash" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    // Load and deduplicate all available Gemini keys
    const rawKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_SECONDARY,
      ...(process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(",") : [])
    ];
    const availableKeys = Array.from(new Set(rawKeys.filter(Boolean))) as string[];

    if (availableKeys.length === 0) {
      return NextResponse.json({ success: false, error: "No GEMINI_API_KEY configured" }, { status: 500 });
    }

    const modelsToTry = [model, "gemini-flash-latest", "gemini-3.8-flash"];
    let lastError: any = null;

    // Loop through available keys and models for maximum redundancy
    for (let kIdx = 0; kIdx < availableKeys.length; kIdx++) {
      const apiKey = availableKeys[kIdx];

      for (const m of modelsToTry) {
        try {
          const payload: any = {
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          };

          if (systemInstruction) {
            payload.systemInstruction = {
              parts: [{ text: systemInstruction }]
            };
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (res.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const text = data.candidates[0].content.parts[0].text;
            return NextResponse.json({
              success: true,
              model: m,
              keyIndex: kIdx + 1,
              text,
              usage: data.usageMetadata
            });
          } else {
            lastError = data.error || { message: "Generation failed" };
            // If rate limited (429) or high demand (503), break to next key immediately
            if (data.error?.code === 429 || data.error?.code === 503) {
              break;
            }
          }
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: lastError?.message || "All Gemini API keys and models exhausted"
    }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
