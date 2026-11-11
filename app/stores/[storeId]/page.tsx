"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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

const STORE_EDITION_CONFIGS: Record<
  string,
  {
    optionLabel: string;
    options: string[];
    personalizationLabel: string;
    personalizationPlaceholder: string;
  }
> = {
  "bizi-bees": {
    optionLabel: "Select Literary Mood & Wax Seal",
    options: [
      "Rainy Sunday Cozy Mystery · 24k Gold Bee Seal",
      "Victorian Dark Academia · Obsidian Wax Seal",
      "Botanical Cottagecore Folklore · Pressed Lavender",
      "Starlight Romantic Fantasy · Antique Brass Seal",
    ],
    personalizationLabel: "Handwritten Typewriter Gift Note (Complimentary)",
    personalizationPlaceholder: "e.g. Happy Birthday Clara — enjoy a cozy evening in!",
  },
  "ember-oak": {
    optionLabel: "Select Wood Grain & Hardware Finish",
    options: [
      "Spanish Cedar + Burl Walnut · Brushed Brass",
      "Obsidian Matte Ebony · Gunmetal Hardware",
      "Heritage Italian Briar · Antique Bronze",
    ],
    personalizationLabel: "Complimentary Brass Nameplate Monogram (Up to 3 Initials)",
    personalizationPlaceholder: "e.g. J.R.V.",
  },
  "luma-clinical": {
    optionLabel: "Select Phototherapy Wavelength Protocol",
    options: [
      "Dual-Wave Clinical (660nm Red + 415nm Blue)",
      "660nm Deep Dermal Collagen + 300uA Lift",
      "415nm Blemish Clear + Cryo-Calm Mode",
    ],
    personalizationLabel: "Primary Skin Goal Note for Specialist Protocol Card",
    personalizationPlaceholder: "e.g. Jawline contour & morning under-eye depuffing",
  },
  "luma-relief": {
    optionLabel: "Select Compression & Thermal Fit",
    options: [
      "Universal 360° Deep Blackout Fit · Cryo-Gel",
      "Extended Temple & Sinus Relief Fit · Dual-Temp",
    ],
    personalizationLabel: "Relief Protocol Focus",
    personalizationPlaceholder: "e.g. Photophobia & afternoon screen tension",
  },
  "fizz-lab": {
    optionLabel: "Select Signature Utah Dirty Soda Flight",
    options: [
      "Coconut-Lime + Madagascar Vanilla Cold Foam",
      "Peach Cobbler + Sweetened Cream Swirl",
      "Huckleberry + Zero-Sugar Artisanal Flight",
    ],
    personalizationLabel: "Custom Tasting Box Label",
    personalizationPlaceholder: "e.g. The Miller Family Friday Soda Bar",
  },
  "crave-lab": {
    optionLabel: "Select Belgian Cacao Tasting Curation",
    options: [
      "72% Single-Origin Dark + Pistachio Kunafa",
      "Salted Caramel Gold + Hazelnut Praline Crunch",
      "Grand Cru Dark Reserve (100% Plant-Based)",
    ],
    personalizationLabel: "Gold-Foil Tasting Ribbon Message",
    personalizationPlaceholder: "e.g. Happy Anniversary — With Love",
  },
  "aura-sculpt": {
    optionLabel: "Select Studio Colorway & Size",
    options: [
      "Espresso Sculpt · S/M",
      "Espresso Sculpt · M/L",
      "Matcha Sage · S/M",
      "Obsidian Black · M/L",
    ],
    personalizationLabel: "Studio Fit Preference",
    personalizationPlaceholder: "e.g. High-compression reformer pilates fit",
  },
};

const getStoreEditionConfig = (store: StoreDefinition) => {
  if (STORE_EDITION_CONFIGS[store.id]) return STORE_EDITION_CONFIGS[store.id];
  return {
    optionLabel: "Select Studio Edition & Finish",
    options: [
      `Signature ${store.name.replace("™", "")} Edition`,
      "Obsidian Reserve Matte Finish",
      "Limited Collector Gift Presentation",
    ],
    personalizationLabel: "Complimentary Gift Card or Custom Dispatch Note",
    personalizationPlaceholder: `Add a custom note for your ${store.name} parcel...`,
  };
};

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

  const isEditorialSerifBrand =
    store.themeStyle === "warm-editorial" ||
    store.themeStyle === "obsidian-luxury" ||
    store.themeStyle === "botanical-craft";

  const headingFontClass = isEditorialSerifBrand
    ? "font-[family-name:var(--font-serif)] tracking-tight"
    : "font-sans tracking-tight";

  const editionConfig = useMemo(() => getStoreEditionConfig(store), [store]);
  const [selectedEdition, setSelectedEdition] = useState<string>(editionConfig.options[0]);
  const [customNote, setCustomNote] = useState<string>("");

  useEffect(() => {
    setSelectedEdition(editionConfig.options[0]);
    setCustomNote("");
  }, [editionConfig]);

  const masterPrice = store.masterPrice || Number((store.bundlePrice * 1.65).toFixed(2));
  const masterCompare = store.masterCompareAtPrice || Number((store.compareAtPrice * 1.75).toFixed(2));

  // 3-Tier Flagship Offer Selector: solo | vip | master
  const [selectedTier, setSelectedTier] = useState<"solo" | "vip" | "master">("vip");

  // Category & Sort state for the 6-Product Categorized Collection Grid
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);

  // Interactive 30-Day Outcome Slider (1 to 30 days)
  const [outcomeDay, setOutcomeDay] = useState<number>(14);

  // Interactive "Build Your Own 3-Piece Custom Bundle" Architect
  const [customBundleIds, setCustomBundleIds] = useState<string[]>(() =>
    store.products.slice(0, 3).map((p) => p.id)
  );

  useEffect(() => {
    setCustomBundleIds(store.products.slice(0, 3).map((p) => p.id));
  }, [store.id, store.products]);

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
      variantLabel: `VIP Bundle (+ Free Gift) · ${editionConfig.options[0]}`,
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

  // Module 2: IntersectionObserver Sticky PDP Conversion Bar
  const primaryBuyBtnRef = useRef<HTMLButtonElement | null>(null);
  const [isStickyPdpBarShown, setIsStickyPdpBarShown] = useState<boolean>(false);

  useEffect(() => {
    const target = primaryBuyBtnRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyPdpBarShown(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [store.id]);

  // Module 3: Predictive Instant Search Modal (CMD+K / CTRL+K)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [predictiveQuery, setPredictiveQuery] = useState<string>("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const predictiveResults = useMemo(() => {
    const q = predictiveQuery.trim().toLowerCase();
    if (!q) return store.products;
    return store.products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.department || p.category).toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [predictiveQuery, store.products]);

  // Module 4: 1.2KB Edge Telemetry Beacon & Rage-Click Detector (>=3 clicks within 800ms)
  const clickTimestampsRef = useRef<{ target: EventTarget | null; times: number[] }>({
    target: null,
    times: [],
  });

  useEffect(() => {
    const sendBeaconEvent = (
      type: string,
      data: Record<string, unknown> = {}
    ) => {
      const payload = JSON.stringify({
        type,
        storeId: store.id,
        path: `/stores/${store.id}`,
        device: window.innerWidth < 768 ? "mobile" : "desktop",
        data,
      });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/telemetry/ingest", payload);
      } else {
        fetch("/api/telemetry/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        }).catch(() => {});
      }
    };

    sendBeaconEvent("pageview", { storeName: store.name });

    const onDocClick = (e: MouseEvent) => {
      const now = Date.now();
      const tracker = clickTimestampsRef.current;
      if (tracker.target === e.target) {
        tracker.times = [...tracker.times.filter((t) => now - t <= 800), now];
        if (tracker.times.length >= 3) {
          sendBeaconEvent("rage_click", {
            clicksIn800ms: tracker.times.length,
            tag: (e.target as HTMLElement)?.tagName || "NODE",
          });
          tracker.times = [];
        }
      } else {
        tracker.target = e.target;
        tracker.times = [now];
      }
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [store.id, store.name]);

  const bundleSavings = useMemo(
    () => calculateBundleSavings(store.soloPrice, store.bundlePrice, store.freeGiftValue),
    [store]
  );

  const cartSummary = useMemo(() => calculateCartSummary(cart, store), [cart, store]);
  const storeAudit = useMemo(() => auditStorefront(store), [store]);

  // Custom 3-Piece Bundle calculation
  const customBundleProducts = useMemo(() => {
    return customBundleIds
      .map((id) => store.products.find((p) => p.id === id))
      .filter((p): p is StoreProduct => Boolean(p));
  }, [customBundleIds, store.products]);

  const customBundleRetailTotal = useMemo(
    () => customBundleProducts.reduce((sum, p) => sum + p.price, 0),
    [customBundleProducts]
  );
  const customBundleDiscountedTotal = useMemo(
    () => Number((customBundleRetailTotal * 0.75).toFixed(2)),
    [customBundleRetailTotal]
  );
  const customBundleSavingsAmount = useMemo(
    () => Number((customBundleRetailTotal - customBundleDiscountedTotal + store.freeGiftValue).toFixed(2)),
    [customBundleRetailTotal, customBundleDiscountedTotal, store.freeGiftValue]
  );

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
    const noteSuffix = customNote.trim() ? ` · Note: "${customNote.trim()}"` : "";
    const productId = `${store.id}-${tierToUse}-${selectedEdition}`;
    const unitPrice =
      tierToUse === "master"
        ? masterPrice
        : tierToUse === "vip"
        ? store.bundlePrice
        : store.soloPrice;
    const baseTierName =
      tierToUse === "master"
        ? "Master Collector Suite"
        : tierToUse === "vip"
        ? "VIP Bundle (+ Free Gift)"
        : "Solo Standard Edition";
    const variantLabel = `${baseTierName} · ${selectedEdition}${noteSuffix}`;

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
    triggerToast(`Added ${store.hero} (${baseTierName})`);
    setIsCartOpen(true);
  };

  const handleAddCustomBundleToBag = () => {
    if (customBundleProducts.length === 0) return;
    const bundleId = `${store.id}-custom-trio-${customBundleIds.join("-")}`;
    const names = customBundleProducts.map((p) => p.title.split("—")[0].trim()).join(" + ");
    setConfirmedOrder(null);
    setCart((prev) => [
      ...prev,
      {
        productId: bundleId,
        storeId: store.id,
        title: `${store.name} Custom 3-Piece Bundle (-25% Off)`,
        variantLabel: `${names} · Free ${store.freeGift}`,
        unitPrice: customBundleDiscountedTotal,
        quantity: 1,
        isVipBundle: true,
      },
    ]);
    triggerToast(`Added Custom 3-Piece Bundle ($${customBundleDiscountedTotal.toFixed(2)})`);
    setIsCartOpen(true);
  };

  const handleToggleProductInCustomBundle = (productId: string) => {
    setCustomBundleIds((prev) => {
      if (prev.includes(productId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), productId];
      }
      return [...prev, productId];
    });
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
      // Continue with local confirmation
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

  // Refill / Upsell item in Cart Drawer (5th product in store catalog)
  const refillUpsellProduct = store.products[4] || store.products[0];
  const isRefillInCart = cart.some((item) => item.productId === refillUpsellProduct?.id);

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

      {/* Slim Top Utility Banner (Editorial Mode for Bizi Bees; Dispatch Telemetry for Sister Stores) */}
      <div className="min-h-9 py-1.5 bg-[#0F172A] border-b border-slate-800/80 px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          {store.id === "bizi-bees" ? (
            <>
              <span className="text-amber-200 font-medium">
                Bizi Bees Circular Boutique · Hand-Inspected in Salt Lake City, Utah
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Free Standard Shipping at $50.00</span>
              <span aria-hidden="true" className="hidden lg:inline text-slate-600">·</span>
              <span className="hidden lg:inline text-emerald-400">
                Complimentary Gift: {store.freeGift}
              </span>
            </>
          ) : (
            <>
              <span>{store.shippingHub}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Order within <strong className="text-emerald-400 font-mono tabular-nums">{countdownFormatted}</strong> for 24h Dispatch
              </span>
              <span aria-hidden="true" className="hidden lg:inline text-slate-600">·</span>
              <span className="hidden lg:inline text-amber-300">
                VIP Gift Included: {store.freeGift}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Open predictive instant search (Command+K)"
            className="text-xs text-slate-200 hover:text-white bg-[#090D16] border border-slate-700 rounded px-2 py-0.5 font-mono whitespace-nowrap"
          >
            Search (⌘K)
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <Link
            href="/account/orders"
            className="text-xs text-emerald-400 hover:underline whitespace-nowrap font-medium"
          >
            Order History
          </Link>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            type="button"
            onClick={() => setIsTrackModalOpen(true)}
            className="text-xs text-sky-400 hover:underline whitespace-nowrap"
          >
            Track Order
          </button>
          <label htmlFor="store-switcher-select" className="text-slate-400 hidden sm:inline">
            Switch Brand:
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

      {/* Strict 3-Zone Top Bar Contract: [1-line Brand Wordmark] — [5 single-line nav links] — [1 Primary Bag CTA] */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            href={`/stores/${store.id}`}
            className={`text-xl font-bold text-white whitespace-nowrap shrink-0 ${headingFontClass}`}
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
              3-Tier Offer
            </a>
            <a
              href="#custom-bundle"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Custom Bundle
            </a>
            <a
              href="#collection-grid"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Catalog ({store.products.length})
            </a>
            <a
              href="#comparison-matrix"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Why Switch
            </a>
            <Link
              href="/stores"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              All 15 Stores
            </Link>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Open shopping bag with ${cartSummary.itemCount} items`}
              className="px-4 py-2 text-xs font-bold text-slate-950 rounded-lg transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 font-mono tabular-nums"
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
        {/* BIZI BEES SOVEREIGN EDITORIAL TRANSFORMATION SHOWCASE (Warm Linen #FBF9F5 Design System) */}
        {store.id === "bizi-bees" && (
          <section
            aria-label="Bizi Bees Boutique Warm Linen Editorial Brand Manifesto"
            className="rounded-2xl bg-[#FBF9F5] text-[#1C1917] border border-[#E7E5E4] p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-wider text-[#2D3B2D] font-bold">
                SOVEREIGN BRAND SPLIT · STORE #1: BIZI BEES CIRCULAR BOUTIQUE (UTAH)
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917] font-[family-name:var(--font-serif)] tracking-tight">
                Pre-Loved Literature, Timeless Tabletop Games &amp; Tactile Paper Goods
              </h2>
              <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed">
                Hand-inspected in Salt Lake City, wrapped in natural kraft linen with a pressed botanical wax seal. Clinical phototherapy hardware is independently housed at our sister node,{" "}
                <Link
                  href="/stores/luma-clinical"
                  className="font-semibold text-[#2D3B2D] underline"
                >
                  Luma Clinical™ (Store #2)
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="p-3.5 rounded-xl bg-white border border-[#E7E5E4] text-xs space-y-0.5">
                <div className="text-[#78716C]">Design System Palette</div>
                <div className="font-mono font-bold text-[#1C1917]">
                  #FBF9F5 Linen · #2D3B2D Olive · #D97706 Amber
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="px-4 py-3 rounded-xl bg-[#2D3B2D] hover:opacity-95 text-white text-xs font-semibold transition-opacity"
              >
                Instant Catalog Search (⌘K)
              </button>
            </div>
          </section>
        )}

        {/* SECTION 1: Split-Screen Interactive Studio Hero & Contiguous 3-Tier Personalization Buybox */}
        <section
          id="flagship-hero"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch"
        >
          {/* Left 7 Cols: Multi-Angle Interactive Studio Canvas, Hotspots & 30-Day Outcome Slider */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden">
            <StoreProductVisual
              storeId={store.id}
              productIndex={0}
              accentColor={store.accentColor}
              secondaryColor={store.secondaryColor}
              title={store.hero}
              category={store.niche}
              aspectRatio="16:9"
              interactive={true}
              freeGift={store.freeGift}
              heroSpecs={store.heroSpecs}
              activeEdition={selectedEdition.split("·")[0].trim()}
            />

            <div className="p-6 space-y-6">
              {/* Unboxed Metadata Line with Middot Separators */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{store.niche}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{store.domain}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-emerald-400">
                    Audit {storeAudit.overallScore}% Verified
                  </span>
                </div>
                <span className="font-mono text-emerald-400">
                  In Stock · {store.shippingHub}
                </span>
              </div>

              <div>
                <h2 className={`text-xl font-bold text-white ${headingFontClass}`}>
                  Proprietary Engineering &amp; Curation Specifications
                </h2>
                <ul className="space-y-2 text-sm text-slate-300 mt-3">
                  {store.heroSpecs.map((spec, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span
                        className="font-mono text-xs mt-1 shrink-0 tabular-nums"
                        style={{ color: store.accentColor }}
                      >
                        0{idx + 1}.
                      </span>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive 30-Day Customer Outcome Benchmark Slider */}
              <div className="pt-5 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="outcome-day-slider"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Interactive 30-Day Ritual &amp; Performance Simulator
                  </label>
                  <span
                    className="font-mono text-xs font-bold tabular-nums"
                    style={{ color: store.accentColor }}
                  >
                    Day {outcomeDay} of 30 ·{" "}
                    {outcomeDay < 7
                      ? "Initial Unboxing & Setup"
                      : outcomeDay < 21
                      ? "Compounding Daily Ritual (94% Adherence)"
                      : "Peak Validated Benchmark (+70% Value vs Boutique)"}
                  </span>
                </div>

                <input
                  id="outcome-day-slider"
                  type="range"
                  min={1}
                  max={30}
                  value={outcomeDay}
                  onChange={(e) => setOutcomeDay(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />

                <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setOutcomeDay(1)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      outcomeDay <= 7
                        ? "bg-slate-900 border-slate-600 text-white"
                        : "bg-[#090D16] border-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-mono text-[11px] text-emerald-400">Day 01</div>
                    <div className="font-semibold mt-0.5">24h Utah Unboxing</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      First-session sensory &amp; gift unlock
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutcomeDay(14)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      outcomeDay > 7 && outcomeDay < 22
                        ? "bg-slate-900 border-slate-600 text-white"
                        : "bg-[#090D16] border-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-mono text-[11px] text-sky-400">Day 14</div>
                    <div className="font-semibold mt-0.5">Daily Habit Lock-In</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      94% report measurable routine lift
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutcomeDay(30)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      outcomeDay >= 22
                        ? "bg-slate-900 border-slate-600 text-white"
                        : "bg-[#090D16] border-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-mono text-[11px] text-amber-300">Day 30</div>
                    <div className="font-semibold mt-0.5">Peak Benchmark</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Protected by 60-Day Trial
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Contiguous 3-Tier Purchase & Personalization Module (PDP Buybox) */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between gap-2">
                <span>{store.name} Flagship</span>
                <span className="font-mono tabular-nums text-amber-400 font-semibold">
                  4.9★ (420+ Verified Buyers)
                </span>
              </div>

              <h1
                className={`text-2xl sm:text-3xl font-bold text-white leading-tight [text-wrap:balance] ${headingFontClass}`}
              >
                {store.hero}
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed">
                {store.tagline}
              </p>

              {/* Bespoke Edition / Finish / Protocol Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  {editionConfig.optionLabel}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {editionConfig.options.map((opt) => {
                    const isSelected = selectedEdition === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedEdition(opt)}
                        className={`px-3 py-2 rounded-lg border text-xs text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-slate-900 border-white text-white font-semibold"
                            : "bg-[#090D16] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        <span
                          className="font-mono text-[10px] shrink-0 ml-2"
                          style={{ color: isSelected ? store.accentColor : "#64748B" }}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Personalization / Monogram / Gift Note Input */}
              <div>
                <label
                  htmlFor="bespoke-personalization-input"
                  className="block text-xs font-medium text-slate-400 mb-1"
                >
                  {editionConfig.personalizationLabel}
                </label>
                <input
                  id="bespoke-personalization-input"
                  type="text"
                  maxLength={80}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder={editionConfig.personalizationPlaceholder}
                  className="w-full bg-[#090D16] border border-slate-800 focus:border-slate-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* 3-Tier Offer Ladder: Solo vs VIP Bundle vs Master Collector Suite */}
              <div className="space-y-2.5 pt-1" role="radiogroup" aria-label="Select purchase tier">
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
                      01. Solo Standard Edition
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Single {store.hero} · Standard Dispatch
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
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
                        Most Popular · Save {bundleSavings.savingsPercent}% + Free Shipping
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        02. Complete VIP Bundle + Free Gift
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-lg font-bold text-white">
                        ${store.bundlePrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 line-through">
                        ${store.compareAtPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs text-amber-300 flex items-center justify-between gap-2">
                    <span>Unlocked VIP Gift:</span>
                    <span className="font-semibold text-right">{store.freeGift}</span>
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
                      <div className="text-xs font-semibold text-amber-400">
                        Maximum Value · 2x Flagship + Full Refill Vault
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        03. Master Collector &amp; Gift Suite
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
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
                ref={primaryBuyBtnRef}
                id="primary-buy-cta-btn"
                type="button"
                onClick={() => handleAddHeroTier()}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-slate-950 transition-opacity hover:opacity-95 font-mono tabular-nums shadow-lg whitespace-nowrap"
                style={{ backgroundColor: store.accentColor }}
              >
                {selectedTier === "master"
                  ? `Add Master Suite + Free Gift — $${masterPrice.toFixed(2)}`
                  : selectedTier === "vip"
                  ? `Add VIP Bundle + Free Gift — $${store.bundlePrice.toFixed(2)}`
                  : `Add Solo Edition to Bag — $${store.soloPrice.toFixed(2)}`}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>24h Utah Dispatch</span>
                <span aria-hidden="true">·</span>
                <span>60-Day Risk-Free Trial</span>
                <span aria-hidden="true">·</span>
                <span>Insured US Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Interactive "Build Your Own 3-Piece Custom Bundle" Architect */}
        <section
          id="custom-bundle"
          className="rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs text-emerald-400 font-semibold">
                Interactive Mix &amp; Match Bundle Architect · Save 25% + Free VIP Gift
              </p>
              <h2 className={`text-2xl font-bold text-white mt-0.5 ${headingFontClass}`}>
                Curate Your Custom 3-Piece {store.name} Suite
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select any 3 products below to build your personalized bundle. Automatically unlocks 25% off plus the complimentary {store.freeGift}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div className="text-right font-mono tabular-nums">
                <div className="text-xs text-slate-400">
                  Bundle Total (Save ${customBundleSavingsAmount.toFixed(2)}):
                </div>
                <div className="text-xl font-bold text-white">
                  ${customBundleDiscountedTotal.toFixed(2)}{" "}
                  <span className="text-xs text-slate-500 line-through font-normal">
                    ${customBundleRetailTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustomBundleToBag}
                className="px-5 py-3 rounded-xl text-xs font-bold text-slate-950 transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 font-mono tabular-nums"
                style={{ backgroundColor: store.accentColor }}
              >
                Add Custom 3-Pack — ${customBundleDiscountedTotal.toFixed(2)}
              </button>
            </div>
          </div>

          {/* 3 Visual Bundle Slots + 6 Selectable Product Toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Selected 3 Bundle Slots + Free Gift Slot */}
            <div className="lg:col-span-5 space-y-2.5 bg-[#090D16] p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Your Active Bundle Slots ({customBundleProducts.length} of 3 Selected)
              </div>
              {customBundleProducts.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <span className="font-mono text-slate-500 mr-2">0{idx + 1}.</span>
                    <span className="font-semibold text-white">{prod.title}</span>
                  </div>
                  <span className="font-mono text-emerald-400 shrink-0 tabular-nums">
                    ${(prod.price * 0.75).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
                <span className="truncate font-medium">
                  04. Unlocked VIP Gift: {store.freeGift}
                </span>
                <span className="font-mono font-bold shrink-0">FREE</span>
              </div>
            </div>

            {/* Right 7 Cols: Clickable 6-SKU Picker Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {store.products.map((prod) => {
                const isPicked = customBundleIds.includes(prod.id);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleToggleProductInCustomBundle(prod.id)}
                    className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col justify-between gap-2 ${
                      isPicked
                        ? "bg-slate-900 border-emerald-400 text-white"
                        : "bg-[#090D16] border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{prod.department || prod.category}</span>
                        <span
                          className={`font-mono font-semibold ${
                            isPicked ? "text-emerald-400" : "text-slate-500"
                          }`}
                        >
                          {isPicked ? "✓ In Bundle" : "+ Select"}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white mt-1 line-clamp-1">
                        {prod.title}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Bundle Price:</span>
                      <span className="text-white font-bold">
                        ${(prod.price * 0.75).toFixed(2)}{" "}
                        <span className="text-slate-500 line-through font-normal">
                          ${prod.price.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: Categorized 6-Product Collection Grid with Segmented Filter Controls & Sort */}
        <section id="collection-grid" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {store.niche} · {store.products.length} Categorized SKUs
              </p>
              <h2 className={`text-2xl font-bold text-white mt-0.5 ${headingFontClass}`}>
                Shop {store.name} by Department
              </h2>
            </div>

            {/* Interactive Segmented Department Filter Tabs & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="tablist"
                aria-label="Filter products by department"
                className="flex items-center gap-1 p-1 bg-[#0F172A] border border-slate-800 rounded-lg overflow-x-auto"
              >
                {productCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? "text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
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
              </div>

              <label htmlFor="collection-sort" className="sr-only">
                Sort products
              </label>
              <select
                id="collection-sort"
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0F172A] border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 outline-none"
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
                className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:border-slate-700"
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
                    {/* Unboxed Metadata with Middot Separators */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{product.department || product.category}</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {product.tag} · {product.rating || 4.9}★ ({product.reviewsCount || 142})
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white leading-snug">
                      {product.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 tabular-nums">
                      <span className="truncate">{product.specs}</span>
                      <span className="text-emerald-400 shrink-0 ml-2">
                        {product.inStockCount || 18} in stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between pt-3 border-t border-slate-800/80 font-mono tabular-nums">
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
                      className="text-xs font-sans text-sky-400 hover:underline"
                    >
                      Quick View
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors whitespace-nowrap font-mono tabular-nums"
                  >
                    Add to Bag — ${product.price.toFixed(2)}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 4: Competitor Comparison Matrix & Attributable Buyer Proof */}
        <section
          id="comparison-matrix"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* Left 7 Cols: Competitor Comparison Table */}
          {store.comparisonRows && (
            <div className="lg:col-span-7 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    Transparent Value Architecture
                  </p>
                  <h2 className={`text-2xl font-bold text-white mt-0.5 ${headingFontClass}`}>
                    Why Customers Switch to {store.name}
                  </h2>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">
                  Save 70%+ vs. Legacy Retail
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090D16]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-300">
                      <th className="py-3.5 px-4">Specification</th>
                      <th
                        className="py-3.5 px-4 font-bold text-slate-950"
                        style={{ backgroundColor: store.accentColor }}
                      >
                        {store.name}
                      </th>
                      <th className="py-3.5 px-4 text-slate-400">Legacy Retail</th>
                      <th className="py-3.5 px-4 text-slate-400">Boutique Studio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {store.comparisonRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 font-semibold text-white">
                          {row.feature}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-400 bg-slate-900/40">
                          {row.brandValue}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {row.legacyCompetitor}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {row.clinicOrBoutique}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Right 5 Cols: Attributable Buyer Proof + Interactive Store Specialist */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Verified Buyer Outcome · {store.testimonial.verifiedProduct}
              </div>
              <blockquote
                className={`text-lg text-slate-100 leading-relaxed ${headingFontClass}`}
              >
                &ldquo;{store.testimonial.quote}&rdquo;
              </blockquote>
              <div className="text-xs text-slate-400">
                <strong className="text-white">{store.testimonial.author}</strong> ·{" "}
                {store.testimonial.role} · {store.testimonial.location}
              </div>
            </div>

            <div className="pt-5 border-t border-slate-800 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Ask the {store.name} Product Specialist
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Instant sizing, ritual protocols, or gift curation advice.
                </p>
              </div>

              <form onSubmit={handleAskConcierge} className="flex gap-2">
                <label htmlFor="store-concierge-input" className="sr-only">
                  Ask the store specialist a question
                </label>
                <input
                  id="store-concierge-input"
                  type="text"
                  value={conciergeQuery}
                  onChange={(e) => setConciergeQuery(e.target.value)}
                  placeholder={`Ask about ${store.hero}...`}
                  className="flex-1 bg-[#090D16] border border-slate-700 focus:border-white text-xs text-white rounded-lg px-3 py-2 outline-none"
                />
                <button
                  type="submit"
                  disabled={conciergeLoading}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
                  style={{ backgroundColor: store.accentColor }}
                >
                  {conciergeLoading ? "Asking..." : "Ask"}
                </button>
              </form>

              {conciergeReply && (
                <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {conciergeReply}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Compliance Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} {store.name} · 24h Salt Lake City, Utah Fulfillment · 60-Day Trial Guarantee
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsTrackModalOpen(true)}
              className="hover:text-slate-300 whitespace-nowrap"
            >
              Track Order
            </button>
            <Link href="/stores" className="hover:text-slate-300 whitespace-nowrap">
              Browse All 15 Stores
            </Link>
            <Link href="/" className="hover:text-slate-300 whitespace-nowrap">
              Mission Control
            </Link>
          </div>
        </div>
      </footer>

      {/* MODULE 2: MOBILE & SCROLL STICKY PDP CONVERSION BAR (IntersectionObserver Synced) */}
      <div
        data-testid="sticky-pdp-buy-bar"
        data-sticky-active={isStickyPdpBarShown ? "true" : "false"}
        className={`fixed bottom-0 left-0 right-0 z-30 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 px-6 py-2.5 transition-transform duration-300 ${
          isStickyPdpBarShown ? "translate-y-0" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {store.hero} ·{" "}
              {selectedTier === "master"
                ? "Master Suite"
                : selectedTier === "vip"
                ? "VIP Bundle (+ Free Gift)"
                : "Solo Edition"}{" "}
              · <span className="font-normal text-slate-300">{selectedEdition.split("·")[0].trim()}</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              In Stock ({store.shippingHub}) · Free Standard Shipping at $50.00
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAddHeroTier()}
            className="px-5 py-2 rounded-lg text-xs font-bold text-slate-950 whitespace-nowrap shrink-0 font-mono tabular-nums"
            style={{ backgroundColor: store.accentColor }}
          >
            Quick Buy — ${activeTierPrice.toFixed(2)}
          </button>
        </div>
      </div>

      {/* MODULE 3: PREDICTIVE INSTANT SEARCH MODAL (CMD+K / CTRL+K) */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-xs pt-20 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Predictive Instant Search"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#0F172A] border border-slate-700 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <label htmlFor="predictive-search-input" className="sr-only">
                Search {store.name} products
              </label>
              <input
                id="predictive-search-input"
                type="search"
                autoFocus
                value={predictiveQuery}
                onChange={(e) => setPredictiveQuery(e.target.value)}
                placeholder={`Instant search across ${store.name} (${store.products.length} SKUs)...`}
                className="flex-1 bg-[#090D16] border border-slate-700 focus:border-emerald-400 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                ESC
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
              {predictiveResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No products matching &ldquo;{predictiveQuery}&rdquo;.
                </p>
              ) : (
                predictiveResults.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl bg-[#090D16] border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {prod.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {prod.department || prod.category} ·{" "}
                        <span className="text-emerald-400 font-mono">
                          In Stock ({prod.inStockCount || 18} units)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-white font-mono tabular-nums">
                        ${prod.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddProduct(prod);
                          setIsSearchModalOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 whitespace-nowrap"
                        style={{ backgroundColor: store.accentColor }}
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
                <span>{quickViewProduct.department || quickViewProduct.category}</span>
                <span className="font-mono tabular-nums">
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
                <div className="text-lg font-bold text-white font-mono tabular-nums">
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
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-950 font-mono tabular-nums"
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
                <div className="font-bold text-emerald-400 font-mono">
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
                  <p className="text-xs text-slate-400 font-mono tabular-nums">
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

              {/* MODULE 1: Dynamic $50 Free Standard Shipping Progress Bar & VIP Gift Status */}
              {(() => {
                const shippingThreshold = 50;
                const remainingFor50 = Math.max(
                  0,
                  Number((shippingThreshold - cartSummary.subtotal).toFixed(2))
                );
                const progressPct = Math.min(
                  100,
                  Math.round((cartSummary.subtotal / shippingThreshold) * 100)
                );
                return (
                  <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800 space-y-2.5 text-xs">
                    {remainingFor50 === 0 || cartSummary.freeShippingUnlocked ? (
                      <div className="text-emerald-400 font-semibold">
                        🎉 You&apos;ve unlocked Free Standard Shipping!
                      </div>
                    ) : (
                      <div className="text-slate-300">
                        Add{" "}
                        <strong className="text-white font-mono tabular-nums">
                          ${remainingFor50.toFixed(2)}
                        </strong>{" "}
                        more to unlock Free Standard Shipping
                      </div>
                    )}

                    {/* Animated Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {cartSummary.vipGiftUnlocked && (
                      <div className="text-amber-300 font-medium pt-1 border-t border-slate-800">
                        ✓ Complimentary VIP Gift Included: {store.freeGift} (FREE)
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Order Confirmation State + 1-Click Post-Purchase Vault Upsell & Conglomerate VIP Passport */}
              {confirmedOrder ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      Order #{confirmedOrder.orderNumber} Confirmed — Preparing Shipment
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Thank you, {confirmedOrder.customerName}!
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your order has been dispatched to our {store.shippingHub} and synced to the live Fleet Mission Control fulfillment stream.
                    </p>
                    <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800 font-mono tabular-nums">
                      <div>
                        <strong>Recipient:</strong> {confirmedOrder.email}
                      </div>
                      <div>
                        <strong>Shipping To:</strong> {confirmedOrder.address}
                      </div>
                      {confirmedOrder.freeGift && (
                        <div className="text-amber-300">
                          <strong>Included VIP Gift:</strong> {confirmedOrder.freeGift} (FREE)
                        </div>
                      )}
                      <div className="text-sm font-bold text-white pt-1">
                        Total Charged: ${confirmedOrder.total.toFixed(2)}
                      </div>
                      <div className="pt-2">
                        <Link
                          href="/account/orders"
                          className="inline-flex items-center text-xs font-bold text-emerald-400 hover:underline"
                        >
                          View in Account Order History (/account/orders) →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Post-Purchase Vault Merge Offer */}
                  <div className="p-4 rounded-xl bg-[#090D16] border border-amber-500/40 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        VIP Post-Purchase Vault Offer (-45% Off)
                      </span>
                      <span className="font-mono text-emerald-400">$0 Extra Shipping</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Add a second <strong>{store.hero}</strong> to Order #{confirmedOrder.orderNumber} before it leaves our Utah hub for{" "}
                      <strong className="text-white font-mono">
                        ${(store.soloPrice * 0.55).toFixed(2)}
                      </strong>{" "}
                      (Reg. ${store.soloPrice.toFixed(2)}).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const addonPrice = Number((store.soloPrice * 0.55).toFixed(2));
                        setConfirmedOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                total: Number((prev.total + addonPrice).toFixed(2)),
                              }
                            : prev
                        );
                        triggerToast(`Merged 2nd ${store.hero} into Order #${confirmedOrder.orderNumber}!`);
                      }}
                      className="w-full py-2.5 px-4 rounded-lg text-xs font-bold text-slate-950 font-mono tabular-nums"
                      style={{ backgroundColor: store.accentColor }}
                    >
                      1-Click Merge to Order #{confirmedOrder.orderNumber} — +${(store.soloPrice * 0.55).toFixed(2)}
                    </button>
                  </div>

                  {/* Cross-Brand Conglomerate Loyalty Passport */}
                  <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2 text-xs">
                    <div className="font-semibold text-white">
                      Unlocked: 15-Store Conglomerate VIP Passport
                    </div>
                    <p className="text-slate-400">
                      Use code <strong className="font-mono text-emerald-400">FLEETVIP15</strong> on any sister brand in our 15-store fleet:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {INITIAL_STORES.filter((s) => s.id !== store.id)
                        .slice(0, 4)
                        .map((sister) => (
                          <Link
                            key={sister.id}
                            href={`/stores/${sister.id}`}
                            onClick={() => setIsCartOpen(false)}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium"
                          >
                            {sister.name} →
                          </Link>
                        ))}
                    </div>
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
                    Restore VIP Bundle + Free Gift
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
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.variantLabel}
                          </div>
                          <div className="text-xs font-bold text-white font-mono tabular-nums">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            aria-label={`Decrease quantity of ${item.title}`}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono tabular-nums w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            aria-label={`Increase quantity of ${item.title}`}
                            className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Unlocked Free Gift Line Item */}
                    {cartSummary.vipGiftUnlocked && (
                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-amber-300">
                            {store.freeGift}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Automatically unlocked with VIP Bundle
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          FREE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 1-Click In-Drawer VIP Refill / Companion Upgrade */}
                  {refillUpsellProduct && !isRefillInCart && (
                    <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400">
                          VIP In-Bag Companion Offer
                        </span>
                        <span className="font-mono text-white font-bold tabular-nums">
                          ${refillUpsellProduct.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {refillUpsellProduct.title}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(refillUpsellProduct)}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                      >
                        + Add Companion Refill to Bag
                      </button>
                    </div>
                  )}

                  {/* Express Checkout Form */}
                  <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Express 24h Utah Fulfillment Checkout
                    </div>

                    {checkoutError && (
                      <div
                        role="alert"
                        className="p-2.5 rounded bg-red-950/50 border border-red-500/40 text-xs text-red-300"
                      >
                        {checkoutError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="checkout-name" className="block text-xs text-slate-300 mb-1">
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
                      <label htmlFor="checkout-email" className="block text-xs text-slate-300 mb-1">
                        Email for Tracking Receipt *
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
                      <label htmlFor="checkout-address" className="block text-xs text-slate-300 mb-1">
                        Street Address *
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
                      <label htmlFor="checkout-city-zip" className="block text-xs text-slate-300 mb-1">
                        City, State &amp; ZIP
                      </label>
                      <input
                        id="checkout-city-zip"
                        type="text"
                        value={shippingCityZip}
                        onChange={(e) => setShippingCityZip(e.target.value)}
                        placeholder="Salt Lake City, UT 84101"
                        className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                      />
                    </div>

                    {/* Totals Breakdown */}
                    <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono tabular-nums">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>${cartSummary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>24h Utah Priority Shipping</span>
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
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 transition-opacity hover:opacity-95 font-mono tabular-nums disabled:opacity-50"
                      style={{ backgroundColor: store.accentColor }}
                    >
                      {isSubmittingOrder
                        ? "Dispatching Order to Utah Hub..."
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
