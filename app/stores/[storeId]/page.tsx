"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  INITIAL_STORES,
  getStoreById,
  calculateBundleSavings,
  calculateCartSummary,
  type CartItem,
  type StoreDefinition,
} from "@/lib/stores-catalog";
import StoreProductVisual from "@/components/StoreProductVisual";

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const rawStoreId = typeof params?.storeId === "string" ? params.storeId : "bizi-bees";

  const store: StoreDefinition = useMemo(() => {
    const found = getStoreById(rawStoreId);
    if (found) return found;
    // Dynamic fallback for newly created custom stores
    const titleName = rawStoreId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      ...INITIAL_STORES[0],
      id: rawStoreId,
      name: `${titleName}™`,
      domain: `${rawStoreId}.myshopify.com`,
    };
  }, [rawStoreId]);

  const [selectedTier, setSelectedTier] = useState<"solo" | "vip">("vip");
  const [cart, setCart] = useState<CartItem[]>([
    {
      productId: `${store.id}-vip`,
      storeId: store.id,
      title: store.hero,
      variantLabel: "VIP Bundle (+ Free Gift)",
      unitPrice: store.bundlePrice,
      quantity: 1,
      isVipBundle: true,
    },
  ]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Checkout state
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [shippingCityZip, setShippingCityZip] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    total: number;
    customerName: string;
    email: string;
    address: string;
    freeGift: string | null;
    items: CartItem[];
  } | null>(null);

  // Storefront AI Concierge state
  const [conciergeQuery, setConciergeQuery] = useState<string>(
    `What makes the ${store.hero} VIP Bundle worth upgrading?`
  );
  const [conciergeReply, setConciergeReply] = useState<string | null>(null);
  const [conciergeLoading, setConciergeLoading] = useState<boolean>(false);

  const bundleSavings = useMemo(
    () => calculateBundleSavings(store.soloPrice, store.bundlePrice, store.freeGiftValue),
    [store]
  );

  const cartSummary = useMemo(() => calculateCartSummary(cart, store), [cart, store]);

  const triggerToast = (label: string) => {
    setAddedToast(label);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleAddHeroTier = () => {
    const isVip = selectedTier === "vip";
    const productId = `${store.id}-${selectedTier}`;
    const unitPrice = isVip ? store.bundlePrice : store.soloPrice;
    const variantLabel = isVip ? "VIP Bundle (+ Free Gift)" : "Solo Standard Edition";

    setConfirmedOrder(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId,
          storeId: store.id,
          title: store.hero,
          variantLabel,
          unitPrice,
          quantity: 1,
          isVipBundle: isVip,
        },
      ];
    });
    triggerToast(`Added ${store.hero} (${variantLabel})`);
    setIsCartOpen(true);
  };

  const handleAddProduct = (product: {
    id: string;
    title: string;
    price: number;
    tag: string;
  }) => {
    const isVip = product.tag.toLowerCase().includes("vip");
    setConfirmedOrder(null);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          storeId: store.id,
          title: product.title,
          variantLabel: product.tag,
          unitPrice: product.price,
          quantity: 1,
          isVipBundle: isVip,
        },
      ];
    });
    triggerToast(`Added ${product.title}`);
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!customerName.trim() || !customerEmail.trim() || !shippingAddress.trim()) {
      setCheckoutError("Please enter your full name, email address, and shipping street address.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Your shopping bag is empty.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      await fetch("/api/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_order",
          storeId: store.id,
          amount: cartSummary.total,
          customerName: customerName.trim(),
        }),
      });
    } catch {
      // Continue with local confirmation even if telemetry endpoint is busy
    } finally {
      setIsSubmittingOrder(false);
    }

    const orderNum = `UT-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmedOrder({
      orderNumber: orderNum,
      total: cartSummary.total,
      customerName: customerName.trim(),
      email: customerEmail.trim(),
      address: `${shippingAddress.trim()}${shippingCityZip ? `, ${shippingCityZip.trim()}` : ""}`,
      freeGift: cartSummary.unlockedGiftTitle,
      items: [...cart],
    });
    setCart([]);
  };

  const handleAskConcierge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conciergeQuery.trim()) return;
    setConciergeLoading(true);
    try {
      const res = await fetch("/api/ai/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          query: conciergeQuery,
          appType: "recommendation",
        }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        setConciergeReply(data.response);
      }
    } catch {
      setConciergeReply(
        `We recommend the ${store.hero} VIP Bundle ($${store.bundlePrice.toFixed(
          2
        )}), which automatically unlocks the ${store.freeGift} and free 24-hour Utah dispatch.`
      );
    } finally {
      setConciergeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col">
      {/* Slim Promotional Banner (<= 40px per E-Commerce guidelines) */}
      <div className="h-9 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="truncate">
          <span>{store.shippingHub}</span>
          <span className="mx-2 text-slate-600">·</span>
          <span>Free US Shipping on Orders $35+ or Any VIP Bundle</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label htmlFor="store-switcher-select" className="text-slate-400 hidden sm:inline">
            Switch Store:
          </label>
          <select
            id="store-switcher-select"
            aria-label="Switch active storefront"
            value={store.id}
            onChange={(e) => router.push(`/stores/${e.target.value}`)}
            className="bg-[#090D16] border border-slate-700 text-xs text-white rounded px-2 py-0.5 outline-none"
          >
            {INITIAL_STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.niche})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Bar Contract: 3 Zones (Brand, 4 Nav Links, 1 Primary Bag Action) */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            href={`/stores/${store.id}`}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            {store.name}
          </Link>

          <nav
            aria-label="Storefront navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <a
              href="#flagship-hero"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Flagship Bundle
            </a>
            <a
              href="#collection-grid"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Collection ({store.products.length})
            </a>
            <a
              href="#concierge-section"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Specialist Q&amp;A
            </a>
            <Link
              href="/stores"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              All 15 Stores
            </Link>
            <Link
              href="/"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Mission Control
            </Link>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping bag with ${cartSummary.itemCount} items`}
              className="px-4 py-2 text-xs font-bold text-slate-950 rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 tabular-nums"
              style={{ backgroundColor: store.accentColor }}
            >
              Bag ({cartSummary.itemCount}) · ${cartSummary.subtotal.toFixed(2)}
            </button>
          </div>
        </div>
      </header>

      {/* Subtle Toast Notification */}
      {addedToast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-medium"
        >
          {addedToast}
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-16 flex-1">
        {/* SECTION 1: Split-Screen Storefront Hero & Contiguous Purchase Module */}
        <section
          id="flagship-hero"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch"
        >
          {/* Left 7 Cols: Flagship Visual & Technical Craft Specs */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden">
            <StoreProductVisual
              storeId={store.id}
              productIndex={0}
              accentColor={store.accentColor}
              secondaryColor={store.secondaryColor}
              title={store.hero}
              category={store.niche}
              aspectRatio="16:9"
            />

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{store.niche}</span>
                <span>·</span>
                <span>{store.domain}</span>
                <span>·</span>
                <span className="font-mono text-emerald-400">In Stock (Utah Hub)</span>
              </div>

              <h2 className="text-lg font-bold text-white">
                Engineering &amp; Curation Specifications
              </h2>

              <ul className="space-y-2 text-sm text-slate-300">
                {store.heroSpecs.map((spec, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span
                      className="font-mono text-xs mt-1 shrink-0"
                      style={{ color: store.accentColor }}
                    >
                      0{idx + 1}.
                    </span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right 5 Cols: Contiguous Purchase Module (PDP Buybox) */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>{store.name}</span>
                <span>·</span>
                <span className="tabular-nums">4.9 ★ (420+ Verified Buyers)</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {store.hero}
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                {store.tagline}
              </p>

              {/* 2-Tier Selector: Solo vs VIP Bundle */}
              <div className="space-y-3 pt-2" role="radiogroup" aria-label="Select purchase tier">
                {/* Option 1: Solo Tier */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTier === "solo"}
                  onClick={() => setSelectedTier("solo")}
                  className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between ${
                    selectedTier === "solo"
                      ? "bg-slate-900 border-white text-white"
                      : "bg-[#090D16] border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      1. Solo Standard Edition
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Single {store.hero} · Standard Dispatch
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-base font-bold text-white">
                      ${store.soloPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 line-through">
                      ${(store.soloPrice * 1.35).toFixed(2)}
                    </div>
                  </div>
                </button>

                {/* Option 2: VIP Bundle Tier */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTier === "vip"}
                  onClick={() => setSelectedTier("vip")}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedTier === "vip"
                      ? "bg-slate-900 border-emerald-400 text-white"
                      : "bg-[#090D16] border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400">
                        Most Popular · Save {bundleSavings.savingsPercent}% + Free Shipping
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        2. Complete VIP Bundle + Free Gift
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-lg font-bold text-white">
                        ${store.bundlePrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 line-through">
                        ${store.compareAtPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-amber-300 flex items-center justify-between">
                    <span>Complimentary VIP Gift Unlocked:</span>
                    <span className="font-semibold">{store.freeGift}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Primary Add to Bag CTA + Guarantee Summary */}
            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={handleAddHeroTier}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-slate-950 transition-opacity hover:opacity-95 tabular-nums"
                style={{ backgroundColor: store.accentColor }}
              >
                {selectedTier === "vip"
                  ? `Add VIP Bundle + Free Gift — $${store.bundlePrice.toFixed(2)}`
                  : `Add Solo Edition to Bag — $${store.soloPrice.toFixed(2)}`}
              </button>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
                <div>24h Utah Dispatch</div>
                <div>60-Day Risk-Free Trial</div>
                <div>Insured US Delivery</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Featured 4-Product Collection Grid */}
        <section id="collection-grid" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs text-slate-400">{store.niche}</p>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Curated {store.name} Collection
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              All items ship within 24 hours from our {store.shippingHub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {store.products.map((product, idx) => (
              <article
                key={product.id}
                className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div>
                  <StoreProductVisual
                    storeId={store.id}
                    productIndex={idx + 1}
                    accentColor={store.accentColor}
                    secondaryColor={store.secondaryColor}
                    title={product.title}
                    category={product.category}
                  />

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{product.category}</span>
                      <span>·</span>
                      <span className="text-slate-300 font-medium">{product.tag}</span>
                    </div>

                    <h3 className="text-base font-semibold text-white leading-snug">
                      {product.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {product.description}
                    </p>

                    <p className="text-[11px] font-mono text-slate-500 pt-1">
                      {product.specs}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between pt-3 border-t border-slate-800/80 tabular-nums">
                    <span className="text-base font-bold text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    Add to Bag — ${product.price.toFixed(2)}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 3: Attributable Customer Proof & Interactive Brand Specialist */}
        <section
          id="concierge-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* Left 5 Cols: Attributable Testimonial */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Verified Buyer Outcome · {store.testimonial.verifiedProduct}
              </div>
              <blockquote className="text-base sm:text-lg text-slate-200 leading-relaxed">
                &ldquo;{store.testimonial.quote}&rdquo;
              </blockquote>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs space-y-1">
              <div className="font-bold text-white">{store.testimonial.author}</div>
              <div className="text-slate-400">
                {store.testimonial.role} · {store.testimonial.location}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Interactive Store Specialist Concierge */}
          <div className="lg:col-span-7 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-4">
            <div>
              <div className="text-xs text-slate-400">
                Interactive Product Specialist
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Ask the {store.name} Specialist
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Get instant sizing, ritual protocols, or gift curation advice for {store.name}.
              </p>
            </div>

            <form onSubmit={handleAskConcierge} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="store-concierge-input" className="sr-only">
                Ask the store specialist a question
              </label>
              <input
                id="store-concierge-input"
                type="text"
                value={conciergeQuery}
                onChange={(e) => setConciergeQuery(e.target.value)}
                placeholder={`Ask about ${store.hero}...`}
                className="flex-1 bg-[#090D16] border border-slate-700 focus:border-white text-xs text-white rounded-lg px-4 py-2.5 outline-none"
              />
              <button
                type="submit"
                disabled={conciergeLoading}
                className="px-5 py-2.5 rounded-lg text-xs font-bold text-slate-950 transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
                style={{ backgroundColor: store.accentColor }}
              >
                {conciergeLoading ? "Consulting..." : "Ask Specialist"}
              </button>
            </form>

            {conciergeReply && (
              <div className="p-4 rounded-lg bg-[#090D16] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {conciergeReply}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {store.name} · Part of the 15-Store Bizi Bees Fleet
          </div>
          <div className="flex items-center gap-6">
            <Link href="/stores" className="hover:text-slate-300">
              Browse All 15 Stores
            </Link>
            <Link href="/" className="hover:text-slate-300">
              Mission Control Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {/* SLIDE-OVER CART & CHECKOUT DRAWER */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag and Checkout"
        >
          <div className="w-full max-w-md bg-[#0F172A] border-l border-slate-800 h-full flex flex-col justify-between overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {store.name} Shopping Bag
                  </h2>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {cartSummary.itemCount} item(s) · {store.shippingHub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close shopping bag"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                >
                  Close
                </button>
              </div>

              {/* Free Shipping & VIP Gift Status Banner */}
              <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800 space-y-2 text-xs">
                {cartSummary.freeShippingUnlocked ? (
                  <div className="text-emerald-400 font-semibold">
                    ✓ Free 24h US Priority Shipping Unlocked
                  </div>
                ) : (
                  <div className="text-slate-300">
                    Add{" "}
                    <strong className="text-white tabular-nums">
                      ${cartSummary.amountToFreeShipping.toFixed(2)}
                    </strong>{" "}
                    more for Free US Priority Shipping
                  </div>
                )}

                {cartSummary.vipGiftUnlocked && (
                  <div className="text-amber-300 font-medium pt-1 border-t border-slate-800">
                    ✓ Complimentary VIP Gift Included: {store.freeGift} (FREE)
                  </div>
                )}
              </div>

              {/* Order Confirmation State */}
              {confirmedOrder ? (
                <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Order #{confirmedOrder.orderNumber} Confirmed — Preparing Shipment
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Thank you, {confirmedOrder.customerName}!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your order has been dispatched to our {store.shippingHub} and synced to the live Fleet Mission Control telemetry stream.
                  </p>
                  <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800 tabular-nums">
                    <div>
                      <strong>Recipient:</strong> {confirmedOrder.email}
                    </div>
                    <div>
                      <strong>Shipping To:</strong> {confirmedOrder.address}
                    </div>
                    {confirmedOrder.freeGift && (
                      <div className="text-amber-300">
                        <strong>Included VIP Gift:</strong> {confirmedOrder.freeGift}
                      </div>
                    )}
                    <div className="text-sm font-bold text-white pt-1">
                      Total Charged: ${confirmedOrder.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedOrder(null);
                        setIsCartOpen(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                    >
                      Continue Shopping
                    </button>
                    <Link
                      href="/"
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-400 text-slate-950 text-xs font-bold text-center"
                    >
                      View Live Telemetry
                    </Link>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-slate-400">Your shopping bag is currently empty.</p>
                  <button
                    type="button"
                    onClick={() => handleAddHeroTier()}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950"
                    style={{ backgroundColor: store.accentColor }}
                  >
                    Add {store.hero} VIP Bundle
                  </button>
                </div>
              ) : (
                <>
                  {/* Itemized Cart List */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.variantLabel} · ${item.unitPrice.toFixed(2)} each
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 tabular-nums">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.title}`}
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-semibold w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.title}`}
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="text-xs font-bold text-white">
                      Express 24h Utah Dispatch Checkout
                    </div>

                    {checkoutError && (
                      <div role="alert" className="p-2.5 rounded bg-red-950/50 border border-red-500/40 text-xs text-red-300">
                        {checkoutError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="checkout-name" className="block text-[11px] text-slate-400 mb-1">
                        Full Name *
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Clara Vance"
                        className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkout-email" className="block text-[11px] text-slate-400 mb-1">
                        Email for Tracking *
                      </label>
                      <input
                        id="checkout-email"
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="clara@example.com"
                        className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkout-address" className="block text-[11px] text-slate-400 mb-1">
                        Shipping Street Address *
                      </label>
                      <input
                        id="checkout-address"
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="742 Evergreen Terrace"
                        className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkout-city" className="block text-[11px] text-slate-400 mb-1">
                        City, State &amp; Postal Code
                      </label>
                      <input
                        id="checkout-city"
                        type="text"
                        value={shippingCityZip}
                        onChange={(e) => setShippingCityZip(e.target.value)}
                        placeholder="Salt Lake City, UT 84101"
                        className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                      />
                    </div>

                    {/* Subtotal / Shipping / Total */}
                    <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs tabular-nums">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>${cartSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>USPS Priority Shipping</span>
                        <span>
                          {cartSummary.shippingCost === 0
                            ? "FREE"
                            : `$${cartSummary.shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                        <span>Total</span>
                        <span>${cartSummary.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 transition-opacity hover:opacity-95 tabular-nums"
                      style={{ backgroundColor: store.accentColor }}
                    >
                      {isSubmittingOrder
                        ? "Confirming Order..."
                        : `Complete Order — $${cartSummary.total.toFixed(2)}`}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
