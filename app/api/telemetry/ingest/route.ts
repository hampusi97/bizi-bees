import { NextRequest, NextResponse } from "next/server";
import {
  edgeCollector,
  type TelemetryEventType,
} from "@/lib/telemetry/edge-collector";
import { sseEventBus } from "@/lib/telemetry/sse-event-bus";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const metrics = edgeCollector.getLiveMetrics();
  const recentEvents = edgeCollector.getRecentEvents(25);
  return NextResponse.json(
    { success: true, metrics, recentEvents },
    { headers: CORS_HEADERS }
  );
}

export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const rawText = await req.text();
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { type: "custom", raw: rawText };
      }
    }

    const type = (payload.type as TelemetryEventType) || "custom";
    const sessionId = String(payload.sessionId || `anon_${Date.now()}`);
    const path = String(payload.path || "/");
    const device =
      payload.device === "mobile" || payload.device === "tablet"
        ? payload.device
        : "desktop";

    const geoObj = (payload.geo as Record<string, string>) || {};
    const geo = {
      city: req.headers.get("x-vercel-ip-city") || geoObj.city || "Salt Lake City",
      region:
        req.headers.get("x-vercel-ip-country-region") || geoObj.region || "UT",
      country: req.headers.get("x-vercel-ip-country") || geoObj.country || "US",
    };

    const recorded = edgeCollector.recordEvent({
      type,
      sessionId,
      storeId: String(payload.storeId || "bizi-bees"),
      path,
      device,
      data: (payload.data as Record<string, unknown>) || {},
      geo,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    sseEventBus.broadcastTelemetry(recorded);

    return NextResponse.json(
      {
        ok: true,
        id: recorded.id,
        timestamp: recorded.timestamp,
        metrics: edgeCollector.getLiveMetrics(),
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid beacon";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
