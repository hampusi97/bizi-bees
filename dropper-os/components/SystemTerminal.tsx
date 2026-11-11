"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Play, RotateCcw } from "lucide-react";

export type LogSource =
  | "RADAR"
  | "BANDIT"
  | "FORECAST"
  | "ISSUE-OPS"
  | "PANIC"
  | "TELEMETRY"
  | "DROPPER_DAEMON"
  | "GITHUB_BRIDGE"
  | "GIT_PUSH";

interface LogEntry {
  timestamp: string;
  source: LogSource;
  message: string;
  level: "info" | "success" | "warn" | "danger" | "pulse";
}

export default function SystemTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: "00:00:01",
      source: "RADAR",
      message: "New visitor entering checkout from Salt Lake City, UT (Session s_9f2a).",
      level: "pulse",
    },
    {
      timestamp: "00:00:02",
      source: "BANDIT",
      message: "Variant B (Free Shipping at $50) leading with 4.8% CR (+1.2% over Variant A).",
      level: "success",
    },
    {
      timestamp: "00:00:04",
      source: "FORECAST",
      message: "Bizi Bees™ Bookish Mystery Crate burn alert triggered: 4.6 days remaining (DIR).",
      level: "warn",
    },
    {
      timestamp: "00:00:06",
      source: "ISSUE-OPS",
      message: "Restock issue #12 auto-created on GitHub with reorder quantity Q=140.",
      level: "info",
    },
    {
      timestamp: "00:00:08",
      source: "TELEMETRY",
      message: "Sub-5ms beacon ingest stream active. 0 rage clicks in the last 15 minutes.",
      level: "success",
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Connect to live SSE stream for real events
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/telemetry/stream");
      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const nowStr = new Date().toLocaleTimeString("en-US", { hour12: false });

          if (msg.channel === "bandit") {
            setLogs((prev) => [
              ...prev.slice(-40),
              {
                timestamp: nowStr,
                source: "BANDIT",
                message: `Variant '${msg.data?.variantId}' served (isExploration: ${msg.data?.isExploration ? "true" : "false"})`,
                level: "success",
              },
            ]);
          } else if (msg.channel === "issue-ops") {
            setLogs((prev) => [
              ...prev.slice(-40),
              {
                timestamp: nowStr,
                source: "ISSUE-OPS",
                message: `Restock issue logged for '${msg.data?.title}' (${msg.data?.daysRemaining} days left).`,
                level: "info",
              },
            ]);
          } else if (msg.channel === "panic") {
            setLogs((prev) => [
              ...prev.slice(-40),
              {
                timestamp: nowStr,
                source: "PANIC",
                message: msg.data?.message || "EMERGENCY PANIC MODE STATUS CHANGED",
                level: "danger",
              },
            ]);
          } else if (msg.channel === "telemetry" && msg.event === "rage_click") {
            setLogs((prev) => [
              ...prev.slice(-40),
              {
                timestamp: nowStr,
                source: "RADAR",
                message: `Rage click detected on element <${msg.data?.data?.tagName || 'unknown'}>. Alert triggered.`,
                level: "warn",
              },
            ]);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // fallback
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  return (
    <div className="rounded-xl border border-titanium-800 bg-[#0C0C0E] p-4 shadow-xl flex flex-col h-full font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-titanium-800 text-titanium-400">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-cyber-emerald" />
          <span className="font-bold text-titanium-200">DROPPER OS LIVE TERMINAL</span>
          <span className="rounded bg-titanium-800/80 px-1.5 py-0.5 text-[10px] text-titanium-400">
            STDOUT / TTY
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-cyber-emerald animate-pulse"></span>
          <span className="text-[11px] text-cyber-emerald">60 FPS DAEMON RUNNING</span>
        </div>
      </div>

      {/* Terminal Logs Window */}
      <div className="overflow-y-auto mt-3 space-y-1.5 flex-1 pr-1 select-text">
        {logs.map((log, index) => {
          let sourceColor = "text-cyber-cyan";
          if (log.source === "RADAR") sourceColor = "text-cyber-cyan";
          if (log.source === "BANDIT") sourceColor = "text-cyber-emerald";
          if (log.source === "FORECAST") sourceColor = "text-cyber-amber";
          if (log.source === "ISSUE-OPS") sourceColor = "text-cyber-violet";
          if (log.source === "PANIC") sourceColor = "text-cyber-rose";

          return (
            <div key={index} className="leading-relaxed flex items-start space-x-2">
              <span className="text-titanium-400 select-none">[{log.timestamp}]</span>
              <span className={`font-bold ${sourceColor}`}>[{log.source}]:</span>
              <span
                className={`${
                  log.level === "danger"
                    ? "text-cyber-rose font-bold"
                    : log.level === "warn"
                    ? "text-cyber-amber"
                    : "text-titanium-200"
                }`}
              >
                {log.message}
              </span>
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Prompt Footer */}
      <div className="mt-3 pt-2 border-t border-titanium-800/80 flex items-center justify-between text-[11px] text-titanium-400">
        <div className="flex items-center space-x-1.5">
          <span className="text-cyber-emerald">dropper-os@v2:~$</span>
          <span className="animate-pulse">_</span>
        </div>
        <span>Bandit &amp; Telemetry streaming</span>
      </div>
    </div>
  );
}
