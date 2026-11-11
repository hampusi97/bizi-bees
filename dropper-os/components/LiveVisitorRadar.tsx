"use client";

import React, { useState, useEffect } from "react";
import { Radar, Users, ShoppingCart, AlertOctagon, Activity } from "lucide-react";

interface RadarNode {
  id: string;
  city: string;
  state: string;
  x: number;
  y: number;
  type: "browse" | "cart" | "checkout";
  active: boolean;
}

export default function LiveVisitorRadar() {
  const [activeUsers, setActiveUsers] = useState(24);
  const [activeCarts, setActiveCarts] = useState(6);
  const [rageClicks, setRageClicks] = useState(0);
  const [avgScrollDepth, setAvgScrollDepth] = useState(68);
  const [lastEventMsg, setLastEventMsg] = useState("Live edge radar initialized");

  const [nodes, setNodes] = useState<RadarNode[]>([
    { id: "1", city: "Salt Lake City", state: "UT", x: 26, y: 38, type: "cart", active: true },
    { id: "2", city: "Provo", state: "UT", x: 30, y: 44, type: "browse", active: true },
    { id: "3", city: "San Francisco", state: "CA", x: 14, y: 46, type: "checkout", active: true },
    { id: "4", city: "Austin", state: "TX", x: 52, y: 72, type: "cart", active: true },
    { id: "5", city: "New York", state: "NY", x: 84, y: 32, type: "browse", active: true },
    { id: "6", city: "Seattle", state: "WA", x: 18, y: 18, type: "browse", active: true },
    { id: "7", city: "Miami", state: "FL", x: 82, y: 84, type: "cart", active: true },
    { id: "8", city: "Denver", state: "CO", x: 42, y: 42, type: "browse", active: true },
  ]);

  useEffect(() => {
    // Connect to Server-Sent Events stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/telemetry/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "INIT_SNAPSHOT" && data.metrics) {
            setActiveUsers(data.metrics.activeVisitorsLast5m || 24);
            setActiveCarts(data.metrics.activeCarts || 6);
            setRageClicks(data.metrics.rageClicksToday || 0);
            setAvgScrollDepth(data.metrics.avgScrollDepthPercent || 68);
          } else if (data.channel === "telemetry") {
            const evt = data.data;
            if (evt.type === "rage_click") {
              setRageClicks((prev) => prev + 1);
              setLastEventMsg(`⚠️ Rage-click detected on <${evt.data?.tagName || 'el'}>`);
            } else if (evt.type === "cart_add") {
              setActiveCarts((prev) => prev + 1);
              setLastEventMsg(`🛒 New item added to bag from ${evt.geo?.city || "Customer"}`);
            } else if (evt.type === "pageview") {
              setLastEventMsg(`👀 Live pageview: ${evt.path}`);
            }
          }
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      // Fallback
    }

    // Interval animation for radar pulses
    const interval = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          active: Math.random() > 0.25,
        }))
      );
    }, 2800);

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, []);

  return (
    <div className="rounded-xl border border-titanium-800 bg-titanium-900/60 p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b border-titanium-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Radar className="h-4 w-4 text-cyber-emerald animate-pulse" />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-titanium-200">
            Real-Time Edge Telemetry & Live Visitor Radar
          </h3>
        </div>
        <span className="flex items-center space-x-1.5 rounded-full border border-cyber-emerald/30 bg-cyber-emerald/10 px-2 py-0.5 text-[10px] font-mono text-cyber-emerald">
          <span className="h-1.5 w-1.5 rounded-full bg-cyber-emerald animate-ping"></span>
          <span>SUB-5MS STREAM</span>
        </span>
      </div>

      {/* Top 4 Metrics Strip */}
      <div className="grid grid-cols-4 gap-3 mb-4 text-center">
        <div className="rounded-lg bg-titanium-950/60 border border-titanium-800/80 p-2.5">
          <div className="flex items-center justify-center space-x-1 text-titanium-400 text-[10px] font-mono uppercase">
            <Users className="h-3 w-3 text-cyber-cyan" />
            <span>Live Visitors</span>
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">{activeUsers}</div>
        </div>

        <div className="rounded-lg bg-titanium-950/60 border border-titanium-800/80 p-2.5">
          <div className="flex items-center justify-center space-x-1 text-titanium-400 text-[10px] font-mono uppercase">
            <ShoppingCart className="h-3 w-3 text-cyber-emerald" />
            <span>Active Carts</span>
          </div>
          <div className="text-xl font-mono font-bold text-cyber-emerald mt-1">{activeCarts}</div>
        </div>

        <div className="rounded-lg bg-titanium-950/60 border border-titanium-800/80 p-2.5">
          <div className="flex items-center justify-center space-x-1 text-titanium-400 text-[10px] font-mono uppercase">
            <AlertOctagon className="h-3 w-3 text-cyber-rose" />
            <span>Rage Clicks</span>
          </div>
          <div className={`text-xl font-mono font-bold mt-1 ${rageClicks > 0 ? "text-cyber-rose" : "text-white"}`}>
            {rageClicks}
          </div>
        </div>

        <div className="rounded-lg bg-titanium-950/60 border border-titanium-800/80 p-2.5">
          <div className="flex items-center justify-center space-x-1 text-titanium-400 text-[10px] font-mono uppercase">
            <Activity className="h-3 w-3 text-cyber-amber" />
            <span>Avg Scroll</span>
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">{avgScrollDepth}%</div>
        </div>
      </div>

      {/* Radar Map Canvas Simulation */}
      <div className="relative h-44 w-full rounded-lg bg-titanium-950 border border-titanium-800/60 overflow-hidden flex items-center justify-center">
        {/* Radar concentric sweep circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="h-64 w-64 rounded-full border border-cyber-emerald"></div>
          <div className="absolute h-44 w-44 rounded-full border border-cyber-emerald"></div>
          <div className="absolute h-24 w-24 rounded-full border border-cyber-emerald"></div>
          <div className="absolute h-full w-[1px] bg-cyber-emerald/40"></div>
          <div className="absolute w-full h-[1px] bg-cyber-emerald/40"></div>
        </div>

        {/* Radar Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              {node.active && (
                <span
                  className={`absolute h-4 w-4 rounded-full animate-ping opacity-75 ${
                    node.type === "checkout"
                      ? "bg-cyber-cyan"
                      : node.type === "cart"
                      ? "bg-cyber-emerald"
                      : "bg-titanium-400"
                  }`}
                ></span>
              )}
              <span
                className={`h-2 w-2 rounded-full ${
                  node.type === "checkout"
                    ? "bg-cyber-cyan"
                    : node.type === "cart"
                    ? "bg-cyber-emerald"
                    : "bg-titanium-300"
                }`}
              ></span>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 whitespace-nowrap bg-titanium-900 border border-titanium-700 px-2 py-0.5 rounded text-[10px] font-mono text-titanium-200 shadow-xl">
              {node.city}, {node.state} ({node.type})
            </div>
          </div>
        ))}

        {/* Live stream ticker bar at bottom */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-titanium-400 bg-titanium-900/80 px-2.5 py-1 rounded border border-titanium-800">
          <span className="truncate">{lastEventMsg}</span>
          <span className="text-[10px] text-cyber-emerald shrink-0 ml-2">● LIVE BEACON</span>
        </div>
      </div>
    </div>
  );
}
