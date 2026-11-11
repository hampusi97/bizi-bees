"use client";

import React from "react";
import { ExternalLink, RefreshCw, Zap, TrendingUp, Layers, CheckCircle2 } from "lucide-react";
import { StoreMetrics } from "@/lib/shopify-client";

interface FleetMatrixProps {
  stores: StoreMetrics[];
  onQuickDeploy: (storeId: string, storeName: string) => void;
  onRefreshTelemetry: () => void;
  isRefreshing?: boolean;
}

export default function FleetMatrix({
  stores,
  onQuickDeploy,
  onRefreshTelemetry,
  isRefreshing = false,
}: FleetMatrixProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-titanium-400 font-mono">
            Connected Fleet Matrix (Multi-Store Telemetry)
          </h2>
          <p className="text-xs text-titanium-400 mt-0.5">
            Active Shopify storefronts orchestrating via Dropper OS Core Engine.
          </p>
        </div>
        <button
          onClick={onRefreshTelemetry}
          disabled={isRefreshing}
          className="flex items-center space-x-1.5 rounded-lg border border-titanium-700 bg-titanium-900 px-3 py-1.5 text-xs text-titanium-200 hover:border-titanium-600 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-cyber-emerald" : ""}`} />
          <span>Refresh Fleet Telemetry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <div
            key={store.storeId}
            className="flex flex-col justify-between rounded-xl border border-titanium-800 bg-titanium-900/60 p-5 shadow-lg backdrop-blur hover:border-titanium-700 transition"
          >
            <div>
              {/* Store Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-cyber-emerald"></span>
                    <h3 className="font-semibold text-white text-base tracking-tight">{store.storeName}</h3>
                  </div>
                  <span className="font-mono text-xs text-titanium-400 mt-0.5 block">{store.domain}</span>
                </div>
                <span className="rounded-full border border-cyber-emerald/30 bg-cyber-emerald/10 px-2 py-0.5 text-[10px] font-mono text-cyber-emerald font-bold">
                  {store.status}
                </span>
              </div>

              {/* Metrics Strip */}
              <div className="mt-5 grid grid-cols-3 gap-2 border-y border-titanium-800/80 py-3.5 text-center">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-titanium-400">
                    24h Sales
                  </span>
                  <span className="font-mono text-lg font-bold text-white">
                    ${store.revenue24h.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-titanium-400">
                    Orders
                  </span>
                  <span className="font-mono text-lg font-bold text-white">{store.orders24h}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-titanium-400">
                    AOV
                  </span>
                  <span className="font-mono text-lg font-bold text-cyber-emerald">
                    ${store.aov.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* System Specs */}
              <div className="mt-4 space-y-1.5 text-xs text-titanium-400 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-titanium-400">Theme Version:</span>
                  <span className="text-titanium-200">v4.2-ultra-dynamic</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-titanium-400">Last Git Commit:</span>
                  <span className="text-cyber-cyan">9c3eacd (Verified)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-titanium-400">Endpoint Ping:</span>
                  <span className="text-cyber-emerald font-semibold">{store.latencyMs}ms</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2 pt-2 border-t border-titanium-800">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onQuickDeploy(store.storeId, store.storeName)}
                  className="flex items-center justify-center space-x-1 rounded-lg border border-titanium-700 bg-titanium-800 px-2.5 py-1.5 text-[11px] font-medium text-titanium-200 hover:bg-titanium-700 hover:text-white transition"
                >
                  <RefreshCw className="h-3 w-3 text-cyber-cyan" />
                  <span>Sync Theme</span>
                </button>

                <button
                  onClick={onRefreshTelemetry}
                  className="flex items-center justify-center space-x-1 rounded-lg border border-titanium-700 bg-titanium-800 px-2.5 py-1.5 text-[11px] font-medium text-titanium-200 hover:bg-titanium-700 hover:text-white transition"
                >
                  <Zap className="h-3 w-3 text-cyber-emerald" />
                  <span>Diagnostics</span>
                </button>

                <button
                  onClick={() => onQuickDeploy(store.storeId, store.storeName)}
                  className="flex items-center justify-center space-x-1 rounded-lg bg-cyber-emerald/15 border border-cyber-emerald/30 px-2.5 py-1.5 text-[11px] font-semibold text-cyber-emerald hover:bg-cyber-emerald/25 transition"
                >
                  <Layers className="h-3 w-3" />
                  <span>Deploy Cart</span>
                </button>
              </div>

              <a
                href={`https://${store.domain}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-titanium-700/60 bg-titanium-800/40 px-3 py-1.5 text-xs text-titanium-300 hover:border-titanium-600 hover:text-white transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Visit Live Storefront</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
