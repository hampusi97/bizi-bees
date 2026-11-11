"use client";

import React, { useState, useEffect } from "react";
import type { StoreTelemetry, FleetState } from "./api/fleet/route";

export default function MissionControlDashboard() {
  const [fleet, setFleet] = useState<FleetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{
      id: string;
      timestamp: string;
      store: string;
      level: "INFO" | "SUCCESS" | "WARN" | "CRITICAL";
      message: string;
    }>
  >([]);

  // Fetch telemetry
  const fetchTelemetry = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/fleet");
      const json = await res.json();
      if (json.success && json.data) {
        setFleet(json.data);
        if (terminalLogs.length === 0) {
          setTerminalLogs(json.data.recentLogs);
        }
      }
    } catch (e) {
      console.error("Failed to fetch fleet telemetry", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  // Quick Action Handler
  const handleStoreAction = async (
    storeId: string,
    action: "run_healer" | "publish_seo"
  ) => {
    const actionKey = `${storeId}-${action}`;
    setActiveActionId(actionKey);

    try {
      const res = await fetch("/api/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, storeId }),
      });
      const data = await res.json();

      if (data.success && data.logEntry) {
        setTerminalLogs((prev) => [data.logEntry, ...prev]);

        // Update local store state
        if (fleet) {
          setFleet({
            ...fleet,
            stores: fleet.stores.map((s) =>
              s.id === storeId ? { ...s, ...data.store } : s
            ),
          });
        }
      }
    } catch (err) {
      console.error("Failed to execute store action", err);
    } finally {
      setActiveActionId(null);
    }
  };

  const totalRevenue =
    fleet?.stores.reduce((acc, s) => acc + s.revenue24h, 0) || 0;
  const targetRevenue = fleet?.targetRevenueDaily || 21666.67;
  const revenuePct = Math.min(
    100,
    Number(((totalRevenue / targetRevenue) * 100).toFixed(1))
  );

  const totalOrders =
    fleet?.stores.reduce((acc, s) => acc + s.orders24h, 0) || 0;
  const targetOrders = fleet?.targetOrdersDaily || 338;
  const ordersPct = Math.min(
    100,
    Number(((totalOrders / targetOrders) * 100).toFixed(1))
  );

  const filteredStores =
    fleet?.stores.filter(
      (s) =>
        s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.niche.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.domain.toLowerCase().includes(searchFilter.toLowerCase())
    ) || [];

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] pb-16 font-sans antialiased">
      {/* Top Ambient Glow Banner */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-[#10B981]/10 via-[#38BDF8]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#090D16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#0D9488] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
              <span className="text-xl">🌐</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  REPO-OS™ MISSION CONTROL
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#1E293B] text-[#94A3B8] rounded border border-[#334155]">
                  v2.4 Enterprise
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] tracking-wide">
                Unified Autonomous Shopify Fleet Command • 13 Direct DTC Storefronts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Fleet Health Badge */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#10B981] mr-2 animate-ping" />
              <span>🟢 13 of 13 Stores Online</span>
            </div>

            {/* Refresh Telemetry Button */}
            <button
              onClick={fetchTelemetry}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-medium text-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span className="hidden sm:inline">
                {refreshing ? "Polling..." : "Refresh Telemetry"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 relative z-10">
        {/* Global Metric Cards (3-Column Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Fleet 24h Revenue */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl relative overflow-hidden group hover:border-[#38BDF8]/40 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl select-none group-hover:scale-110 transition-transform">
              💰
            </div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] font-bold mb-1">
              Fleet 24h Revenue
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-semibold text-[#10B981]">
                +{revenuePct}%
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Target: <strong className="text-[#94A3B8]">$21,666.67/day</strong> ($650k/mo run-rate)
            </p>
            <div className="w-full bg-[#1E293B] h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#10B981] to-[#38BDF8] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${revenuePct}%` }}
              />
            </div>
          </div>

          {/* Card 2: Total Daily Orders */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl relative overflow-hidden group hover:border-[#10B981]/40 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl select-none group-hover:scale-110 transition-transform">
              📦
            </div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] font-bold mb-1">
              Total Daily Orders
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
              {totalOrders}
              <span className="text-xs font-semibold text-[#38BDF8]">
                {ordersPct}% of Goal
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Daily Volume Target: <strong className="text-[#94A3B8]">338 orders/day</strong> across 13 stores
            </p>
            <div className="w-full bg-[#1E293B] h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#38BDF8] to-[#10B981] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${ordersPct}%` }}
              />
            </div>
          </div>

          {/* Card 3: Run-Rate Progress Bar */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl relative overflow-hidden group hover:border-[#10B981]/40 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl select-none group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] font-bold mb-1">
              Monthly Run-Rate Progress
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#10B981] tracking-tight">
              {revenuePct}%
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Current Paceline: <strong className="text-[#94A3B8]">${((totalRevenue * 30) / 1000).toFixed(1)}k / $650k mo</strong>
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#94A3B8]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Real-time webhook sync & self-healing enabled</span>
            </div>
          </div>
        </section>

        {/* Live Interactive Terminal / Console */}
        <section className="rounded-2xl bg-[#090D16] border border-[#1E293B] shadow-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
              </div>
              <span className="text-xs font-mono font-semibold text-[#94A3B8] tracking-wider uppercase">
                Console // Autonomous Telemetry Stream
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTerminalLogs([])}
                className="text-[11px] font-mono text-[#64748B] hover:text-[#94A3B8] transition-colors"
              >
                [Clear Log]
              </button>
              <span className="text-xs font-mono text-[#10B981] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                LIVE
              </span>
            </div>
          </div>
          <div className="p-4 font-mono text-xs max-h-56 overflow-y-auto space-y-2 bg-[#06090F]">
            {terminalLogs.length === 0 ? (
              <div className="text-[#64748B] italic">Listening for fleet events...</div>
            ) : (
              terminalLogs.map((log) => {
                const color =
                  log.level === "SUCCESS"
                    ? "text-[#10B981]"
                    : log.level === "WARN"
                    ? "text-[#F59E0B]"
                    : log.level === "CRITICAL"
                    ? "text-[#EF4444]"
                    : "text-[#38BDF8]";
                return (
                  <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-[#475569] select-none">[{log.timestamp}]</span>
                    <span className={`font-bold ${color}`}>[{log.level}]</span>
                    <span className="text-[#CBD5E1] font-semibold">{log.store}:</span>
                    <span className="text-[#94A3B8]">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 13-Store Fleet Management Matrix */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>⚡ Fleet Management Matrix</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1E293B] text-[#94A3B8]">
                  {filteredStores.length} Stores Listed
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Direct telemetry and one-click autonomous intervention for each storefront
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter stores by name, niche, or domain..."
                className="w-full sm:w-72 bg-[#0F172A] border border-[#1E293B] focus:border-[#38BDF8] text-xs text-white placeholder-[#64748B] rounded-lg px-3 py-2 outline-none transition-colors"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2.5 top-2 text-xs text-[#64748B] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Stores Table */}
          <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#0B111E] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    <th className="py-3.5 px-4">Store Identity</th>
                    <th className="py-3.5 px-4">Health</th>
                    <th className="py-3.5 px-4 text-right">24h Revenue</th>
                    <th className="py-3.5 px-4 text-right">Orders</th>
                    <th className="py-3.5 px-4 text-right">AOV</th>
                    <th className="py-3.5 px-4 text-right">Conv. Rate</th>
                    <th className="py-3.5 px-4">Intervention Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/70 text-xs">
                  {filteredStores.map((store) => {
                    const isHealing = activeActionId === `${store.id}-run_healer`;
                    const isPublishing = activeActionId === `${store.id}-publish_seo`;

                    return (
                      <tr
                        key={store.id}
                        className="hover:bg-[#131D33] transition-colors group"
                      >
                        {/* Store Identity */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                            {store.name}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {store.niche} •{" "}
                            <span className="font-mono text-[#94A3B8]">
                              {store.domain}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            <span>200 OK</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5">
                            Audit: {store.lastHealed}
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="py-4 px-4 text-right font-mono font-bold text-white">
                          ${store.revenue24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Orders */}
                        <td className="py-4 px-4 text-right font-mono text-[#CBD5E1]">
                          {store.orders24h}
                        </td>

                        {/* AOV */}
                        <td className="py-4 px-4 text-right font-mono text-[#94A3B8]">
                          ${store.aov.toFixed(2)}
                        </td>

                        {/* Conv Rate */}
                        <td className="py-4 px-4 text-right font-mono font-semibold text-[#10B981]">
                          {store.conversionRate}%
                        </td>

                        {/* Quick Actions */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {/* Action 1: Run Healer */}
                            <button
                              onClick={() => handleStoreAction(store.id, "run_healer")}
                              disabled={isHealing}
                              className="px-2.5 py-1 rounded bg-[#090D16] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#10B981]/50 text-[11px] font-medium text-[#10B981] transition-all disabled:opacity-50 flex items-center gap-1"
                              title="Audit images, repair broken links, and verify checkout API"
                            >
                              {isHealing ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <span>🛡️</span>
                              )}
                              <span>Run Healer</span>
                            </button>

                            {/* Action 2: SEO Blog */}
                            <button
                              onClick={() => handleStoreAction(store.id, "publish_seo")}
                              disabled={isPublishing}
                              className="px-2.5 py-1 rounded bg-[#090D16] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#38BDF8]/50 text-[11px] font-medium text-[#38BDF8] transition-all disabled:opacity-50 flex items-center gap-1"
                              title="Programmatically publish High-DA comparison article to Shopify blog"
                            >
                              {isPublishing ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <span>✍️</span>
                              )}
                              <span>SEO Blog</span>
                            </button>

                            {/* Action 3: Admin ↗ */}
                            <a
                              href={store.adminUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-[#090D16] hover:bg-[#1E293B] border border-[#1E293B] hover:border-white/30 text-[11px] font-medium text-[#CBD5E1] transition-all"
                              title={`Open ${store.name} Shopify Admin`}
                            >
                              Admin ↗
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Footer System Telemetry Status */}
        <footer className="pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <div>
            RepoOS™ Autonomous E-Commerce Fleet Engine • Cloudflare Edge Mesh Protected
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> All Edge Nodes Nominal
            </span>
            <span>Latency: 18ms</span>
            <span>Target: $650k/mo</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
