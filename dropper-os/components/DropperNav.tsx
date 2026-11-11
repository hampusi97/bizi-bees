"use client";

import React, { useState, useEffect } from "react";
import { Activity, Wifi, Terminal, GitBranch, ShieldCheck, Command } from "lucide-react";

interface DropperNavProps {
  onOpenCommand: () => void;
  activeStoresCount?: number;
  averageLatencyMs?: number;
}

export default function DropperNav({
  onOpenCommand,
  activeStoresCount = 3,
  averageLatencyMs = 24,
}: DropperNavProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-titanium-800 bg-titanium-950/80 backdrop-blur-md px-4 py-2.5">
      <div className="flex items-center justify-between text-xs">
        {/* Left: Branding & Fleet Status */}
        <div className="flex items-center space-x-3 text-titanium-200">
          <div className="flex items-center space-x-1.5 font-bold tracking-wider text-titanium-100">
            <span className="flex h-2 w-2 rounded-full bg-cyber-emerald animate-pulse"></span>
            <span className="font-mono text-sm tracking-tight text-white font-extrabold">DROPPER OS</span>
            <span className="rounded bg-titanium-800 px-1.5 py-0.5 text-[10px] font-mono text-titanium-400">v1.0</span>
          </div>
          <span className="text-titanium-600">|</span>
          <div className="flex items-center space-x-1.5 text-titanium-400">
            <Activity className="h-3.5 w-3.5 text-cyber-emerald" />
            <span className="font-mono">{activeStoresCount} STORES ONLINE</span>
          </div>
          <span className="text-titanium-600">|</span>
          <div className="flex items-center space-x-1 text-titanium-400">
            <span className="font-mono text-cyber-emerald">{averageLatencyMs}ms</span>
            <span>LATENCY</span>
          </div>
        </div>

        {/* Center: Command Bar Trigger */}
        <button
          onClick={onOpenCommand}
          className="flex items-center space-x-2 rounded-lg border border-titanium-700 bg-titanium-900/90 px-3 py-1 text-titanium-400 hover:border-titanium-600 hover:text-white transition-all shadow-sm"
        >
          <Command className="h-3.5 w-3.5" />
          <span className="font-sans text-xs">Quick Command</span>
          <kbd className="rounded bg-titanium-800 px-1.5 py-0.5 text-[10px] font-mono text-titanium-300">⌘K</kbd>
        </button>

        {/* Right: Clock & GitHub Sync */}
        <div className="flex items-center space-x-3 text-titanium-300">
          <div className="flex items-center space-x-1.5 rounded-full border border-cyber-emerald/30 bg-cyber-emerald/10 px-2.5 py-0.5 text-[11px] text-cyber-emerald font-mono">
            <Wifi className="h-3 w-3" />
            <span>LIVE INTERNET</span>
          </div>

          <div className="flex items-center space-x-1 text-titanium-400 font-mono text-[11px]">
            <GitBranch className="h-3.5 w-3.5 text-cyber-cyan" />
            <span>main:9c3eacd</span>
          </div>

          <span className="text-titanium-600">|</span>

          <div className="font-mono text-xs font-semibold text-white tracking-wider">
            {timeStr || "00:00:00"} <span className="text-[10px] text-titanium-400">UTC</span>
          </div>
        </div>
      </div>
    </header>
  );
}
