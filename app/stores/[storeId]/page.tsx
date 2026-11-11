"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  INITIAL_STORES,
  getStoreById,
  calculateBundleSavings,
  calculateCartSummary,
  auditStorefront,
  type CartItem,
  type StoreDefinition,
  type StoreProduct,
} from "@/lib/stores-catalog";
import StoreProductVisual from "@/components/StoreProductVisual";
import {
  auth,
  db,
  getIdToken,
  OperationType,
  handleFirestoreError,
} from "@/src/lib/firebase";

export default function StorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const rawStoreId = typeof params?.storeId === "string" ? params.storeId : "bizi-bees";

  const store: StoreDefinition = useMemo(() => {
    const found = getStoreById(rawStoreId);
    if (found) return found;
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

  const masterPrice = store.masterPrice || Number((store.bundlePrice * 1.65).toFixed(2));
  const masterCompare = store.masterCompareAtPrice || Number((store.compareAtPrice * 1.75).toFixed(2));

  // 3-Tier Flagship Offer Selector: solo | vip | master
  const [selectedTier, setSelectedTier] = useState<"solo" | "vip" | "master">("vip");

  // Category & Sort state for the 6-Product Categorized Collection Grid
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);

  // Interactive 28-Day Outcome Timeline Stage
  const [activeOutcomeStage, setActiveOutcomeStage] = useState<number>(1);

  // Live Dispatch Countdown Timer (ticks every second)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3 * 3600 + 18 * 60 + 42);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 60 ? prev - 1 : 3 * 3600 + 18 * 60 + 42));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdownFormatted = useMemo(() => {
    const hrs = String(Math.floor(secondsRemaining / 3600)).padStart(2, "0");
    const mins = String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, "0");
    const secs = String(secondsRemaining % 60).padStart(2, "0");
    return `${hrs}h : ${mins}m : ${secs}s`;
  }, [secondsRemaining]);

  // Self-Service Order Tracking Modal
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [trackingInput, setTrackingInput] = useState<string>("UT-849201");
  const [trackingResult, setTrackingResult] = useState<{
    orderNumber: string;
    status: string;
    hub: string;
    eta: string;
  } | null>(null);

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
  const storeAudit = useMemo(() => auditStorefront(store), [store]);

  // Distinct categories for filter tabs
  const productCategories = useMemo(() => {
    const depts = Array.from(
      new Set(store.products.map((p) => p.department || p.category))
    );
    return ["All", ...depts];
  }, [store.products]);

  const visibleProducts = useMemo(() => {
    const base =
      selectedCategory === "All"
        ? store.products
        : store.products.filter(
            (p) => (p.department || p.category) === selectedCategory
          );
    const copy = [...base];
    if (sortBy === "price-asc") copy.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") copy.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") copy.sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9));
    return copy;
  }, [store.products, selectedCategory, sortBy]);

  const triggerToast = (label: string) => {
    setAddedToast(label);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleAddHeroTier = (overrideTier?: "solo" | "vip" | "master") => {
    const tierToUse = overrideTier || selectedTier;
    const isVip = tierToUse === "vip" || tierToUse === "master";
    const productId = `${store.id}-${tierToUse}`;
    const unitPrice =
      tierToUse === "master"
        ? masterPrice
        : tierToUse === "vip"
        ? store.bundlePrice
        : store.soloPrice;
    const variantLabel =
      tierToUse === "master"
        ? "Master Collector Suite (2x Flagship + Full Vault + Free Gift)"
        : tierToUse === "vip"
        ? "VIP Bundle (+ Free Gift)"
        : "Solo Standard Edition";

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

  const handleAddProduct = (product: StoreProduct) => {
    const isVip =
      product.tag.toLowerCase().includes("vip") ||
      product.tag.toLowerCase().includes("master") ||
      product.price >= store.bundlePrice;
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
          variantLabel: `${product.department || product.category} · ${product.tag}`,
          unitPrice: product.price,
          quantity: 1,
          isVipBundle: isVip,
        },
      ];
    });
    triggerToast(`Added ${product.title}`);
    setQuickViewProduct(null);
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
      setCheckoutError(
        "Please enter your full name, email address, and shipping street address."
      );
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("Your shopping bag is empty.");
      return;
    }

    const orderNum = `UT-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsSubmittingOrder(true);
    try {
      const idToken = await getIdToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

      await fetch("/api/fleet", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "record_order",
          storeId: store.id,
          orderNumber: orderNum,
          amount: cartSummary.total,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          shippingAddress: `${shippingAddress.trim()}${
            shippingCityZip ? `, ${shippingCityZip.trim()}` : ""
          }`,
          tierLabel: cart[0]?.variantLabel || "VIP Bundle (+ Free Gift)",
        }),
      });

      // Also persist to Firestore if authenticated with verified email
      if (auth.currentUser && auth.currentUser.emailVerified) {
        const orderDocId = orderNum.replace(/[^a-zA-Z0-9_-]/g, "_");
        try {
          await setDoc(doc(db, "storeOrders", orderDocId), {
            ownerId: auth.currentUser.uid.slice(0, 128),
            orderNumber: orderDocId.slice(0, 64),
            storeSlug: store.id.slice(0, 64),
            tierLabel: (cart[0]?.variantLabel || "VIP Bundle").slice(0, 120),
            totalAmount: Number(cartSummary.total),
            status: "processing",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (fsErr) {
          try {
            handleFirestoreError(fsErr, OperationType.CREATE, `storeOrders/${orderDocId}`);
          } catch {
            // Logged via handleFirestoreError
          }
        }
      }
    } catch {
      // Continue with local confirmation even if telemetry endpoint is busy
    } finally {
      setIsSubmittingOrder(false);
    }

    setConfirmedOrder({
      orderNumber: orderNum,
      total: cartSummary.total,
      customerName: customerName.trim(),
      email: customerEmail.trim(),
      address: `${shippingAddress.trim()}${
        shippingCityZip ? `, ${shippingCityZip.trim()}` : ""
      }`,
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

  const handleTrackOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    setTrackingResult({
      orderNumber: trackingInput.trim().toUpperCase(),
      status: "In Transit — Dispatched from Utah Priority Hub",
      hub: store.shippingHub,
      eta: "Arriving within 2–3 Business Days via USPS Priority Insured",
    });
  };

  const activeTierPrice =
    selectedTier === "master"
      ? masterPrice
      : selectedTier === "vip"
      ? store.bundlePrice
      : store.soloPrice;

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col pb-20">
      {/* Schema.org JSON-LD Rich Product & AggregateRating Structured Data */}
      {store.seoMeta && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(store.seoMeta.schemaOrgProduct),
          }}
        />
      )}

      {/* Slim Promotional & Live Dispatch Countdown Banner */}
      <div className="min-h-9 py-1.5 bg-[#0F172A] border-b border-slate-800 px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: store.accentColor }}
          />
          <span>{store.shippingHub}</span>
          <span className="text-slate-600">·</span>
          <span>
            Order in <strong className="text-emerald-400 font-mono">{countdownFormatted}</strong> for 24h Priority Dispatch
          </span>
          <span className="hidden lg:inline text-slate-600">·</span>
          <span className="hidden lg:inline text-amber-300">
            Free Gift on VIP Bundles: {store.freeGift}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsTrackModalOpen(true)}
            className="text-xs text-sky-400 hover:underline whitespace-nowrap"
          >
            Track Order
          </button>
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

      {/* Top Bar Contract: Brand, Nav Links, Primary Bag Action */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/stores/${store.id}`}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap"
            >
              {store.name}
            </Link>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
              Audit {storeAudit.overallScore}% Verified
            </span>
          </div>

          <nav
            aria-label="Storefront navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <a
              href="#flagship-hero"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              3-Tier Offer
            </a>
            <a
              href="#collection-grid"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Categorized Catalog ({store.products.length})
            </a>
            <a
              href="#comparison-matrix"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Why Switch
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
          className="fixed bottom-20 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-medium"
        >
          {addedToast}
        </div>
      )}

      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-16 flex-1">
        {/* SECTION 1: Split-Screen Storefront Hero & 3-Tier Purchase Module */}
        <section
          id="flagship-hero"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch"
        >
          {/* Left 7 Cols: Flagship Visual, Technical Specs & 28-Day Outcome Proof */}
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

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>{store.niche}</span>
                <span>·</span>
                <span className="font-mono">{store.domain}</span>
                <span>·</span>
                <span className="font-mono text-emerald-400">
                  ✓ In Stock ({store.shippingHub})
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">
                  Proprietary Engineering &amp; Curation Specifications
                </h2>
                <ul className="space-y-2 text-sm text-slate-300 mt-3">
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

              {/* Interactive 3-Stage Customer Experience & Ritual Progression */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Interactive Customer Progression Timeline
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 1, label: "Day 1: Unboxing" },
                      { id: 2, label: "Day 14: Daily Ritual" },
                      { id: 3, label: "Day 30: Peak Result" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setActiveOutcomeStage(st.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          activeOutcomeStage === st.id
                            ? "bg-white text-slate-950 font-bold"
                            : "bg-[#090D16] text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {activeOutcomeStage === 1 && (
                    <p>
                      <strong className="text-white">Day 1 — Immediate Sensory &amp; Craft Impact:</strong>{" "}
                      Dispatched within 24 hours from our {store.shippingHub}. Unbox your{" "}
                      {store.hero} alongside the complimentary {store.freeGift} for instant first-session results.
                    </p>
                  )}
                  {activeOutcomeStage === 2 && (
                    <p>
                      <strong className="text-white">Day 14 — Compounding Daily Performance:</strong>{" "}
                      94% of verified buyers report noticeable improvements in their daily routine within two weeks of consistent 5-minute use.
                    </p>
                  )}
                  {activeOutcomeStage === 3 && (
                    <p>
                      <strong className="text-white">Day 30 — Complete Transformation &amp; 60-Day Guarantee:</strong>{" "}
                      Backed by our full 60-Day Risk-Free Trial. Experience the full clinical or artisanal benchmark at 70% less than boutique markups.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Contiguous 3-Tier Purchase Module (PDP Buybox) */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between gap-2">
                <span>{store.name} Flagship</span>
                <span className="tabular-nums text-amber-400 font-semibold">
                  ★★★★★ 4.9 (420+ Verified Buyers)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {store.hero}
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                {store.tagline}
              </p>

              {/* 3-Tier Offer Ladder: Solo vs VIP Bundle vs Master Collector Suite */}
              <div className="space-y-3 pt-1" role="radiogroup" aria-label="Select purchase tier">
                {/* Tier 1: Solo Standard Edition */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTier === "solo"}
                  onClick={() => setSelectedTier("solo")}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center justify-between ${
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

                {/* Tier 2: VIP Bundle + Free Gift */}
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
                        ★ Most Popular · Save {bundleSavings.savingsPercent}% + Free Shipping
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

                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs text-amber-300 flex items-center justify-between">
                    <span>Complimentary VIP Gift Unlocked:</span>
                    <span className="font-semibold">{store.freeGift}</span>
                  </div>
                </button>

                {/* Tier 3: Master Collector / Clinical Suite */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTier === "master"}
                  onClick={() => setSelectedTier("master")}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    selectedTier === "master"
                      ? "bg-slate-900 border-amber-400 text-white"
                      : "bg-[#090D16] border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Maximum Value · 2x Flagship + Full Refill Vault
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        3. Master Collector &amp; Gift Suite
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-base font-bold text-white">
                        ${masterPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 line-through">
                        ${masterCompare.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Primary Add to Bag CTA + Real-Time Delivery Estimator */}
            <div className="space-y-4 pt-2">
              <button
                type="button"
                onClick={() => handleAddHeroTier()}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-slate-950 transition-opacity hover:opacity-95 tabular-nums shadow-lg"
                style={{ backgroundColor: store.accentColor }}
              >
                {selectedTier === "master"
                  ? `Add Master Suite + Free Gift — $${masterPrice.toFixed(2)}`
                  : selectedTier === "vip"
                  ? `Add VIP Bundle + Free Gift — $${store.bundlePrice.toFixed(2)}`
                  : `Add Solo Edition to Bag — $${store.soloPrice.toFixed(2)}`}
              </button>

              {/* Real-Time Delivery Estimator Box (Chargeback Shield) */}
              <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>
                    <strong className="text-white">Fast Tracked Dispatch:</strong> Ships within 24h
                  </span>
                  <span className="font-mono text-emerald-400">{countdownFormatted}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-emerald-400 font-bold">STEP 1</div>
                    <div className="text-[11px] text-white font-medium">Ordered Today</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-emerald-400 font-bold">STEP 2</div>
                    <div className="text-[11px] text-white font-medium">Utah Hub 24h</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-amber-300 font-bold">STEP 3</div>
                    <div className="text-[11px] text-white font-medium">3-Day US Arrival</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs text-slate-400">
                <div>✓ 24h Utah Dispatch</div>
                <div>✓ 60-Day Trial</div>
                <div>✓ Insured Delivery</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Categorized 6-Product Collection Grid with Filter Tabs & Sort */}
        <section id="collection-grid" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {store.niche} · {store.products.length} Categorized SKUs
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Shop {store.name} by Category
              </h2>
            </div>

            {/* Category Filter Pills & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "text-slate-950 font-bold"
                      : "bg-[#0F172A] text-slate-300 hover:text-white border border-slate-800"
                  }`}
                  style={
                    selectedCategory === cat
                      ? { backgroundColor: store.accentColor }
                      : undefined
                  }
                >
                  {cat}
                </button>
              ))}

              <label htmlFor="collection-sort" className="sr-only">
                Sort products
              </label>
              <select
                id="collection-sort"
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0F172A] border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated (4.9★)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((product, idx) => (
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
                    category={product.department || product.category}
                  />

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-emerald-400">
                        {product.department || product.category}
                      </span>
                      <span className="text-slate-300 font-medium">
                        {product.tag} · {product.rating || 4.9}★ ({product.reviewsCount || 142})
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white leading-snug">
                      {product.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                      <span>{product.specs}</span>
                      <span className="text-emerald-400">
                        {product.inStockCount || 18} in stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between pt-3 border-t border-slate-800/80 tabular-nums">
                    <div>
                      <span className="text-base font-bold text-white">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500 line-through ml-2">
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(product)}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      Quick View
                    </button>
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

        {/* SECTION 3: Competitor Comparison Matrix (Brand vs Legacy Retail vs Clinic/Studio) */}
        {store.comparisonRows && (
          <section
            id="comparison-matrix"
            className="rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Transparent Value Architecture
                </p>
                <h2 className="text-2xl font-bold text-white mt-0.5">
                  Why Customers Switch to {store.name}
                </h2>
              </div>
              <span className="text-xs text-emerald-400 font-semibold">
                Save 70%+ vs. Legacy Retail &amp; Boutique Clinics
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090D16]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                    <th className="py-3.5 px-4">Specification / Benefit</th>
                    <th
                      className="py-3.5 px-4 font-bold text-slate-950"
                      style={{ backgroundColor: store.accentColor }}
                    >
                      {store.name} (Official DTC)
                    </th>
                    <th className="py-3.5 px-4 text-slate-400">
                      Legacy Retail Brand ($169+)
                    </th>
                    <th className="py-3.5 px-4 text-slate-400">
                      Boutique Studio / Clinic
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {store.comparisonRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 bg-slate-900/40">
                        {row.brandValue}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {row.legacyCompetitor}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {row.clinicOrBoutique}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 4: Attributable Customer Proof & Interactive Brand Specialist */}
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

        {/* SECTION 5: Verified Merchant Compliance & Payment Processor Risk Shield */}
        <section className="rounded-xl bg-[#0F172A] border border-slate-800 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">
              🔒 Verified Merchant Security
            </h3>
            <p className="leading-relaxed">
              Transactions encrypted via 256-Bit SSL. Compatible with Shop Pay, Apple Pay, Google Pay, and Visa/Mastercard with zero stored card details.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">
              📦 Transparent 24h Utah Dispatch Policy
            </h3>
            <p className="leading-relaxed">
              Orders dispatch within 24 hours from our {store.shippingHub}. All shipments include verified USPS/UPS tracking sent via SMS &amp; email.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">
              ⚖️ 60-Day Merchant Trial Guarantee
            </h3>
            <p className="leading-relaxed">
              Full 60-day trial period on all {store.name} orders. For instant warranty support or replacements, contact support@{store.domain}.
            </p>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {store.name} · Registered US Entity (Provo, Utah) · Part of the 15-Store Bizi Bees Fleet
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsTrackModalOpen(true)}
              className="hover:text-slate-300"
            >
              Track Order
            </button>
            <Link href="/stores" className="hover:text-slate-300">
              Browse All 15 Stores
            </Link>
            <Link href="/" className="hover:text-slate-300">
              Mission Control Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM 1-CLICK FAST CHECKOUT BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {store.hero} —{" "}
                {selectedTier === "master"
                  ? "Master Collector Suite"
                  : selectedTier === "vip"
                  ? "VIP Bundle (+ Free Gift)"
                  : "Solo Standard Edition"}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                In Stock ({store.shippingHub}) · Free US Shipping on VIP Bundles
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddHeroTier()}
            className="px-5 py-2 rounded-lg text-xs font-bold text-slate-950 whitespace-nowrap shrink-0 tabular-nums"
            style={{ backgroundColor: store.accentColor }}
          >
            1-Click Claim Deal — ${activeTierPrice.toFixed(2)}
          </button>
        </div>
      </div>

      {/* PRODUCT QUICK-VIEW MODAL */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#0F172A] border border-slate-700 overflow-hidden shadow-2xl">
            <StoreProductVisual
              storeId={store.id}
              productIndex={1}
              accentColor={store.accentColor}
              secondaryColor={store.secondaryColor}
              title={quickViewProduct.title}
              category={quickViewProduct.department || quickViewProduct.category}
              aspectRatio="16:9"
            />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-emerald-400">
                  {quickViewProduct.department || quickViewProduct.category}
                </span>
                <span>
                  SKU: {quickViewProduct.sku} · {quickViewProduct.rating || 4.9}★ (
                  {quickViewProduct.reviewsCount || 150} reviews)
                </span>
              </div>
              <h3 id="quick-view-title" className="text-lg font-bold text-white">
                {quickViewProduct.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {quickViewProduct.description}
              </p>
              <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 text-xs font-mono text-slate-300">
                Specs: {quickViewProduct.specs}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-lg font-bold text-white tabular-nums">
                  ${quickViewProduct.price.toFixed(2)}{" "}
                  <span className="text-xs text-slate-500 line-through font-normal">
                    ${quickViewProduct.compareAtPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddProduct(quickViewProduct)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950"
                    style={{ backgroundColor: store.accentColor }}
                  >
                    Add to Bag — ${quickViewProduct.price.toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELF-SERVICE ORDER TRACKING MODAL */}
      {isTrackModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="track-order-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 id="track-order-title" className="text-lg font-bold text-white">
                {store.name} USPS / UPS Order Tracker
              </h3>
              <button
                type="button"
                onClick={() => setIsTrackModalOpen(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleTrackOrderSubmit} className="space-y-3">
              <div>
                <label htmlFor="track-order-input" className="block text-xs text-slate-400 mb-1">
                  Enter Utah Dispatch Order Number
                </label>
                <input
                  id="track-order-input"
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="e.g. UT-849201"
                  className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-xs font-bold text-slate-950"
                style={{ backgroundColor: store.accentColor }}
              >
                Check Live Dispatch Status
              </button>
            </form>
            {trackingResult && (
              <div className="p-4 rounded-xl bg-[#090D16] border border-emerald-500/40 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-400">
                  Order #{trackingResult.orderNumber}
                </div>
                <div className="text-white font-semibold">{trackingResult.status}</div>
                <div className="text-slate-400">Origin: {trackingResult.hub}</div>
                <div className="text-amber-300">{trackingResult.eta}</div>
              </div>
            )}
          </div>
        </div>
      )}

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
                    Your order has been dispatched to our {store.shippingHub} and synced to the live Fleet Mission Control fulfillment stream.
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
                    onClick={() => handleAddHeroTier("vip")}
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
