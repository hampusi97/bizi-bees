/**
 * Dropper OS - Edge Telemetry Ingest Beacon Endpoint
 * File: dropper-os/app/api/telemetry/ingest/route.ts
 * High-performance, sub-5ms analytics endpoint for live storefront interactions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { edgeCollector, TelemetryEventType } from '@/lib/telemetry/edge-collector';
import { sseEventBus } from '@/lib/telemetry/sse-event-bus';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  const metrics = edgeCollector.getLiveMetrics();
  const recentEvents = edgeCollector.getRecentEvents(25);
  return NextResponse.json({ success: true, metrics, recentEvents }, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    let payload: any;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const rawText = await req.text();
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { type: 'custom', raw: rawText };
      }
    }

    const type: TelemetryEventType = payload.type || 'custom';
    const sessionId = payload.sessionId || `anon_${Date.now()}`;
    const path = payload.path || '/';
    const device = payload.device || 'desktop';

    // Geo estimation from headers if available
    const geo = {
      city: req.headers.get('x-vercel-ip-city') || payload.geo?.city || 'Salt Lake City',
      region: req.headers.get('x-vercel-ip-country-region') || payload.geo?.region || 'UT',
      country: req.headers.get('x-vercel-ip-country') || payload.geo?.country || 'US',
    };

    const recorded = edgeCollector.recordEvent({
      type,
      sessionId,
      storeId: payload.storeId || 'bizi-bees',
      path,
      device,
      data: payload.data || {},
      geo,
      ip: req.headers.get('x-forwarded-for') || undefined,
    });

    // Broadcast in real time to SSE Desktop HUD
    sseEventBus.broadcastTelemetry(recorded);

    return NextResponse.json(
      { ok: true, id: recorded.id, timestamp: recorded.timestamp },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
