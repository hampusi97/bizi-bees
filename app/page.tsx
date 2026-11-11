"use client";

import React, { useState, useEffect } from "react";
import type { StoreTelemetry, FleetState } from "./api/fleet/route";
import storeMatrix from "@/config/store_matrix.json";

const STORE_PRESETS: Record<string, { label: string; query: string }[]> = {
  "bizi-bees": [
    { label: "Cozy Mystery Crate", query: "Curate a rainy Sunday evening blind date reading crate with cozy vibe" },
    { label: "Brass Bookmark Gift", query: "Tell me how the solid brass honeybee bookmark unlocks with the VIP bundle" },
    { label: "Utah 24h Shipping", query: "When will my vintage gift crate dispatch from Salt Lake City?" }
  ],
  "luma-clinical": [
    { label: "4-in-1 Wand Protocol", query: "What is the best 3-step routine for crow's feet and morning puffiness?" },
    { label: "Peptide Serum Unlocked", query: "How does the Activating Peptide Serum maximize microcurrent results?" },
    { label: "Red vs Blue Light", query: "Explain the clinical difference between red light collagen synthesis and blue light pore clearing" }
  ],
  "luma-relief": [
    { label: "Migraine Cold Therapy", query: "How long should I chill the 360° Cold Compression Cap before tension relief?" },
    { label: "Sinus Acupressure Roller", query: "How do I use the complimentary Herbal Sinus Roller with the cap?" }
  ],
  "fizz-lab": [
    { label: "Dirty Dr Pepper Recipe", query: "Mix me an at-home Utah dirty soda with coconut, fresh lime, and vanilla cream foam" },
    { label: "Electric Frother Guide", query: "How do I froth heavy cream into silky dirty soda cold foam?" }
  ],
  "crave-lab": [
    { label: "4-Bar Tasting Box", query: "Curate a luxury 4-bar Belgian dark chocolate bento box for an anniversary gift" },
    { label: "Smoked Sea Salt Bar", query: "Describe the flavor profile of the complimentary Smoked Sea Salt dark tasting bar" }
  ],
  "aura-sculpt": [
    { label: "Pilates Sculpt Set", query: "Recommend sizing and compression level for high-intensity reformer pilates" },
    { label: "Grip Socks Pairing", query: "How do the CloudSoft non-slip grip socks complement the sculpt set?" }
  ],
  "pawglow": [
    { label: "Ultrasonic Steam Brush", query: "How does ultrasonic cool mist safely deshed a double-coat golden retriever?" },
    { label: "Lavender Coat Mist", query: "When do I apply the complimentary Organic Lavender Coat Mist?" }
  ],
  "zenith-sleep": [
    { label: "3D Zero-Pressure Mask", query: "How does zero-eye-pressure 3D contouring improve REM sleep latency?" },
    { label: "Bluetooth Audio Sleep", query: "Best binaural sleep frequency to stream through the ultra-thin speakers" }
  ],
  "aura-posture": [
    { label: "Smart Haptic Sensor", query: "What angle threshold triggers the gentle haptic vibration for spine alignment?" },
    { label: "Ergonomic Wrist Rest", query: "How does the gel wrist rest prevent carpal strain during 8-hour desk work?" }
  ],
  "lumicarve": [
    { label: "Glass & Metal Etching", query: "Which RPM speed and diamond burr bit should I use for custom glass bottle engraving?" },
    { label: "30-Piece Burr Kit", query: "How does the 30-piece diamond bit kit handle wood, acrylic, and titanium?" }
  ],
  "dermasonic": [
    { label: "Ultrasonic Pore Scrubber", query: "What is the optimal angle to hold the water-ion scrubber for blackhead extraction?" },
    { label: "Botanical Toner Protocol", query: "How does the Pore-Melting Toner soften sebum before ultrasonic scraping?" }
  ],
  "calmcore": [
    { label: "Herbal Weighted Wrap", query: "Microwave heating duration and shoulder pressure points for desk neck tension" },
    { label: "Aromatherapy Roll-On", query: "How to combine the lavender chamomile roll-on with thermal clay therapy" }
  ],
  "floraspring": [
    { label: "Terracotta Spikes", query: "How many days of automatic moisture do terracotta spikes provide for a Monstera?" },
    { label: "Plant Food Drops", query: "How do I dilute the organic liquid plant food for weekly maintenance?" }
  ],
  "velobrew": [
    { label: "20-Bar Trail Espresso", query: "How do I extract a rich double shot with crema on a windy mountain ridge?" },
    { label: "Dosing Ring & Tamper", query: "Why is the stainless steel dosing ring essential for trailside brewing?" }
  ]
};

const STORE_ACCENTS: Record<string, string> = {
  "bizi-bees": "#D9822B",
  "luma-clinical": "#38BDF8",
  "luma-relief": "#8B5CF6",
  "fizz-lab": "#F43F5E",
  "crave-lab": "#D97706",
  "aura-sculpt": "#10B981",
  "pawglow": "#A855F7",
  "zenith-sleep": "#6366F1",
  "aura-posture": "#14B8A6",
  "lumicarve": "#EAB308",
  "dermasonic": "#EC4899",
  "calmcore": "#06B6D4",
  "floraspring": "#22C55E",
  "velobrew": "#F97316",
  "ember-oak": "#B45309"
};

const getStoreAccent = (storeId?: string) => (storeId && STORE_ACCENTS[storeId]) || "#10B981";

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

  // Google AI Studio Master Tabs
  const [studioMode, setStudioMode] = useState<"apps" | "storefronts" | "design">("apps");

  // Tab 1: 14-Store AI Apps State
  const [appStoreId, setAppStoreId] = useState<string>("bizi-bees");
  const [appQuery, setAppQuery] = useState<string>("Curate a rainy Sunday evening blind date reading crate with cozy vibe");
  const [appType, setAppType] = useState<string>("recommendation");
  const [appLoading, setAppLoading] = useState<boolean>(false);
  const [appResult, setAppResult] = useState<{
    success: boolean;
    storeId: string;
    storeName: string;
    hero: string;
    price: string;
    bundlePrice: string;
    freeGift: string;
    accentColor: string;
    model: string;
    keyIndex: number;
    response: string;
  } | null>(null);

  // Tab 2: 14-Store AI Storefronts State
  const [inspectStoreId, setInspectStoreId] = useState<string>("bizi-bees");
  const [inspectLiquidCode, setInspectLiquidCode] = useState<string>("");
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [regeneratingStoreId, setRegeneratingStoreId] = useState<string | null>(null);
  const [storefrontStatusMsg, setStorefrontStatusMsg] = useState<string | null>(null);
  const [inspectCopied, setInspectCopied] = useState<boolean>(false);

  // Tab 3: Google AI Studio DTC Design State
  const [selectedDesignStore, setSelectedDesignStore] = useState<string>("bizi-bees");
  const [designGoal, setDesignGoal] = useState<string>("Hero Banner & Value Props");
  const [designAesthetic, setDesignAesthetic] = useState<string>(
    "Warm Tactile Craft & Vintage Kraft (Bizi Bees™ Heritage)"
  );
  const [designPromptCustom, setDesignPromptCustom] = useState<string>("");
  const [isGeneratingDesign, setIsGeneratingDesign] = useState<boolean>(false);
  const [designResult, setDesignResult] = useState<{
    success: boolean;
    content: string;
    model?: string;
    keyIndex?: number;
    storeName?: string;
    designGoal?: string;
    aesthetic?: string;
  } | null>(null);
  const [designTab, setDesignTab] = useState<"spec" | "code" | "raw">("spec");
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

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

  // Quick Action Handler for Store Table
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

  // Google AI Studio Generator Handler
  const handleGenerateDesign = async () => {
    const currentStore =
      fleet?.stores.find((s) => s.id === selectedDesignStore) ||
      fleet?.stores[0] || {
        id: "bizi-bees",
        name: "Bizi Bees™",
        niche: "Blind Date with a Book & Sensory Kits",
      };

    setIsGeneratingDesign(true);
    setDesignResult(null);

    try {
      const fullGoal = designPromptCustom
        ? `${designGoal} — Directive: ${designPromptCustom}`
        : designGoal;

      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentStore.id,
          storeName: currentStore.name,
          niche: currentStore.niche,
          designGoal: fullGoal,
          aesthetic: designAesthetic,
        }),
      });

      const data = await res.json();

      if (data.success && data.content) {
        setDesignResult(data);
        setTerminalLogs((prev) => [
          {
            id: `design-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            store: currentStore.name,
            level: "SUCCESS",
            message: `🎨 Google AI Studio synthesized ${designGoal} (${data.model}, Key #${data.keyIndex})`,
          },
          ...prev,
        ]);
      } else {
        alert("Design generation error: " + (data.error || "Please check API keys"));
      }
    } catch (e: any) {
      console.error("Google AI Studio design generation failed", e);
      alert("Failed to connect to Google AI Studio design endpoint");
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  // 14-Store AI App Handler
  const handleRunApp = async (overrideQuery?: string) => {
    const q = overrideQuery || appQuery;
    if (!q.trim()) return;

    setAppLoading(true);
    try {
      const res = await fetch("/api/ai/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: appStoreId,
          query: q,
          appType: appType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAppResult(data);
        setTerminalLogs((prev) => [
          {
            id: `app-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            store: data.storeName,
            level: "SUCCESS",
            message: `📱 AI App consultation complete (${data.model}, Key #${data.keyIndex})`,
          },
          ...prev,
        ]);
      } else {
        alert("AI App Error: " + (data.error || "Failed to generate"));
      }
    } catch (err: any) {
      console.error("AI App error:", err);
      alert("Failed to communicate with AI App endpoint");
    } finally {
      setAppLoading(false);
    }
  };

  // 14-Store Storefront Section Inspect Handler
  const handleInspectStorefront = async (storeId: string) => {
    setInspectStoreId(storeId);
    setInspectLoading(true);
    try {
      const res = await fetch(`/api/ai/storefront?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.code) {
        setInspectLiquidCode(data.code);
        setStorefrontStatusMsg(`Loaded sections/storefront-${storeId}.liquid (${data.size} bytes)`);
      } else {
        setInspectLiquidCode(`<!-- Section file sections/storefront-${storeId}.liquid not loaded yet. Click Regenerate to build it. -->`);
        setStorefrontStatusMsg(`No section found for ${storeId}`);
      }
    } catch (e: any) {
      console.error("Storefront inspection failed:", e);
    } finally {
      setInspectLoading(false);
    }
  };

  // 14-Store Storefront Section Regenerate Handler
  const handleRegenerateStorefront = async (storeId: string) => {
    setRegeneratingStoreId(storeId);
    setStorefrontStatusMsg(`Synthesizing fresh Shopify storefront for ${storeId} via Google AI Studio...`);
    try {
      const res = await fetch("/api/ai/storefront", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, saveToFile: true }),
      });
      const data = await res.json();
      if (data.success && data.liquidCode) {
        setInspectStoreId(storeId);
        setInspectLiquidCode(data.liquidCode);
        setStorefrontStatusMsg(`✓ Saved sections/storefront-${storeId}.liquid (${data.size} bytes) via ${data.model} (Key #${data.keyIndex})`);
        setTerminalLogs((prev) => [
          {
            id: `sf-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            store: data.storeName,
            level: "SUCCESS",
            message: `🎨 Shopify storefront regenerated: sections/storefront-${storeId}.liquid (${data.model})`,
          },
          ...prev,
        ]);
      } else {
        setStorefrontStatusMsg(`Error: ${data.error || "Generation failed"}`);
      }
    } catch (e: any) {
      setStorefrontStatusMsg(`Error: ${e.message}`);
    } finally {
      setRegeneratingStoreId(null);
    }
  };

  // Extract code from generated markdown
  const extractCode = (markdown: string) => {
    const match = markdown.match(/```(?:liquid|html|css|javascript)?([\s\S]*?)```/i);
    return match ? match[1].trim() : markdown;
  };

  const handleCopyCode = () => {
    if (!designResult?.content) return;
    const code = extractCode(designResult.content);
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const totalRevenue =
    fleet?.stores.reduce((acc, s) => acc + s.revenue24h, 0) || 0;
  const targetRevenue = fleet?.targetRevenueDaily || 23333.33;
  const revenuePct = Math.min(
    100,
    Number(((totalRevenue / targetRevenue) * 100).toFixed(1))
  );

  const totalOrders =
    fleet?.stores.reduce((acc, s) => acc + s.orders24h, 0) || 0;
  const targetOrders = fleet?.targetOrdersDaily || 364;
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-[#10B981]/10 via-[#8B5CF6]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#090D16]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
              <span className="text-xl">🌐</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  REPO-OS™ MISSION CONTROL
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#1E293B] text-[#94A3B8] rounded border border-[#334155]">
                  v2.5 AI Studio
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] tracking-wide">
                Unified Autonomous Shopify Fleet Command • 14 Direct DTC Storefronts • Dual Google AI Studio Keys
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Quick jump to AI Studio */}
            <a
              href="#google-ai-design-studio"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8B5CF6]/20 to-[#38BDF8]/20 border border-[#8B5CF6]/40 text-xs font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/30 transition-all"
            >
              <span>🎨</span>
              <span>AI Design Studio</span>
            </a>

            {/* Live Fleet Health Badge */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#10B981] mr-2 animate-ping" />
              <span>🟢 14 of 14 Stores Online</span>
            </div>

            {/* Refresh Telemetry Button */}
            <button
              onClick={fetchTelemetry}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-medium text-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span className="hidden sm:inline">
                {refreshing ? "Polling..." : "Refresh"}
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
              Target: <strong className="text-[#94A3B8]">$23,333.33/day</strong> ($700k/mo run-rate)
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
              Daily Volume Target: <strong className="text-[#94A3B8]">364 orders/day</strong> across 14 stores
            </p>
            <div className="w-full bg-[#1E293B] h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#38BDF8] to-[#10B981] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${ordersPct}%` }}
              />
            </div>
          </div>

          {/* Card 3: Google AI Studio Dual-Key Status */}
          <div className="p-6 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl relative overflow-hidden group hover:border-[#8B5CF6]/40 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl select-none group-hover:scale-110 transition-transform">
              ✨
            </div>
            <div className="text-xs uppercase tracking-widest text-[#94A3B8] font-bold mb-1">
              Google AI Studio Engines
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#A78BFA] tracking-tight flex items-center gap-2">
              <span>Dual-Key Active</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/40 font-mono">
                Gemini 3.5
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              Keys: <strong className="text-[#10B981]">Key 1 Active</strong> • <strong className="text-[#38BDF8]">Key 2 Hot-Standby</strong>
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#94A3B8]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
              <span>Live theme design, catalog AI concierge & SEO auto-pilot</span>
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

        {/* 14-Store Fleet Management Matrix */}
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
                Direct telemetry, autonomous intervention, and 1-click Google AI Studio design synthesis across all 14 brands
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
                        className={`hover:bg-[#131D33] transition-colors group ${
                          selectedDesignStore === store.id ? "bg-[#8B5CF6]/5" : ""
                        }`}
                      >
                        {/* Store Identity */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                              {store.name}
                            </span>
                            {store.id === "bizi-bees" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 uppercase tracking-wider">
                                🐝 Flagship Store
                              </span>
                            )}
                            {store.id === "luma-clinical" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 uppercase tracking-wider">
                                🔬 Clinical Lab
                              </span>
                            )}
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
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            {/* Action 1: AI App */}
                            <button
                              onClick={() => {
                                setAppStoreId(store.id);
                                setStudioMode("apps");
                                document
                                  .getElementById("google-ai-design-studio")
                                  ?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-2 py-0.5 rounded bg-[#090D16] hover:bg-[#38BDF8]/20 border border-[#38BDF8]/40 hover:border-[#38BDF8] text-[10px] font-semibold text-[#38BDF8] transition-all flex items-center gap-1"
                              title={`Launch ${store.name} Google AI App`}
                            >
                              <span>📱</span>
                              <span>AI App</span>
                            </button>

                            {/* Action 2: Storefront */}
                            <button
                              onClick={() => {
                                setInspectStoreId(store.id);
                                setStudioMode("storefronts");
                                handleInspectStorefront(store.id);
                                document
                                  .getElementById("google-ai-design-studio")
                                  ?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-2 py-0.5 rounded bg-[#090D16] hover:bg-[#10B981]/20 border border-[#10B981]/40 hover:border-[#10B981] text-[10px] font-semibold text-[#10B981] transition-all flex items-center gap-1"
                              title={`Inspect/Regenerate ${store.name} Storefront Liquid Section`}
                            >
                              <span>🏛️</span>
                              <span>Storefront</span>
                            </button>

                            {/* Action 3: Design with Google AI Studio */}
                            <button
                              onClick={() => {
                                setSelectedDesignStore(store.id);
                                setStudioMode("design");
                                document
                                  .getElementById("google-ai-design-studio")
                                  ?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-2 py-0.5 rounded bg-[#090D16] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 hover:border-[#8B5CF6] text-[10px] font-semibold text-[#C4B5FD] transition-all flex items-center gap-1"
                              title={`Launch Google AI Studio design synthesis for ${store.name}`}
                            >
                              <span>🎨</span>
                              <span>Design</span>
                            </button>

                            {/* Action 4: Run Healer */}
                            <button
                              onClick={() => handleStoreAction(store.id, "run_healer")}
                              disabled={isHealing}
                              className="px-2 py-0.5 rounded bg-[#090D16] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#10B981]/50 text-[10px] font-medium text-[#10B981] transition-all disabled:opacity-50 flex items-center gap-1"
                              title="Audit images, repair broken links, and verify checkout API"
                            >
                              {isHealing ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <span>🛡️</span>
                              )}
                              <span>Heal</span>
                            </button>

                            {/* Action 5: Admin ↗ */}
                            <a
                              href={store.adminUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded bg-[#090D16] hover:bg-[#1E293B] border border-[#1E293B] hover:border-white/30 text-[10px] font-medium text-[#CBD5E1] transition-all"
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

        {/* GOOGLE AI STUDIO MULTI-STORE DESIGN & APPS SUITE */}
        <section
          id="google-ai-design-studio"
          className="rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] border-2 border-[#8B5CF6]/30 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Google AI Studio Multi-Store Intelligence
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6]/30 to-[#38BDF8]/30 border border-[#8B5CF6]/50 text-[10px] font-bold uppercase tracking-wider text-[#C4B5FD]">
                  Gemini Flash-Lite Multi-Key Mesh
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Autonomous AI Apps, dynamic Shopify OS 2.0 storefront synthesis, and DTC component design for all 14 fleet brands.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                Dual Gemini API Keys Online
              </span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center space-x-2 border-b border-[#1E293B] pb-3 relative z-10 overflow-x-auto">
            <button
              onClick={() => setStudioMode("apps")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                studioMode === "apps"
                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-[#8B5CF6]/25"
                  : "bg-[#090D16] text-[#94A3B8] hover:text-white border border-[#1E293B]"
              }`}
            >
              <span>📱</span>
              <span>14-Store AI Apps</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">Live Gemini</span>
            </button>

            <button
              onClick={() => {
                setStudioMode("storefronts");
                if (!inspectLiquidCode) {
                  handleInspectStorefront(inspectStoreId);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                studioMode === "storefronts"
                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-[#8B5CF6]/25"
                  : "bg-[#090D16] text-[#94A3B8] hover:text-white border border-[#1E293B]"
              }`}
            >
              <span>🏛️</span>
              <span>14-Store AI Storefronts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#10B981]/30 text-[#10B981] text-[10px]">14/14 Synced</span>
            </button>

            <button
              onClick={() => setStudioMode("design")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                studioMode === "design"
                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-[#8B5CF6]/25"
                  : "bg-[#090D16] text-[#94A3B8] hover:text-white border border-[#1E293B]"
              }`}
            >
              <span>🎨</span>
              <span>DTC Component Synthesizer</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">CRO Prompting</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: 14-STORE AI APPS                                 */}
          {/* ======================================================== */}
          {studioMode === "apps" && (() => {
            const activeAppStore =
              storeMatrix.find((s) => s.store_id === appStoreId) || storeMatrix[0];
            const presets = STORE_PRESETS[appStoreId] || [];

            return (
              <div className="space-y-6 relative z-10">
                {/* Store Selector Pill Strip */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wider">
                    Select Fleet Brand to Consult:
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {storeMatrix.map((st) => {
                      const isSelected = st.store_id === appStoreId;
                      return (
                        <button
                          key={st.store_id}
                          onClick={() => {
                            setAppStoreId(st.store_id);
                            const p = STORE_PRESETS[st.store_id];
                            if (p && p.length > 0) {
                              setAppQuery(p[0].query);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                            isSelected
                              ? "bg-[#1E293B] text-white border-[#38BDF8] shadow-md shadow-[#38BDF8]/10"
                              : "bg-[#090D16] text-[#94A3B8] hover:text-white border-[#1E293B]"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: (st as any).theme_accent || getStoreAccent(st.store_id) }}
                          />
                          <span>{st.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Store Showcase Card */}
                <div
                  className="rounded-2xl p-4 sm:p-5 border transition-all"
                  style={{
                    backgroundColor: "#0B111E",
                    borderColor: `${(activeAppStore as any).theme_accent || getStoreAccent(activeAppStore.store_id)}40`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: (activeAppStore as any).theme_accent || getStoreAccent(activeAppStore.store_id) }}
                        />
                        <h3 className="text-base font-black text-white">
                          {activeAppStore.name} AI Specialist
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#CBD5E1]">
                          {activeAppStore.niche}
                        </span>
                      </div>
                      <div className="text-xs text-[#94A3B8] mt-1">
                        Hero Product: <strong className="text-white">{activeAppStore.hero}</strong> (${activeAppStore.price}) • VIP Bundle: <strong className="text-[#10B981]">${activeAppStore.bundle_price}</strong>
                      </div>
                      <div className="text-xs text-[#F59E0B] mt-0.5">
                        🎁 Complimentary VIP Gift: <strong>{activeAppStore.free_gift}</strong>
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="inline-flex rounded-xl bg-[#06090F] p-1 border border-[#1E293B] text-xs">
                      {[
                        { id: "recommendation", label: "Concierge / Stylist" },
                        { id: "routine", label: "Ritual / Protocol" },
                        { id: "customizer", label: "Customizer" },
                        { id: "troubleshooting", label: "Troubleshooting" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setAppType(m.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                            appType === m.id
                              ? "bg-[#38BDF8] text-[#0B111E] font-bold"
                              : "text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Preset Prompt Chips */}
                  {presets.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#1E293B]/70 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                        Suggested Scenarios:
                      </span>
                      {presets.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAppQuery(preset.query);
                            handleRunApp(preset.query);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#131D33] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#38BDF8]/40 text-[11px] text-[#CBD5E1] transition-all flex items-center gap-1"
                        >
                          <span>💬</span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Query Input Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                    Customer Query / Diagnostic Brief
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={appQuery}
                      onChange={(e) => setAppQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleRunApp();
                        }
                      }}
                      placeholder={`Ask ${activeAppStore.name}'s Google AI App anything...`}
                      className="flex-1 bg-[#090D16] border border-[#334155] focus:border-[#38BDF8] text-xs text-white placeholder-[#64748B] rounded-xl px-4 py-3 outline-none transition-colors"
                    />
                    <button
                      onClick={() => handleRunApp()}
                      disabled={appLoading || !appQuery.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] via-[#0284C7] to-[#2563EB] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#38BDF8]/20 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      {appLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Consulting Gemini...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Run AI App</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI App Response Box */}
                {appResult && (
                  <div className="rounded-2xl bg-[#090D16] border border-[#38BDF8]/40 overflow-hidden shadow-2xl">
                    <div className="px-5 py-3 bg-[#0F172A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#10B981]">●</span>
                        <span className="text-xs font-bold text-white">
                          {appResult.storeName} AI App Response
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                          {appResult.model} • Key #{appResult.keyIndex}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B]">
                        Live Google AI Studio Interaction
                      </span>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Response Prose */}
                      <div className="text-xs leading-relaxed text-[#CBD5E1] whitespace-pre-wrap font-sans">
                        {appResult.response}
                      </div>

                      {/* Interactive VIP Bundle Conversion Card */}
                      <div
                        className="rounded-xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-4 mt-4"
                        style={{
                          backgroundColor: "#0B111E",
                          borderColor: `${appResult.accentColor}60`,
                        }}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                            Recommended VIP Bundle
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">
                            {appResult.hero}
                          </h4>
                          <div className="text-xs text-[#94A3B8] mt-0.5">
                            Solo: ${appResult.price} • <strong className="text-white">VIP Bundle: ${appResult.bundlePrice}</strong>
                          </div>
                          <div className="text-xs text-[#F59E0B] font-semibold mt-1">
                            🎁 Unlocked: {appResult.freeGift}
                          </div>
                        </div>

                        <a
                          href={`https://${activeAppStore.domain}/collections/all`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105"
                          style={{ backgroundColor: appResult.accentColor }}
                        >
                          Add VIP Bundle (${appResult.bundlePrice}) →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* TAB 2: 14-STORE AI STOREFRONTS                           */}
          {/* ======================================================== */}
          {studioMode === "storefronts" && (
            <div className="space-y-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0B111E] p-4 rounded-2xl border border-[#1E293B]">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>🏛️ 14/14 Shopify OS 2.0 Storefront Sections</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981]">
                      Generated & Deployed
                    </span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Each section contains dynamic free shipping bars, 2-tier bundle selectors, free gift unlockers, and responsive Liquid CSS.
                  </p>
                </div>
                {storefrontStatusMsg && (
                  <span className="text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-3 py-1 rounded-lg border border-[#38BDF8]/20">
                    {storefrontStatusMsg}
                  </span>
                )}
              </div>

              {/* Master Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: 14 Store Cards (5 cols) */}
                <div className="lg:col-span-5 space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                  {storeMatrix.map((st) => {
                    const isInspecting = inspectStoreId === st.store_id;
                    const isRegenerating = regeneratingStoreId === st.store_id;

                    return (
                      <div
                        key={st.store_id}
                        onClick={() => handleInspectStorefront(st.store_id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isInspecting
                            ? "bg-[#131D33] border-[#38BDF8] shadow-md shadow-[#38BDF8]/10"
                            : "bg-[#090D16] border-[#1E293B] hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: (st as any).theme_accent || getStoreAccent(st.store_id) }}
                            />
                            <span className="font-bold text-xs text-white">
                              {st.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            sections/storefront-{st.store_id}.liquid
                          </span>
                        </div>

                        <div className="text-[11px] text-[#94A3B8] mt-1 truncate">
                          {st.hero} • ${st.price} / ${st.bundle_price}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1E293B]/60 text-[10px]">
                          <span className="text-[#F59E0B] truncate">
                            🎁 {st.free_gift}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateStorefront(st.store_id);
                            }}
                            disabled={isRegenerating}
                            className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-[#334155] text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {isRegenerating ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              <span>🔄</span>
                            )}
                            <span>Regen</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Liquid Code Inspector (7 cols) */}
                <div className="lg:col-span-7 rounded-2xl bg-[#06090F] border border-[#1E293B] flex flex-col h-[650px] overflow-hidden shadow-2xl">
                  {/* Top Bar */}
                  <div className="px-4 py-3 bg-[#0B111E] border-b border-[#1E293B] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-[#38BDF8]">
                        sections/storefront-{inspectStoreId}.liquid
                      </span>
                      {inspectLoading && (
                        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (!inspectLiquidCode) return;
                        navigator.clipboard.writeText(inspectLiquidCode);
                        setInspectCopied(true);
                        setTimeout(() => setInspectCopied(false), 2000);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                    >
                      <span>{inspectCopied ? "✓ Copied!" : "📋 Copy Section"}</span>
                    </button>
                  </div>

                  {/* Code Viewport */}
                  <div className="flex-1 p-4 overflow-auto font-mono text-xs text-[#A5F3FC] leading-relaxed whitespace-pre">
                    <code>{inspectLiquidCode || "<!-- Select a store on the left to inspect its Shopify Liquid storefront section -->"}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DTC COMPONENT SYNTHESIZER                        */}
          {/* ======================================================== */}
          {studioMode === "design" && (
            <div className="space-y-6 relative z-10">
              {/* Control Bar Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Control 1: Store Target */}
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-2">
                    Target Storefront
                  </label>
                  <select
                    value={selectedDesignStore}
                    onChange={(e) => setSelectedDesignStore(e.target.value)}
                    className="w-full bg-[#090D16] border border-[#334155] focus:border-[#8B5CF6] text-xs text-white rounded-xl px-3 py-2.5 outline-none transition-colors"
                  >
                    {fleet?.stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id === "bizi-bees" ? "🐝 " : ""}
                        {s.name} ({s.niche})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Control 2: Design Target Component */}
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-2">
                    Component / Section Goal
                  </label>
                  <select
                    value={designGoal}
                    onChange={(e) => setDesignGoal(e.target.value)}
                    className="w-full bg-[#090D16] border border-[#334155] focus:border-[#8B5CF6] text-xs text-white rounded-xl px-3 py-2.5 outline-none transition-colors"
                  >
                    <option value="Hero Banner & Value Props">Hero Banner & High-AOV Value Props</option>
                    <option value="Interactive Blind Date Mystery Box Builder">Interactive Mystery Box Builder (Liquid)</option>
                    <option value="Product Showcase & Social Proof Grid">Product Showcase & Social Proof Grid</option>
                    <option value="Color Palette & CSS Design Tokens">Color Palette & CSS Design Tokens</option>
                    <option value="Trust Badges & Utah 24h Dispatch Guarantee">Trust Badges & Utah 24h Dispatch Bar</option>
                    <option value="Sticky Mobile Add-To-Cart Conversion Bar">Sticky Mobile Add-To-Cart Bar</option>
                  </select>
                </div>

                {/* Control 3: Aesthetic Tone */}
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-2">
                    Aesthetic Direction
                  </label>
                  <select
                    value={designAesthetic}
                    onChange={(e) => setDesignAesthetic(e.target.value)}
                    className="w-full bg-[#090D16] border border-[#334155] focus:border-[#8B5CF6] text-xs text-white rounded-xl px-3 py-2.5 outline-none transition-colors"
                  >
                    <option value="Warm Tactile Craft & Vintage Kraft (Bizi Bees™ Heritage)">
                      Warm Tactile Craft & Vintage Kraft (Bizi Bees™ Heritage)
                    </option>
                    <option value="Luxury Obsidian Dark Mode (Cyber-DTC)">
                      Luxury Obsidian Dark Mode (Cyber-DTC)
                    </option>
                    <option value="Ultra-Clean Scandinavian White-Glove">
                      Ultra-Clean Scandinavian White-Glove
                    </option>
                    <option value="High-Urgency Flash Sale & Conversion Blitz">
                      High-Urgency Flash Sale & Conversion Blitz
                    </option>
                  </select>
                </div>
              </div>

              {/* Custom Creative Prompt Directives */}
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-2">
                  Custom Creative Directives / Promotional Offer (Optional)
                </label>
                <input
                  type="text"
                  value={designPromptCustom}
                  onChange={(e) => setDesignPromptCustom(e.target.value)}
                  placeholder="e.g. Include real brass bookmark accents, wax seal selector, 1-click $24.00 bundle CTA, and 24h shipping guarantees..."
                  className="w-full bg-[#090D16] border border-[#334155] focus:border-[#8B5CF6] text-xs text-white placeholder-[#64748B] rounded-xl px-4 py-2.5 outline-none transition-colors"
                />
              </div>

              {/* Action Trigger Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#94A3B8]">
                  Target: <strong className="text-white">{fleet?.stores.find((s) => s.id === selectedDesignStore)?.name || "Bizi Bees™"}</strong> • Model: <span className="font-mono text-[#8B5CF6]">gemini-3.5-flash-lite</span>
                </div>

                <button
                  onClick={handleGenerateDesign}
                  disabled={isGeneratingDesign}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#8B5CF6]/30 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  {isGeneratingDesign ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing with Google AI Studio...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Synthesize Design with Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output Display Canvas */}
              {designResult && (
                <div className="mt-6 rounded-2xl bg-[#090D16] border border-[#8B5CF6]/40 overflow-hidden shadow-2xl">
                  {/* Output Sub-Header Bar */}
                  <div className="px-5 py-3.5 bg-[#0F172A] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="text-[#10B981]">●</span>
                        Generated for {designResult.storeName} ({designResult.designGoal})
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30">
                        {designResult.model} • Key #{designResult.keyIndex}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="inline-flex rounded-lg bg-[#090D16] p-0.5 border border-[#334155]">
                        <button
                          onClick={() => setDesignTab("spec")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            designTab === "spec"
                              ? "bg-[#8B5CF6] text-white"
                              : "text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          Spec & CRO
                        </button>
                        <button
                          onClick={() => setDesignTab("code")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            designTab === "code"
                              ? "bg-[#8B5CF6] text-white"
                              : "text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          Liquid Code
                        </button>
                        <button
                          onClick={() => setDesignTab("raw")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            designTab === "raw"
                              ? "bg-[#8B5CF6] text-white"
                              : "text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          Full Response
                        </button>
                      </div>

                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-1 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
                      >
                        <span>{codeCopied ? "✓ Copied!" : "📋 Copy Code"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Output Content Body */}
                  <div className="p-6 max-h-[600px] overflow-y-auto">
                    {designTab === "spec" && (
                      <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 text-[#CBD5E1]">
                        <div className="whitespace-pre-wrap font-sans">
                          {designResult.content}
                        </div>
                      </div>
                    )}

                    {designTab === "code" && (
                      <div className="relative">
                        <pre className="p-4 rounded-xl bg-[#06090F] border border-[#1E293B] font-mono text-xs text-[#38BDF8] overflow-x-auto whitespace-pre leading-normal">
                          <code>{extractCode(designResult.content)}</code>
                        </pre>
                      </div>
                    )}

                    {designTab === "raw" && (
                      <pre className="p-4 rounded-xl bg-[#06090F] border border-[#1E293B] font-mono text-[11px] text-[#94A3B8] overflow-x-auto whitespace-pre-wrap leading-normal">
                        {designResult.content}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Footer System Telemetry Status */}
        <footer className="pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <div>
            RepoOS™ Autonomous E-Commerce Fleet Engine • Cloudflare Edge Mesh Protected • Powered by Google AI Studio
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> All Edge Nodes Nominal
            </span>
            <span>Latency: 18ms</span>
            <span>Target: $700k/mo</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
