"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Play, RotateCcw } from "lucide-react";

interface LogEntry {
  timestamp: string;
  source: "DROPPER_DAEMON" | "TELEMETRY" | "GITHUB_BRIDGE" | "REPORT_GEN" | "GIT_PUSH" | "AUTOPILOT";
  message: string;
  level: "info" | "success" | "warn" | "pulse";
}

export default function SystemTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: "00:00:01",
      source: "DROPPER_DAEMON",
      message: "Connecting to Shopify GraphQL API (bizibees-store)...",
      level: "info",
    },
    {
      timestamp: "00:00:02",
      source: "TELEMETRY",
      message: "Response 200 OK (114ms) • SSL TLS_1_3 Active",
      level: "success",
    },
    {
      timestamp: "00:00:04",
      source: "GITHUB_BRIDGE",
      message: "Synced branch 'main' with commit 9c3eacd (Verified Clean)",
      level: "pulse",
    },
    {
      timestamp: "00:00:05",
      source: "REPORT_GEN",
      message: `Daily markdown briefing written to /reports/${new Date().toISOString().split("T")[0]}.md`,
      level: "info",
    },
    {
      timestamp: "00:00:06",
      source: "GIT_PUSH",
      message: "Pushed automated commit to origin/main successfully (HTTP 200 OK).",
      level: "success",
    },
    {
      timestamp: "00:00:09",
      source: "AUTOPILOT",
      message: "Management by Exception active. Zero action items needed.",
      level: "pulse",
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Periodic heartbeat message
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
      const pings = [
        {
          timestamp: timeStr,
          source: "TELEMETRY" as const,
          message: `Health check passed across 3 storefronts (avg 24ms). All checkouts 200 OK.`,
          level: "success" as const,
        },
        {
          timestamp: timeStr,
          source: "DROPPER_DAEMON" as const,
          message: `Audited supplier stockouts. Zero unmapped orders detected.`,
          level: "info" as const,
        },
      ];
      const selected = pings[Math.floor(Math.random() * pings.length)];
      setLogs((prev) => [...prev.slice(-30), selected]);
    }, 24000);

    return () => clearInterval(timer);
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
          if (log.source === "TELEMETRY") sourceColor = "text-cyber-emerald";
          if (log.source === "GIT_PUSH") sourceColor = "text-cyber-violet";
          if (log.source === "REPORT_GEN") sourceColor = "text-cyber-amber";

          return (
            <div key={index} className="leading-relaxed flex items-start space-x-2">
              <span className="text-titanium-400 select-none">[{log.timestamp}]</span>
              <span className={`font-bold ${sourceColor}`}>[{log.source}]:</span>
              <span className="text-titanium-200">{log.message}</span>
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Prompt Footer */}
      <div className="mt-3 pt-2 border-t border-titanium-800/80 flex items-center justify-between text-[11px] text-titanium-400">
        <div className="flex items-center space-x-1.5">
          <span className="text-cyber-emerald">dropper-os@fleet:~$</span>
          <span className="animate-pulse">_</span>
        </div>
        <span>Next cron cycle: 23:59:00 UTC</span>
      </div>
    </div>
  );
}
