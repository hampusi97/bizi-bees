"use client";

import React, { useState } from "react";
import Link from "next/link";
import { INITIAL_STORES, calculateBundleSavings } from "@/lib/stores-catalog";
import StoreProductVisual from "@/components/StoreProductVisual";

const CATEGORIES = [
  { id: "all", label: "All 15 Stores" },
  { id: "warm-editorial", label: "Craft & Beverage" },
  { id: "clinical-precision", label: "Clinical & Wellness Tech" },
  { id: "obsidian-luxury", label: "Reserve & Hardware" },
  { id: "botanical-craft", label: "Botanical & Home" },
  { id: "athletic-minimal", label: "Studio Apparel" },
];

export default function AllStoresDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredStores = INITIAL_STORES.filter((store) => {
    const matchesCategory =
      selectedCategory === "all" || store.themeStyle === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      store.name.toLowerCase().includes(q) ||
      store.niche.toLowerCase().includes(q) ||
      store.hero.toLowerCase().includes(q) ||
      store.freeGift.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col">
      {/* Top Bar Contract: 3 Zones */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            href="/stores"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Bizi Bees Fleet Directory
          </Link>

          <nav
            aria-label="Store directory navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <Link
              href="/"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Mission Control
            </Link>
            <Link
              href="/stores/bizi-bees"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Bizi Bees Flagship
            </Link>
            <Link
              href="/stores/luma-clinical"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Luma Clinical
            </Link>
            <Link
              href="/stores/ember-oak"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Ember &amp; Oak
            </Link>
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              Fleet Telemetry
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-8 flex-1">
        {/* Hero Header */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium text-emerald-400">
              15 Active Direct-to-Consumer Storefronts · 90 Categorized Products · 100% Audit Verified
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Multi-Store E-Commerce Fleet
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every brand below is fully provisioned with its own flagship 3-tier VIP &amp; Master bundle selector, automatic complimentary gift unlocks, 6 categorized products across 5 departments, Schema.org JSON-LD metadata, and live Utah fulfillment checkout.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-80">
            <label htmlFor="directory-search" className="sr-only">
              Search 15 storefronts
            </label>
            <input
              id="directory-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brand, niche, or product..."
              className="w-full bg-[#0F172A] border border-slate-800 focus:border-emerald-400 text-sm text-white placeholder-slate-500 rounded-lg px-4 py-2.5 outline-none transition-colors"
            />
          </div>
        </section>

        {/* Interactive Category Filter Bar */}
        <section className="flex items-center justify-between flex-wrap gap-4">
          <div
            role="tablist"
            aria-label="Filter stores by category"
            className="flex items-center gap-1.5 p-1 bg-[#0F172A] border border-slate-800 rounded-lg overflow-x-auto"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 tabular-nums">
            Showing {filteredStores.length} of {INITIAL_STORES.length} live storefronts
          </div>
        </section>

        {/* 15-Store Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store, idx) => {
            const savings = calculateBundleSavings(
              store.soloPrice,
              store.bundlePrice,
              store.freeGiftValue
            );

            return (
              <article
                key={store.id}
                className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:border-slate-700"
              >
                <div>
                  <StoreProductVisual
                    storeId={store.id}
                    productIndex={idx}
                    accentColor={store.accentColor}
                    secondaryColor={store.secondaryColor}
                    title={store.hero}
                    category={store.niche}
                  />

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{store.niche}</span>
                      <span className="font-mono tabular-nums">
                        {store.products.length} Products
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {store.name}
                    </h2>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {store.tagline}
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Flagship Hero</span>
                        <span className="text-slate-200 font-medium truncate max-w-[190px]">
                          {store.hero}
                        </span>
                      </div>
                      <div className="flex items-center justify-between tabular-nums">
                        <span className="text-slate-400">Solo / VIP Bundle</span>
                        <span className="text-white font-semibold">
                          ${store.soloPrice.toFixed(2)} ·{" "}
                          <span style={{ color: store.accentColor }}>
                            VIP ${store.bundlePrice.toFixed(2)} (Save {savings.savingsPercent}%)
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Unlocked VIP Gift</span>
                        <span className="text-amber-300 truncate max-w-[195px]">
                          {store.freeGift}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex items-center gap-3">
                  <Link
                    href={`/stores/${store.id}`}
                    className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-center text-slate-950 transition-opacity hover:opacity-90 whitespace-nowrap"
                    style={{ backgroundColor: store.accentColor }}
                  >
                    Visit {store.name} Storefront →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
