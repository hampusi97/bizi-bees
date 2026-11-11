"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { StoreTelemetry } from "@/app/api/fleet/route";

interface LiveStoresFleetSectionProps {
  stores: StoreTelemetry[];
  onProvisionAll: () => Promise<void>;
  onCreateStore: (payload: {
    name: string;
    niche: string;
    hero: string;
    soloPrice: number;
    bundlePrice: number;
    freeGift: string;
    accentColor: string;
  }) => Promise<void>;
  isProvisioning: boolean;
}

export default function LiveStoresFleetSection({
  stores,
  onProvisionAll,
  onCreateStore,
  isProvisioning,
}: LiveStoresFleetSectionProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [hero, setHero] = useState("");
  const [soloPrice, setSoloPrice] = useState("29.99");
  const [bundlePrice, setBundlePrice] = useState("49.99");
  const [freeGift, setFreeGift] = useState("Complimentary VIP Mystery Gift ($18 Value)");
  const [accentColor, setAccentColor] = useState("#10B981");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !niche.trim() || !hero.trim()) {
      setFormError("Please enter a store name, niche, and flagship hero product.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreateStore({
        name: name.trim(),
        niche: niche.trim(),
        hero: hero.trim(),
        soloPrice: Number(soloPrice) || 29.99,
        bundlePrice: Number(bundlePrice) || 49.99,
        freeGift: freeGift.trim() || "Complimentary VIP Gift",
        accentColor,
      });
      setName("");
      setNiche("");
      setHero("");
      setIsCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      {/* Header & Fleet Storefront Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">
            Live Shoppable Storefronts ({stores.length} Active Stores · 90 Categorized SKUs)
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Every store below is live with a 3-tier VIP &amp; Master bundle selector, automatic complimentary gift unlocks, 6 categorized products across 5 departments, Schema.org metadata, and express checkout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onProvisionAll}
            disabled={isProvisioning}
            className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-white transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isProvisioning ? "Provisioning All Stores..." : "Sync All 15 Storefronts"}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white transition-colors whitespace-nowrap"
          >
            + Create New Store
          </button>

          <Link
            href="/stores"
            className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] text-xs font-bold text-[#090D16] transition-colors whitespace-nowrap"
          >
            Open All 15 Stores Directory →
          </Link>
        </div>
      </div>

      {/* 15 Live Storefront Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stores.map((store) => (
          <article
            key={store.id}
            className="rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-slate-700 p-4 flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                <span className="truncate">{store.niche}</span>
                <span className="font-mono text-[#10B981] shrink-0 ml-1">LIVE</span>
              </div>

              <h3 className="text-sm font-bold text-white truncate">
                {store.name}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 min-h-[2rem]">
                {store.hero || "Flagship VIP Bundle & Collection"}
              </p>

              <div className="pt-2 border-t border-[#1E293B] text-[11px] text-[#94A3B8] space-y-1 tabular-nums">
                <div className="flex justify-between">
                  <span>Solo / VIP:</span>
                  <span className="text-white font-semibold">
                    ${(store.soloPrice || 24.99).toFixed(2)} / ${(store.bundlePrice || 44.99).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>24h Rev:</span>
                  <span className="text-[#10B981] font-mono">
                    ${store.revenue24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#1E293B]">
              <Link
                href={`/stores/${store.id}`}
                className="block w-full py-2 px-3 rounded-lg text-center text-xs font-bold text-slate-950 transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{ backgroundColor: store.accentColor || "#10B981" }}
              >
                Visit Storefront →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Create New Store Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create New Storefront"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0F172A] border border-slate-700 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Provision New DTC Storefront
                </h3>
                <p className="text-xs text-slate-400">
                  Instantly deploy a new brand into the live fleet with its own storefront route.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close modal"
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div role="alert" className="p-2.5 rounded bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-store-name" className="block text-xs text-slate-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    id="new-store-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g.Solace Matcha™"
                    className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label htmlFor="new-store-niche" className="block text-xs text-slate-300 mb-1">
                    Category / Niche *
                  </label>
                  <input
                    id="new-store-niche"
                    type="text"
                    required
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. Ceremonial Uji Matcha Kits"
                    className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-store-hero" className="block text-xs text-slate-300 mb-1">
                  Flagship Hero Product *
                </label>
                <input
                  id="new-store-hero"
                  type="text"
                  required
                  value={hero}
                  onChange={(e) => setHero(e.target.value)}
                  placeholder="e.g. First-Harvest Uji Matcha Whisk & Chawan Set"
                  className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="new-store-solo" className="block text-xs text-slate-300 mb-1">
                    Solo Price ($)
                  </label>
                  <input
                    id="new-store-solo"
                    type="number"
                    step="0.01"
                    value={soloPrice}
                    onChange={(e) => setSoloPrice(e.target.value)}
                    className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-store-bundle" className="block text-xs text-slate-300 mb-1">
                    VIP Bundle ($)
                  </label>
                  <input
                    id="new-store-bundle"
                    type="number"
                    step="0.01"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-store-accent" className="block text-xs text-slate-300 mb-1">
                    Brand Accent
                  </label>
                  <input
                    id="new-store-accent"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full h-9 bg-[#090D16] border border-slate-700 rounded-lg px-1 py-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-store-gift" className="block text-xs text-slate-300 mb-1">
                  Unlocked VIP Free Gift
                </label>
                <input
                  id="new-store-gift"
                  type="text"
                  value={freeGift}
                  onChange={(e) => setFreeGift(e.target.value)}
                  className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-slate-950"
                >
                  {submitting ? "Creating Store..." : "Create & Launch Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
