/**
 * Server-Sent Events (SSE) Live Data Stream Endpoint
 * File: dropper-os/app/api/telemetry/stream/route.ts
 * Real-time event streaming pipe directly into Dropper OS Desktop HUD.
 */

import { NextRequest } from 'next/server';
import { sseEventBus, SSEBroadcastMessage } from '@/lib/telemetry/sse-event-bus';
import { edgeCollector } from '@/lib/telemetry/edge-collector';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial Handshake & Snapshot
      const initialMetrics = edgeCollector.getLiveMetrics();
      const initialData = JSON.stringify({
        type: 'INIT_SNAPSHOT',
        metrics: initialMetrics,
        recent: edgeCollector.getRecentEvents(15),
        timestamp: Date.now(),
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      // 2. Event Listener
      const onMessage = (msg: SSEBroadcastMessage) => {
        try {
          const payload = JSON.stringify(msg);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // ignore closed streams
        }
      };

      sseEventBus.on('message', onMessage);

      // 3. Keep-alive Heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // 4. Handle client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        sseEventBus.off('message', onMessage);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
