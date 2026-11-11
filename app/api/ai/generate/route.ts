import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { prompt, systemInstruction, model = "gemini-3.5-flash" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const modelsToTry = [model, "gemini-flash-latest", "gemini-3.8-flash"];
    let lastError: any = null;

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
            text,
            usage: data.usageMetadata
          });
        } else {
          lastError = data.error || { message: "Generation failed" };
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    return NextResponse.json({
      success: false,
      error: lastError?.message || "All Gemini models unavailable"
    }, { status: 502 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
