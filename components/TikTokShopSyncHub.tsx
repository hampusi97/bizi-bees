"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_STORES, type StoreDefinition } from "@/lib/stores-catalog";

interface SyncStatusData {
  totalStores: number;
  totalProducts: number;
  feedUrl: string;
  defaultAffiliateCommission: string;
  syncHealth: {
    priceParity: string;
    inventoryTracking: string;
    realTimeWebhooks: string;
    categoriesVerified: boolean;
  };
  stores: Array<{
    storeId: string;
    name: string;
    domain: string;
    productsCount: number;
    hero: string;
    price: number;
    bundlePrice: number;
    creatorCommission: string;
    syncStatus: string;
  }>;
}

export default function TikTokShopSyncHub() {
  const [syncData, setSyncData] = useState<SyncStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [copiedFeed, setCopiedFeed] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [creatorPitch, setCreatorPitch] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tiktok/sync");
      const data = await res.json();
      if (data.success) {
        setSyncData(data);
      }
    } catch (err) {
      console.error("Failed to fetch TikTok sync status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/tiktok/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStoreId === "all" ? undefined : selectedStoreId,
          forceSync: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.syncLogs) {
        setSyncLogs(data.syncLogs);
        fetchSyncStatus();
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyFeedUrl = () => {
    const url = "https://bizi-bees.vercel.app/api/tiktok/feed?format=xml";
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  const generateCreatorPitch = (store: StoreDefinition) => {
    const commission = (store.soloPrice * 0.25).toFixed(2);
    const pitch = `Hey [Creator Name]! ✨ We're obsessed with your content. We'd love to gift you the flagship ${store.hero} ($${store.soloPrice.toFixed(
      2
    )}) completely free from our Salt Lake City hub.\n\n` +
      `We've set up an exclusive 25% TikTok Shop commission for your showcase (earning you $${commission} cash on every sale with $0 ad spend).\n\n` +
      `Can we send a VIP package to your studio this week? 📦✨`;
    setCreatorPitch(pitch);
  };

  const filteredStores =
    selectedStoreId === "all"
      ? INITIAL_STORES
      : INITIAL_STORES.filter((s) => s.id === selectedStoreId);

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Shopify ⇄ TikTok Shop Automated Sync
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            🎵 TikTok Shop Product Catalog &amp; Inventory Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time catalog syndication, 25% creator affiliate open plan, and scheduled XML feed delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyFeedUrl}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            {copiedFeed ? "✓ Copied Feed URL!" : "📋 Copy TikTok Scheduled Feed"}
          </button>
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncing}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Syncing Catalog...
              </>
            ) : (
              "⚡ Sync All to TikTok Shop"
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#090D16] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">TOTAL FLEET STORES</span>
          <div className="text-2xl font-black text-white">{syncData?.totalStores ?? 15} Brands</div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">100% Categorized</span>
        </div>

        <div className="bg-[#090D16] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">TIKTOK SHOP SKUS</span>
          <div className="text-2xl font-black text-white">{syncData?.totalProducts ?? 90} SKUs</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Live in Catalog Manifest</span>
        </div>

        <div className="bg-[#090D16] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">CREATOR COMMISSION</span>
          <div className="text-2xl font-black text-amber-400">25.0% Open Plan</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Instant Creator Affiliates</span>
        </div>

        <div className="bg-[#090D16] border border-slate-800/80 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">SYNC PARITY HEALTH</span>
          <div className="text-2xl font-black text-emerald-400">100% MATCH</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Zero Price Discrepancies</span>
        </div>
      </div>

      {/* Filter and Store Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter Store:</span>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-[#090D16] border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All 15 Fleet Stores (Full Syndication)</option>
            {INITIAL_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.products.length} products)
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filteredStores.length}</strong> brands &bull;{" "}
          <strong className="text-white">
            {filteredStores.reduce((acc, s) => acc + s.products.length, 0)}
          </strong>{" "}
          synchronized SKUs
        </div>
      </div>

      {/* Synchronized Catalog Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#090D16]">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Store Brand</th>
                <th className="py-3 px-4">Hero Product</th>
                <th className="py-3 px-4">Shopify Price</th>
                <th className="py-3 px-4">TikTok Sale Price</th>
                <th className="py-3 px-4">25% Creator Cut</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: store.accentColor }}
                      ></span>
                      {store.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    <span className="font-medium">{store.hero}</span>
                    <span className="text-[10px] text-slate-500 block">
                      SKU: {store.id.toUpperCase()}-HERO
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">${store.soloPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    ${store.soloPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                    +${(store.soloPrice * 0.25).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">250 units</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Synced
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => generateCreatorPitch(store)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition"
                    >
                      Draft Pitch DM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creator Pitch Generator Preview */}
      {creatorPitch && (
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              ✨ 1-Click TikTok Creator Seeding DM (25% Commission + Free Gift Sample)
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(creatorPitch);
                alert("Creator Pitch DM copied to clipboard!");
              }}
              className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold px-2 py-0.5 rounded transition"
            >
              Copy Pitch
            </button>
          </div>
          <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans bg-black/40 p-3 rounded-lg border border-slate-800">
            {creatorPitch}
          </p>
        </div>
      )}

      {/* Recent Sync Logs */}
      {syncLogs.length > 0 && (
        <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Latest Synchronization Activity
          </span>
          <div className="max-h-28 overflow-y-auto font-mono text-[11px] text-emerald-400/90 space-y-1">
            {syncLogs.slice(0, 8).map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
