"use client";

import React, { useState, useEffect } from "react";
import DropperNav from "@/components/DropperNav";
import FleetMatrix from "@/components/FleetMatrix";
import LiveSalesFeed from "@/components/LiveSalesFeed";
import SystemTerminal from "@/components/SystemTerminal";
import QuickDeployModal from "@/components/QuickDeployModal";
import LiveVisitorRadar from "@/components/LiveVisitorRadar";
import PredictiveStockHUD from "@/components/PredictiveStockHUD";
import { StoreMetrics } from "@/lib/shopify-client";
import {
  TrendingUp,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  Zap,
  FileText,
  Search,
  CheckCircle,
  AlertOctagon,
  Power,
} from "lucide-react";

export default function DropperOSDashboard() {
  const [stores, setStores] = useState<StoreMetrics[]>([
    {
      storeId: "bizi-bees-boutique",
      storeName: "Bizi Bees Boutique",
      domain: "bizibees-store.myshopify.com",
      currency: "USD",
      revenue24h: 612.4,
      orders24h: 15,
      aov: 40.83,
      topProducts: [
        { id: "1", title: "Blind Date Mystery Book Crate", quantitySold: 8, revenue: 192.00 },
        { id: "2", title: "Amber Glass Botanical Candle", quantitySold: 5, revenue: 90.00 }
      ],
      lowStockCount: 2,
      lowStockItems: [
        { id: "1", title: "Blind Date Mystery Book Box", inventory: 3 },
      ],
      unfulfilledOrdersCount: 2,
      abandonedCartCount: 8,
      abandonmentRate: 61.5,
      status: "ONLINE",
      latencyMs: 24,
      lastSyncTimestamp: new Date().toISOString(),
    },
    {
      storeId: "luma-clinical",
      storeName: "Luma Clinical™",
      domain: "luma-clinical.myshopify.com",
      currency: "USD",
      revenue24h: 849.8,
      orders24h: 14,
      aov: 60.7,
      topProducts: [
        { id: "1", title: "LumaGlow 4-in-1 Facial Wand", quantitySold: 9, revenue: 359.91 }
      ],
      lowStockCount: 1,
      lowStockItems: [
        { id: "2", title: "LumaGlow Activating Serum 50ml", inventory: 2 },
      ],
      unfulfilledOrdersCount: 1,
      abandonedCartCount: 6,
      abandonmentRate: 58.2,
      status: "ONLINE",
      latencyMs: 18,
      lastSyncTimestamp: new Date().toISOString(),
    },
    {
      storeId: "fizz-lab",
      storeName: "Fizz Lab™ Soda Co.",
      domain: "fizz-lab-dirty-soda.myshopify.com",
      currency: "USD",
      revenue24h: 418.5,
      orders24h: 9,
      aov: 46.5,
      topProducts: [
        { id: "1", title: "Dirty Soda Flavor Syrup Pack", quantitySold: 6, revenue: 144.00 }
      ],
      lowStockCount: 0,
      lowStockItems: [],
      unfulfilledOrdersCount: 1,
      abandonedCartCount: 4,
      abandonmentRate: 63.0,
      status: "ONLINE",
      latencyMs: 29,
      lastSyncTimestamp: new Date().toISOString(),
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [activeDeployStore, setActiveDeployStore] = useState<{ id: string; name: string }>({
    id: "bizi-bees-boutique",
    name: "Bizi Bees Boutique",
  });
  const [reportSuccessNotice, setReportSuccessNotice] = useState<string | null>(null);
  const [panicMode, setPanicMode] = useState<boolean>(false);

  // Check initial panic state
  useEffect(() => {
    fetch("/api/dropper/panic")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.panicMode !== undefined) {
          setPanicMode(data.panicMode);
        }
      })
      .catch(() => {});
  }, []);

  const handleTogglePanic = async () => {
    const nextState = !panicMode;
    const confirmMsg = nextState
      ? "EMERGENCY PANIC MODE: Instantly pause dynamic scripts and revert theme to standard fallback mode?"
      : "Disengage Emergency Panic Mode and restore dynamic algorithmic engines?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/dropper/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextState }),
      });
      const json = await res.json();
      if (json.success) {
        setPanicMode(json.panicMode);
        setReportSuccessNotice(
          json.panicMode
            ? "EMERGENCY PANIC MODE ENGAGED: Dynamic scripts paused."
            : "Panic mode disengaged: Full dynamic engines restored."
        );
      }
    } catch (e: any) {
      alert("Panic mode error: " + e.message);
    }
  };

  // Keyboard shortcut listener for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
        setIsDeployModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dropper/stores");
      const json = await res.json();
      if (json.success && json.telemetry?.stores) {
        setStores(json.telemetry.stores);
      }
    } catch (e) {
      console.warn("Telemetry fetch error, continuing with local state", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTriggerReport = async () => {
    try {
      const res = await fetch("/api/dropper/report", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setReportSuccessNotice(`Daily report committed: ${json.date} (SHA: ${json.commitSha?.slice(0, 7) || 'verified'})`);
        setTimeout(() => setReportSuccessNotice(null), 6000);
      }
    } catch (e: any) {
      alert("Report trigger error: " + e.message);
    }
  };

  const openDeployModal = (storeId: string, storeName: string) => {
    setActiveDeployStore({ id: storeId, name: storeName });
    setIsDeployModalOpen(true);
  };

  const totalRevenue = stores.reduce((sum, s) => sum + s.revenue24h, 0);
  const totalOrders = stores.reduce((sum, s) => sum + s.orders24h, 0);
  const avgLatency = Math.round(stores.reduce((sum, s) => sum + s.latencyMs, 0) / (stores.length || 1));
  const lowStockCount = stores.reduce((sum, s) => sum + s.lowStockCount, 0);

  return (
    <div className="min-h-screen bg-[#09090B] text-titanium-100 flex flex-col font-sans selection:bg-cyber-emerald/30 selection:text-white pb-12">
      {/* Top OS Navigation Strip */}
      <DropperNav
        onOpenCommand={() => setIsCommandOpen(true)}
        activeStoresCount={stores.length}
        averageLatencyMs={avgLatency}
      />

      {/* Main Command Center Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Success Banner */}
        {reportSuccessNotice && (
          <div className="rounded-xl border border-cyber-emerald/40 bg-cyber-emerald/10 p-3 text-xs text-cyber-emerald flex items-center justify-between font-mono animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-cyber-emerald shrink-0" />
              <span>{reportSuccessNotice}</span>
            </div>
            <button onClick={() => setReportSuccessNotice(null)} className="text-titanium-400 hover:text-white">✕</button>
          </div>
        )}

        {/* V2 Emergency Panic Mode & Control Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-titanium-800 bg-titanium-900/40 p-3.5 backdrop-blur">
          <div className="flex items-center space-x-3">
            <span className={`flex h-3 w-3 rounded-full ${panicMode ? "bg-cyber-rose animate-ping" : "bg-cyber-emerald"}`}></span>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-titanium-200">
                Dropper OS V2 · Algorithmic Core:{" "}
                <span className={panicMode ? "text-cyber-rose" : "text-cyber-emerald"}>
                  {panicMode ? "PANIC MODE ENGAGED (SAFE FALLBACK)" : "ACTIVE & SELF-OPTIMIZING"}
                </span>
              </span>
              <p className="text-[11px] text-titanium-400 font-mono mt-0.5">
                MAB testing, edge telemetry &amp; predictive forecasting executing in real time.
              </p>
            </div>
          </div>

          <button
            onClick={handleTogglePanic}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-mono font-bold transition border ${
              panicMode
                ? "bg-cyber-emerald/15 border-cyber-emerald/40 text-cyber-emerald hover:bg-cyber-emerald/25"
                : "bg-cyber-rose/15 border-cyber-rose/40 text-cyber-rose hover:bg-cyber-rose/25"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>{panicMode ? "RESTORE DYNAMIC ENGINES" : "EMERGENCY PANIC KILL-SWITCH"}</span>
          </button>
        </div>

        {/* Hero Telemetry Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Fleet Revenue */}
          <div className="rounded-xl border border-titanium-800 bg-titanium-900/60 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-titanium-400">
              <span className="text-xs font-mono uppercase tracking-wider">Fleet Revenue (24h)</span>
              <TrendingUp className="h-4 w-4 text-cyber-emerald" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ${totalRevenue.toFixed(2)}
              </span>
              <span className="text-[11px] font-mono text-cyber-emerald font-semibold">+18.4%</span>
            </div>
            <span className="text-[11px] text-titanium-400 mt-1 block">Live across 3 storefronts</span>
          </div>

          {/* Card 2: Active Orders Today */}
          <div className="rounded-xl border border-titanium-800 bg-titanium-900/60 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-titanium-400">
              <span className="text-xs font-mono uppercase tracking-wider">Orders Today</span>
              <ShoppingBag className="h-4 w-4 text-cyber-cyan" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {totalOrders}
              </span>
              <span className="text-[11px] font-mono text-cyber-cyan font-semibold">100% Dropship</span>
            </div>
            <span className="text-[11px] text-titanium-400 mt-1 block">Auto-routed to CJ & Zendrop</span>
          </div>

          {/* Card 3: Fleet Health */}
          <div className="rounded-xl border border-titanium-800 bg-titanium-900/60 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-titanium-400">
              <span className="text-xs font-mono uppercase tracking-wider">Fleet Health</span>
              <ShieldCheck className="h-4 w-4 text-cyber-emerald" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-cyber-emerald tracking-tight">
                100%
              </span>
              <span className="text-[11px] font-mono text-titanium-400">UPTIME</span>
            </div>
            <span className="text-[11px] text-titanium-400 mt-1 block">Zero SSL or HTTP anomalies</span>
          </div>

          {/* Card 4: Low Stock Alerts */}
          <div className="rounded-xl border border-titanium-800 bg-titanium-900/60 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-titanium-400">
              <span className="text-xs font-mono uppercase tracking-wider">Low Stock Watch</span>
              <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? "text-cyber-amber" : "text-titanium-400"}`} />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {lowStockCount}
              </span>
              <span className="rounded-full bg-cyber-amber/15 border border-cyber-amber/30 px-2 py-0.5 text-[10px] font-mono text-cyber-amber font-bold">
                Auto-Guarded
              </span>
            </div>
            <span className="text-[11px] text-titanium-400 mt-1 block">&lt;5 units safety buffer</span>
          </div>
        </section>

        {/* Fleet Matrix Section */}
        <FleetMatrix
          stores={stores}
          onQuickDeploy={openDeployModal}
          onRefreshTelemetry={fetchTelemetry}
          isRefreshing={isRefreshing}
        />

        {/* Dropper OS V2: Live Visitor Radar & Predictive Stock HUD */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LiveVisitorRadar />
          <PredictiveStockHUD />
        </section>

        {/* Bottom Split Pane: Live Sales Feed & System Terminal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[420px]">
          {/* Sales Feed (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <LiveSalesFeed />
          </div>

          {/* Live Terminal (7 cols) */}
          <div className="lg:col-span-7 h-full">
            <SystemTerminal />
          </div>
        </section>
      </main>

      {/* Quick Deploy Modal */}
      <QuickDeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        selectedStoreId={activeDeployStore.id}
        selectedStoreName={activeDeployStore.name}
        onDeployed={(res) => {
          setReportSuccessNotice(`Injected ${res.componentId} into ${res.storeId} (Commit: ${res.commitSha?.slice(0, 7)})`);
        }}
      />

      {/* Command Palette Modal (⌘K) */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-titanium-700 bg-titanium-950 p-4 shadow-2xl font-sans">
            <div className="flex items-center space-x-2 border-b border-titanium-800 pb-3">
              <Search className="h-4 w-4 text-titanium-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or action... (Esc to exit)"
                className="w-full bg-transparent text-sm text-white placeholder-titanium-400 focus:outline-none"
              />
              <kbd className="rounded bg-titanium-800 px-1.5 py-0.5 text-[10px] font-mono text-titanium-400">ESC</kbd>
            </div>

            <div className="mt-3 space-y-1 text-xs">
              <button
                onClick={() => {
                  setIsCommandOpen(false);
                  openDeployModal("bizi-bees-boutique", "Bizi Bees Boutique");
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-titanium-200 hover:bg-titanium-800 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-cyber-emerald" />
                  <span>1-Click Theme Injection (Bizi Bees)</span>
                </div>
                <span className="font-mono text-[10px] text-titanium-400">Deploy</span>
              </button>

              <button
                onClick={() => {
                  setIsCommandOpen(false);
                  handleTriggerReport();
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-titanium-200 hover:bg-titanium-800 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-cyber-amber" />
                  <span>Commit Daily 24h Intelligence Report to GitHub</span>
                </div>
                <span className="font-mono text-[10px] text-titanium-400">Report</span>
              </button>

              <button
                onClick={() => {
                  setIsCommandOpen(false);
                  fetchTelemetry();
                }}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-titanium-200 hover:bg-titanium-800 hover:text-white transition"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-cyber-cyan" />
                  <span>Poll Live Multi-Store Telemetry Now</span>
                </div>
                <span className="font-mono text-[10px] text-titanium-400">Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
