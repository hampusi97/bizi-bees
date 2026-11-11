/**
 * Server-Sent Events (SSE) Live Data Stream Event Bus
 * File: lib/telemetry/sse-event-bus.ts
 */

import { EventEmitter } from "events";
import type { TelemetryEvent } from "./edge-collector";

export interface SSEBroadcastMessage {
  channel: "telemetry" | "bandit" | "forecast" | "issue-ops" | "panic";
  event: string;
  data: unknown;
  timestamp: number;
}

class SSEEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  public broadcast(
    channel: SSEBroadcastMessage["channel"],
    event: string,
    data: unknown
  ): void {
    const message: SSEBroadcastMessage = {
      channel,
      event,
      data,
      timestamp: Date.now(),
    };
    this.emit("message", message);
  }

  public broadcastTelemetry(event: TelemetryEvent): void {
    this.broadcast("telemetry", event.type, event);
  }
}

const globalForBus = global as unknown as {
  sseEventBusSingleton?: SSEEventBus;
};
export const sseEventBus =
  globalForBus.sseEventBusSingleton || new SSEEventBus();
if (process.env.NODE_ENV !== "production") {
  globalForBus.sseEventBusSingleton = sseEventBus;
}
