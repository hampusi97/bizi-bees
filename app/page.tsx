/**
 * app/page.tsx — Dropper OS Master Wealth Portal (Next.js 15)
 * 17 independent Shopify stores, 7 super-bots, 3D scrollytelling preview modal, 4-bucket net-profit treasury.
 */
"use client";
import { useState, useEffect } from "react";

const STORES = [
  { id: "store-01-bizi-bees", name: "Bizi Bees Boutique", niche: "Curated Pre-Loved Books & Board Games", mode: "Utah Physical Hub", target: 98.04 },
  { id: "store-02-luma-clinical", name: "Luma Clinical", niche: "630nm Red-Light Facial Wands", mode: "API Dropship", target: 98.04 },
  { id: "store-03-cryo-halo", name: "CryoHalo Recovery", niche: "360 Cryotherapy Migraine Caps", mode: "API Dropship", target: 98.04 },
  { id: "store-04-sculpt-wave", name: "SculptWave Body", niche: "Ultrasonic Cavitation Sculptors", mode: "API Dropship", target: 98.04 },
  { id: "store-05-wonder-hive", name: "WonderHive Play", niche: "Tactile 10-Frame Math Fidgets & STEM", mode: "Hybrid", target: 98.04 },
  { id: "store-06-atelier-grid", name: "Atelier Grid", niche: "2027 Checkered Archival Planners", mode: "Hybrid", target: 98.04 },
  { id: "store-07-aether-sleep", name: "Aether Sleep", niche: "22-Momme Mulberry Silk Sleep Masks", mode: "API Dropship", target: 98.04 },
  { id: "store-08-kova-brew", name: "Kova Brew", niche: "0.1g Flow-Rate Espresso Scales", mode: "API Dropship", target: 98.04 },
  { id: "store-09-spine-align", name: "SpineAlign Studio", niche: "Heated Graphene Cervical Traction", mode: "API Dropship", target: 98.04 },
  { id: "store-10-terra-paw", name: "TerraPaw Co.", niche: "Orthopedic Calming Dog Beds", mode: "API Dropship", target: 98.04 },
  { id: "store-11-nomad-carry", name: "NomadCarry", niche: "40L Vacuum-Compression Backpacks", mode: "API Dropship", target: 98.04 },
  { id: "store-12-solace-aroma", name: "Solace Aroma", niche: "Cold-Air Nebulizing Diffusers", mode: "API Dropship", target: 98.04 },
  { id: "store-13-kinetic-grip", name: "KineticGrip", niche: "CNC Billet Forearm Dynamometers", mode: "API Dropship", target: 98.04 },
  { id: "store-14-lumen-desk", name: "LumenDesk", niche: "Zero-Glare Monitor Light Bars", mode: "API Dropship", target: 98.04 },
  { id: "store-15-verde-hydro", name: "VerdeHydro", niche: "Brass Halo Grow Lights & Planters", mode: "API Dropship", target: 98.04 },
  { id: "store-16-apex-stride", name: "ApexStride", niche: "Carbon-Plated Running Insoles", mode: "API Dropship", target: 98.04 },
  { id: "store-17-chrono-forge", name: "ChronoForge", niche: "Grade-5 Titanium Field Watches", mode: "API Dropship", target: 98.04 },
];

const BOTS = [
  { id: "01-omega-bot", name: "OmegaBot", role: "Master Orchestrator & Self-Debugger", phase: 1 },
  { id: "02-hunter-psych-bot", name: "HunterPsychBot", role: "Product Research & Psychology", phase: 2 },
  { id: "03-architect-bot", name: "ArchitectBot", role: "17 Unique Themes & 3D Scrollytelling", phase: 3 },
  { id: "04-promo-loyalty-bot", name: "PromoLoyaltyBot", role: "Digital Bump, B2B Portal & VIP Club", phase: 4 },
  { id: "05-traffic-tool-bot", name: "TrafficToolBot", role: "Micro-Tools, Affiliates & Shopping Feeds", phase: 5 },
  { id: "06-supply-bot", name: "SupplyBot", role: "DIGITAL / DROP / UTAH Fulfillment", phase: 6 },
  { id: "07-treasury-bot", name: "TreasuryBot", role: "P&L, 4-Bucket Treasury & Reporting", phase: 7 },
];

const ENGINES = [
  { n: "1", name: "Physical 3-Tier Bundles", desc: "12 winning products × 17 stores, 3D scrollytelling + bundle psychology", share: "55%" },
  { n: "2", name: "100%-Profit Digital Order Bumps", desc: "$12–$19 Masterclass & Vault checkbox in every cart drawer ($0 COGS)", share: "15%" },
  { n: "3", name: "Monthly Recurring Subscriptions", desc: "VIP club replenishment + refill flows via email engine", share: "10%" },
  { n: "4", name: "B2B Bulk Orders", desc: "B2B30 (10+) / B2B35 (25+) portal for schools, clinics, spas, offices", share: "12%" },
  { n: "5", name: "Affiliate & Cross-Store Pollination", desc: "20% creator army + comparison matrices, zero ad spend", share: "8%" },
];

const BUCKETS = [
  { name: "COGS Float", pct: 35, amt: 4494 },
  { name: "Growth / Ads", pct: 25, amt: 3210 },
  { name: "Tax Reserve", pct: 20, amt: 2568 },
  { name: "Owner Take-Home", pct: 20, amt: 2568 },
];

export default function DropperOSPage() {
  const [revenueToday, setRevenueToday] = useState<number>(0);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; storeId?: string }>({ open: false });

  useEffect(() => {
    // Load state from API or localStorage / mock
    try {
      const stored = localStorage.getItem("dropper_rev");
      if (stored) setRevenueToday(Number(stored));
      setLastRun(new Date().toISOString());
    } catch {}
  }, []);

  const DAILY = 1667, STRETCH = 5000;
  const pace = Math.round((revenueToday / DAILY) * 100);
  const stretch = Math.round((revenueToday / STRETCH) * 100);

  return (
    <div style={{ background: "#09090B", color: "#E5E7EB", minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <header style={{ padding: "1.25rem 2rem", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 32, height: 32, background: "#F59E0B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#000" }}>OS</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>Dropper OS — 17 Store Fleet Wealth Portal</h1>
        </div>
        <div style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>17 distinct stores · 7 super-bots · $50K/mo target{lastRun ? ` · active 24/7` : ""}</div>
      </header>
      <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", margin: 0 }}>North Star: $50,000/mo — $1,667/day → $5,000/day stretch</h2>
            <button onClick={() => { const r = revenueToday + 185; setRevenueToday(r); localStorage.setItem("dropper_rev", String(r)); }} style={{ background: "#F59E0B", color: "#000", border: "none", padding: "6px 12px", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: "0.75rem" }}>
              + Simulate Sale ($185)
            </button>
          </div>
          <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 12, height: 40, overflow: "hidden", marginTop: 8 }}>
            <div style={{ background: "#F59E0B", height: "100%", width: `${Math.min(pace, 100)}%`, transition: "width 0.3s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#9CA3AF", marginTop: 6 }}>
            <span>Fleet revenue today: ${revenueToday.toLocaleString()}</span><span>{pace}% of $1,667/day</span><span>{stretch}% of $5,000/day stretch</span><span>17 stores ($98.04/day target each)</span>
          </div>
        </section>
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>5 Money-Making Engines</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12, marginTop: 12 }}>
            {ENGINES.map((e) => (
              <div key={e.n} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 10, padding: "1rem" }}>
                <div style={{ color: "#F59E0B", fontWeight: 800 }}>Engine {e.n} · {e.share}</div>
                <div style={{ fontWeight: 700, margin: "4px 0" }}>{e.name}</div>
                <div style={{ fontSize: "0.82rem", color: "#9CA3AF" }}>{e.desc}</div>
              </div>
            ))}
          </div>
        </section>
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>7 Department Super-Bots</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginTop: 12 }}>
            {BOTS.map((b) => (
              <div key={b.id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>PHASE {b.phase}</div>
                <div style={{ fontWeight: 700 }}>{b.name}</div>
                <div style={{ fontSize: "0.82rem", color: "#9CA3AF", margin: "4px 0 8px" }}>{b.role}</div>
                <span style={{ fontSize: "0.75rem", color: "#22C55E" }}>● Active 24/7</span>
              </div>
            ))}
          </div>
        </section>
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>17 Independent Shopify Stores (Click for Store Page & Branch)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12, marginTop: 12 }}>
            {STORES.map((s) => (
              <div key={s.id} style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{s.mode}</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{s.name}</div>
                  <div style={{ fontSize: "0.82rem", color: "#9CA3AF", margin: "4px 0" }}>{s.niche}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: "0.78rem", color: "#F59E0B", fontWeight: 700 }}>${s.target.toFixed(2)}/day target</span>
                  <a href={`/stores/${s.id}/`} target="_blank" rel="noreferrer" style={{ background: "#1F2937", color: "#E5E7EB", padding: "4px 8px", borderRadius: 6, fontSize: "0.75rem", textDecoration: "none", fontWeight: 700 }}>
                    Open Store →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF" }}>4-Bucket Net-Profit Treasury</h2>
          <div style={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 10, padding: "1.25rem", marginTop: 12 }}>
            {BUCKETS.map((b) => (
              <div key={b.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1F2937" }}>
                <span>{b.name} ({b.pct}%)</span><strong>${b.amt.toLocaleString()}</strong>
              </div>
            ))}
            <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 10 }}>35% COGS float · 25% growth/ads · 20% tax reserve · 20% owner take-home. Managed by TreasuryBot.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
