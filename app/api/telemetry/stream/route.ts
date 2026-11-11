import { NextRequest } from "next/server";
import {
  sseEventBus,
  type SSEBroadcastMessage,
} from "@/lib/telemetry/sse-event-bus";
import { edgeCollector } from "@/lib/telemetry/edge-collector";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const initialMetrics = edgeCollector.getLiveMetrics();
      const initialData = JSON.stringify({
        type: "INIT_SNAPSHOT",
        metrics: initialMetrics,
        recent: edgeCollector.getRecentEvents(15),
        timestamp: Date.now(),
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));

      const onMessage = (msg: SSEBroadcastMessage) => {
        try {
          const payload = JSON.stringify(msg);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // ignore closed streams
        }
      };

      sseEventBus.on("message", onMessage);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseEventBus.off("message", onMessage);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
