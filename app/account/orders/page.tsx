"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import {
  initAuth,
  googleSignIn,
  logout,
  db,
  OperationType,
  handleFirestoreError,
} from "@/src/lib/firebase";
import { INITIAL_STORES } from "@/lib/stores-catalog";
import {
  type StoreOrderViewModel,
  type OrderFulfillmentStatus,
  INITIAL_PREVIEW_ORDERS,
  validateStoreOrderPayload,
  filterAndSortOrders,
  computeOrdersSummary,
  getStoreBySlug,
  getNextOrderStatus,
} from "@/lib/orders-utils";
import StoreProductVisual from "@/components/StoreProductVisual";

function formatTimestampToIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "string") return val;
  if (
    typeof val === "object" &&
    val !== null &&
    "toDate" in val &&
    typeof (val as Timestamp).toDate === "function"
  ) {
    return (val as Timestamp).toDate().toISOString();
  }
  return new Date().toISOString();
}

function formatReadableDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [authBusy, setAuthBusy] = useState<boolean>(false);

  const [firestoreOrders, setFirestoreOrders] = useState<StoreOrderViewModel[]>([]);
  const [previewOrders, setPreviewOrders] = useState<StoreOrderViewModel[]>(
    INITIAL_PREVIEW_ORDERS
  );
  const [showPreviewWhenEmpty, setShowPreviewWhenEmpty] = useState<boolean>(true);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Filter & Sort state
  const [statusFilter, setStatusFilter] = useState<"all" | OrderFulfillmentStatus>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
  >("date-desc");

  // Selected order for Receipt & Dispatch Drawer
  const [selectedOrder, setSelectedOrder] = useState<StoreOrderViewModel | null>(
    null
  );

  // Record New Order Modal state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [newOrderStoreSlug, setNewOrderStoreSlug] = useState<string>(
    INITIAL_STORES[0].id
  );
  const [newOrderTierType, setNewOrderTierType] = useState<
    "solo" | "vip" | "master"
  >("vip");
  const [newOrderStatus, setNewOrderStatus] =
    useState<OrderFulfillmentStatus>("processing");
  const [newOrderCustomNum, setNewOrderCustomNum] = useState<string>("");
  const [newOrderError, setNewOrderError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 1. Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setIsAuthReady(true);
      },
      () => {
        setUser(null);
        setIsAuthReady(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore listener on `storeOrders` filtered by ownerId == user.uid
  useEffect(() => {
    if (!isAuthReady || !user) {
      setFirestoreOrders([]);
      setIsLoadingFirestore(false);
      return;
    }

    setIsLoadingFirestore(true);
    setErrorBanner(null);

    const ordersQuery = query(
      collection(db, "storeOrders"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const loaded: StoreOrderViewModel[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawStatus = String(data.status || "processing");
          const status: OrderFulfillmentStatus =
            rawStatus === "dispatched" || rawStatus === "completed"
              ? rawStatus
              : "processing";

          return {
            id: docSnap.id,
            ownerId: String(data.ownerId || user.uid),
            orderNumber: String(data.orderNumber || docSnap.id),
            storeSlug: String(data.storeSlug || "bizi-bees"),
            tierLabel: String(data.tierLabel || "VIP Bundle (+ Free Gift)"),
            totalAmount: Number(data.totalAmount || 0),
            status,
            createdAtIso: formatTimestampToIso(data.createdAt),
            updatedAtIso: formatTimestampToIso(data.updatedAt),
            source: "firestore",
          };
        });
        setFirestoreOrders(loaded);
        setIsLoadingFirestore(false);
      },
      (err) => {
        setIsLoadingFirestore(false);
        try {
          handleFirestoreError(err, OperationType.LIST, "storeOrders");
        } catch (formattedErr) {
          setErrorBanner(
            formattedErr instanceof Error
              ? "Unable to query Firestore storeOrders. Verify your account permissions."
              : "Firestore listener error."
          );
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Manual refresh from Firestore via getDocs
  const handleManualRefresh = async () => {
    if (!user) {
      setStatusBanner("Refreshed conglomerate order history.");
      setTimeout(() => setStatusBanner(null), 3000);
      return;
    }
    setIsLoadingFirestore(true);
    setErrorBanner(null);
    try {
      const ordersQuery = query(
        collection(db, "storeOrders"),
        where("ownerId", "==", user.uid)
      );
      const snap = await getDocs(ordersQuery);
      const loaded: StoreOrderViewModel[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const rawStatus = String(data.status || "processing");
        const status: OrderFulfillmentStatus =
          rawStatus === "dispatched" || rawStatus === "completed"
            ? rawStatus
            : "processing";
        return {
          id: docSnap.id,
          ownerId: String(data.ownerId || user.uid),
          orderNumber: String(data.orderNumber || docSnap.id),
          storeSlug: String(data.storeSlug || "bizi-bees"),
          tierLabel: String(data.tierLabel || "VIP Bundle (+ Free Gift)"),
          totalAmount: Number(data.totalAmount || 0),
          status,
          createdAtIso: formatTimestampToIso(data.createdAt),
          updatedAtIso: formatTimestampToIso(data.updatedAt),
          source: "firestore",
        };
      });
      setFirestoreOrders(loaded);
      setStatusBanner(
        `Synchronized ${loaded.length} order record(s) from Firestore storeOrders.`
      );
      setTimeout(() => setStatusBanner(null), 3500);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.LIST, "storeOrders");
      } catch {
        setErrorBanner("Failed to refresh orders from Firestore.");
      }
    } finally {
      setIsLoadingFirestore(false);
    }
  };

  const handleSignIn = async () => {
    setAuthBusy(true);
    setErrorBanner(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setUser(res.user);
        setStatusBanner(
          `Signed in as ${res.user.email}. Connected to Firestore storeOrders.`
        );
        setTimeout(() => setStatusBanner(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in cancelled";
      if (!msg.includes("popup-closed-by-user")) {
        setErrorBanner(`Google Sign-In note: ${msg}`);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setStatusBanner("Signed out of Google account.");
    setTimeout(() => setStatusBanner(null), 3000);
  };

  // Active order source: live Firestore orders when signed in (with optional fallback preview if 0 Firestore docs),
  // or preview orders when browsing unauthenticated.
  const activeOrders = useMemo(() => {
    if (user) {
      if (firestoreOrders.length > 0) return firestoreOrders;
      return showPreviewWhenEmpty ? previewOrders : [];
    }
    return previewOrders;
  }, [user, firestoreOrders, previewOrders, showPreviewWhenEmpty]);

  const filteredOrders = useMemo(
    () =>
      filterAndSortOrders(activeOrders, {
        statusFilter,
        storeFilter,
        searchQuery,
        sortBy,
      }),
    [activeOrders, statusFilter, storeFilter, searchQuery, sortBy]
  );

  const summary = useMemo(
    () => computeOrdersSummary(activeOrders),
    [activeOrders]
  );

  // Selected store in the "Record New Order" modal
  const selectedModalStore = useMemo(
    () => getStoreBySlug(newOrderStoreSlug),
    [newOrderStoreSlug]
  );

  const selectedModalPrice = useMemo(() => {
    if (newOrderTierType === "solo") return selectedModalStore.soloPrice;
    if (newOrderTierType === "master") {
      return (
        selectedModalStore.masterPrice ||
        Number((selectedModalStore.bundlePrice * 1.65).toFixed(2))
      );
    }
    return selectedModalStore.bundlePrice;
  }, [selectedModalStore, newOrderTierType]);

  const selectedModalTierLabel = useMemo(() => {
    if (newOrderTierType === "solo") {
      return `Solo Standard Edition · ${selectedModalStore.hero}`;
    }
    if (newOrderTierType === "master") {
      return `Master Collector Suite (+ Free ${selectedModalStore.freeGift})`;
    }
    return `VIP Bundle (+ Free ${selectedModalStore.freeGift})`;
  }, [selectedModalStore, newOrderTierType]);

  // Create a new order in Firestore `storeOrders` (if signed in) and local state
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewOrderError(null);

    const generatedOrderNum = newOrderCustomNum.trim()
      ? newOrderCustomNum.trim().replace(/[^a-zA-Z0-9_-]/g, "-")
      : `UT-${Math.floor(100000 + Math.random() * 900000)}`;

    const ownerUid = user?.uid || "preview-operator";
    const candidatePayload = {
      ownerId: ownerUid.slice(0, 128),
      orderNumber: generatedOrderNum.slice(0, 64),
      storeSlug: selectedModalStore.id.slice(0, 64),
      tierLabel: selectedModalTierLabel.slice(0, 120),
      totalAmount: Number(selectedModalPrice),
      status: newOrderStatus,
    };

    const validation = validateStoreOrderPayload(candidatePayload);
    if (!validation.valid) {
      setNewOrderError(validation.error || "Invalid order details.");
      return;
    }

    setIsSavingOrder(true);
    try {
      if (user && user.emailVerified) {
        const orderDocId = candidatePayload.orderNumber;
        try {
          await setDoc(doc(db, "storeOrders", orderDocId), {
            ...candidatePayload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setStatusBanner(
            `Saved order ${orderDocId} ($${candidatePayload.totalAmount.toFixed(
              2
            )}) to Firestore storeOrders.`
          );
        } catch (fsErr) {
          try {
            handleFirestoreError(
              fsErr,
              OperationType.CREATE,
              `storeOrders/${orderDocId}`
            );
          } catch {
            setNewOrderError(
              "Firestore rejected the write. Ensure your Google account email is verified."
            );
            setIsSavingOrder(false);
            return;
          }
        }
      } else {
        const nowIso = new Date().toISOString();
        const createdOrder: StoreOrderViewModel = {
          id: candidatePayload.orderNumber,
          ownerId: candidatePayload.ownerId,
          orderNumber: candidatePayload.orderNumber,
          storeSlug: candidatePayload.storeSlug,
          tierLabel: candidatePayload.tierLabel,
          totalAmount: candidatePayload.totalAmount,
          status: candidatePayload.status,
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
          source: "preview",
        };
        setPreviewOrders((prev) => [createdOrder, ...prev]);
        setStatusBanner(
          `Recorded order ${createdOrder.orderNumber} ($${createdOrder.totalAmount.toFixed(
            2
          )}) for ${selectedModalStore.name}.`
        );
      }

      setNewOrderCustomNum("");
      setIsNewOrderModalOpen(false);
      setTimeout(() => setStatusBanner(null), 4000);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Seed 3 sample orders directly into Firestore `storeOrders` for the authenticated user
  const handleSeedFirestoreOrders = async () => {
    if (!user || !user.emailVerified) {
      setErrorBanner(
        "Sign in with a verified Google account to seed live records into Firestore storeOrders."
      );
      return;
    }
    setIsSavingOrder(true);
    setErrorBanner(null);
    try {
      const sampleTemplates = [
        {
          orderNumber: `UT-${Math.floor(100000 + Math.random() * 900000)}`,
          storeSlug: "bizi-bees",
          tierLabel: "VIP Bundle (+ Free Honeycomb Dipper) · Raw Reserve",
          totalAmount: 58.0,
          status: "dispatched" as OrderFulfillmentStatus,
        },
        {
          orderNumber: `UT-${Math.floor(100000 + Math.random() * 900000)}`,
          storeSlug: "luma-clinical",
          tierLabel: "Master Collector Suite · 660nm Red Light Therapy",
          totalAmount: 145.2,
          status: "completed" as OrderFulfillmentStatus,
        },
        {
          orderNumber: `UT-${Math.floor(100000 + Math.random() * 900000)}`,
          storeSlug: "ember-oak",
          tierLabel: "VIP Bundle (+ Free Cedar Torch) · Smoked Bourbon Kit",
          totalAmount: 79.0,
          status: "processing" as OrderFulfillmentStatus,
        },
      ];

      for (const item of sampleTemplates) {
        try {
          await setDoc(doc(db, "storeOrders", item.orderNumber), {
            ownerId: user.uid.slice(0, 128),
            orderNumber: item.orderNumber,
            storeSlug: item.storeSlug,
            tierLabel: item.tierLabel,
            totalAmount: item.totalAmount,
            status: item.status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (fsErr) {
          handleFirestoreError(
            fsErr,
            OperationType.CREATE,
            `storeOrders/${item.orderNumber}`
          );
        }
      }
      setStatusBanner(
        "Seeded 3 verified orders directly into your Firestore storeOrders collection."
      );
      setTimeout(() => setStatusBanner(null), 4000);
    } catch {
      setErrorBanner("Failed to seed orders into Firestore storeOrders.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Advance order status: processing -> dispatched -> completed
  const handleAdvanceStatus = async (order: StoreOrderViewModel) => {
    const nextStatus = getNextOrderStatus(order.status);
    if (!nextStatus) return;

    setUpdatingOrderId(order.id);
    setErrorBanner(null);

    try {
      if (order.source === "firestore" && user) {
        try {
          await updateDoc(doc(db, "storeOrders", order.id), {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
          setStatusBanner(
            `Updated Firestore order ${order.orderNumber} status to ${nextStatus.toUpperCase()}.`
          );
        } catch (fsErr) {
          try {
            handleFirestoreError(
              fsErr,
              OperationType.UPDATE,
              `storeOrders/${order.id}`
            );
          } catch {
            setErrorBanner(
              `Permission denied updating order ${order.orderNumber} in Firestore.`
            );
          }
        }
      } else {
        const nowIso = new Date().toISOString();
        setPreviewOrders((prev) =>
          prev.map((item) =>
            item.id === order.id
              ? { ...item, status: nextStatus, updatedAtIso: nowIso }
              : item
          )
        );
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({
            ...selectedOrder,
            status: nextStatus,
            updatedAtIso: nowIso,
          });
        }
        setStatusBanner(
          `Advanced order ${order.orderNumber} fulfillment status to ${nextStatus.toUpperCase()}.`
        );
      }
      setTimeout(() => setStatusBanner(null), 3500);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            href="/account/orders"
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Bizi Bees Account · Order Vault
          </Link>

          <nav
            aria-label="Account navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400"
          >
            <Link
              href="/"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Mission Control
            </Link>
            <Link
              href="/stores"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              All 15 Stores
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

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              + Record Store Order
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-8 flex-1">
        {/* Hero Header + Firestore Connection & Auth Controls */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium text-emerald-400">
              Firestore Collection: storeOrders · 24h Utah Fulfillment Hub · Conglomerate VIP Passport
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-[family-name:var(--font-serif)]">
              Past Order History &amp; Dispatch Ledger
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              View, filter, and track every order placed across all 15 direct-to-consumer brands in real time via the{" "}
              <code className="text-emerald-300 font-mono text-xs">
                storeOrders
              </code>{" "}
              collection in Firestore.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <div className="px-3.5 py-2 rounded-lg bg-[#0F172A] border border-slate-800 text-xs text-slate-300">
                  Signed in as{" "}
                  <strong className="text-white font-mono">{user.email}</strong>
                  <span className="mx-1.5 text-slate-600">·</span>
                  <span className="text-emerald-400 font-mono">
                    {firestoreOrders.length} Firestore doc(s)
                  </span>
                </div>
                {firestoreOrders.length === 0 && (
                  <button
                    type="button"
                    onClick={handleSeedFirestoreOrders}
                    disabled={isSavingOrder}
                    className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isSavingOrder
                      ? "Seeding..."
                      : "Seed 3 Orders to Firestore"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isLoadingFirestore}
                  className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  {isLoadingFirestore ? "Syncing..." : "Sync Firestore"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={authBusy}
                  className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-colors shadow-sm"
                >
                  {authBusy
                    ? "Connecting Google Auth..."
                    : "Sign in with Google to Load Live Firestore Orders"}
                </button>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="px-3.5 py-2.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Refresh Ledger
                </button>
              </>
            )}
          </div>
        </section>

        {/* Status / Error Feedback Banners */}
        {statusBanner && (
          <div
            role="status"
            className="rounded-lg bg-emerald-950/60 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between"
          >
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-emerald-300 hover:text-white font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorBanner && (
          <div
            role="alert"
            className="rounded-lg bg-rose-950/60 border border-rose-500/40 px-4 py-3 text-xs text-rose-200 flex items-center justify-between"
          >
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="text-rose-300 hover:text-white font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 4-Card Summary KPI Row */}
        <section
          aria-label="Order History Summary Metrics"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <div className="p-5 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400">Total Recorded Orders</p>
            <p
              data-testid="summary-total-orders"
              className="text-2xl font-bold text-white font-mono tabular-nums"
            >
              {summary.totalOrders}
            </p>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              {summary.processingCount} processing · {summary.dispatchedCount} in transit ·{" "}
              {summary.completedCount} completed
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400">Cumulative Order Spend</p>
            <p
              data-testid="summary-total-spend"
              className="text-2xl font-bold text-emerald-400 font-mono tabular-nums"
            >
              ${summary.totalSpend.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              Avg Order Value: ${summary.averageOrderValue.toFixed(2)}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400">Unlocked VIP Bundle Gifts</p>
            <p className="text-2xl font-bold text-amber-300 font-mono tabular-nums">
              {summary.vipBundlesCount} Unlocked
            </p>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              Complimentary gift value: ${summary.unlockedGiftValueTotal.toFixed(0)}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1">
            <p className="text-xs text-slate-400">Conglomerate VIP Passport</p>
            <p className="text-2xl font-bold text-sky-400 font-mono tabular-nums">
              FLEETVIP15
            </p>
            <p className="text-xs text-slate-400">
              15% off cross-brand orders across all 15 stores
            </p>
          </div>
        </section>

        {/* Filter, Brand Selector, Sort & Search Controls */}
        <section className="rounded-xl bg-[#0F172A] border border-slate-800 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter orders by fulfillment status"
              className="flex items-center gap-1.5 p-1 bg-[#090D16] border border-slate-800 rounded-lg overflow-x-auto"
            >
              {(
                [
                  { id: "all", label: `All Orders (${summary.totalOrders})` },
                  {
                    id: "processing",
                    label: `Processing (${summary.processingCount})`,
                  },
                  {
                    id: "dispatched",
                    label: `Dispatched (${summary.dispatchedCount})`,
                  },
                  {
                    id: "completed",
                    label: `Completed (${summary.completedCount})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums ${
                    statusFilter === tab.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search + Store Filter + Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label htmlFor="order-search-input" className="sr-only">
                  Search orders by order number, store, or bundle tier
                </label>
                <input
                  id="order-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, store, or tier..."
                  className="w-full sm:w-60 bg-[#090D16] border border-slate-800 focus:border-emerald-400 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="order-store-filter" className="sr-only">
                  Filter orders by storefront brand
                </label>
                <select
                  id="order-store-filter"
                  aria-label="Filter orders by storefront brand"
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="all">All 15 Storefronts</option>
                  {INITIAL_STORES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="order-sort-select" className="sr-only">
                  Sort orders
                </label>
                <select
                  id="order-sort-select"
                  aria-label="Sort orders"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as
                        | "date-desc"
                        | "date-asc"
                        | "amount-desc"
                        | "amount-asc"
                    )
                  }
                  className="bg-[#090D16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="date-desc">Sort: Newest First</option>
                  <option value="date-asc">Sort: Oldest First</option>
                  <option value="amount-desc">Sort: Highest Amount</option>
                  <option value="amount-asc">Sort: Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {user && firestoreOrders.length === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <span>
                Your authenticated Firestore{" "}
                <code className="text-emerald-300 font-mono">storeOrders</code>{" "}
                collection currently has 0 documents.{" "}
                {showPreviewWhenEmpty
                  ? "Showing conglomerate preview orders below."
                  : "Preview orders hidden."}
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewWhenEmpty((prev) => !prev)}
                className="text-sky-400 hover:underline font-medium"
              >
                {showPreviewWhenEmpty
                  ? "Show Empty State Only"
                  : "Show Preview Orders"}
              </button>
            </div>
          )}
        </section>

        {/* Order History List / Empty State */}
        {filteredOrders.length === 0 ? (
          <section className="rounded-xl bg-[#0F172A] border border-slate-800 p-12 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">
              No Matching Orders Found
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              No orders in{" "}
              <code className="text-emerald-300 font-mono">storeOrders</code>{" "}
              matched your current filter criteria. Reset your filters or record a new order across any of our 15 storefronts.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setStoreFilter("all");
                  setSearchQuery("");
                  setShowPreviewWhenEmpty(true);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-slate-950 transition-colors"
              >
                + Record Store Order
              </button>
            </div>
          </section>
        ) : (
          <section
            aria-label="Past Orders List"
            className="space-y-4"
          >
            {filteredOrders.map((order, idx) => {
              const store = getStoreBySlug(order.storeSlug);
              const nextStatus = getNextOrderStatus(order.status);

              const statusColorClass =
                order.status === "completed"
                  ? "text-emerald-400"
                  : order.status === "dispatched"
                  ? "text-sky-400"
                  : "text-amber-300";

              const statusLabel =
                order.status === "completed"
                  ? "COMPLETED · DELIVERED"
                  : order.status === "dispatched"
                  ? "DISPATCHED · IN TRANSIT"
                  : "PROCESSING · UTAH HUB";

              return (
                <article
                  key={order.id}
                  data-testid={`order-card-${order.orderNumber}`}
                  className="rounded-xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-colors p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 flex-1 min-w-0">
                    {/* Brand Emblem & Flagship SKU Badge */}
                    <div
                      className="w-full sm:w-48 shrink-0 rounded-xl bg-[#090D16] border border-slate-800 p-4 flex flex-col justify-between space-y-3"
                      style={{ borderLeftWidth: "3px", borderLeftColor: store.accentColor }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span
                          className="font-bold uppercase tracking-wider truncate"
                          style={{ color: store.accentColor }}
                        >
                          {store.id}
                        </span>
                        <span className="text-slate-400">24h Utah</span>
                      </div>
                      <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                        {store.hero}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums pt-1 border-t border-slate-800/80">
                        <span>{store.products.length} SKUs</span>
                        <span className="text-emerald-400">Verified ✓</span>
                      </div>
                    </div>

                    {/* Order Metadata & Details */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
                        <span className="font-bold text-white">
                          {order.orderNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className={`font-semibold ${statusColorClass}`}>
                          {statusLabel}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-400">
                          {formatReadableDate(order.createdAtIso)}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="text-slate-400">
                          {order.source === "firestore"
                            ? "Firestore Live"
                            : "Vault Record"}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Link
                          href={`/stores/${store.id}`}
                          className="text-lg font-bold text-white hover:underline tracking-tight"
                        >
                          {store.name}
                        </Link>
                        <span className="text-xs text-slate-400">
                          ({store.niche})
                        </span>
                      </div>

                      <p className="text-sm text-slate-200 font-medium truncate">
                        {order.tierLabel}
                      </p>

                      <p className="text-xs text-slate-400">
                        Fulfillment: {store.shippingHub} · Free VIP Gift:{" "}
                        <span className="text-amber-300">{store.freeGift}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Price + Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 shrink-0">
                    <div className="text-left lg:text-right">
                      <p className="text-xs text-slate-400">Order Total</p>
                      <p className="text-2xl font-bold text-white font-mono tabular-nums">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {nextStatus && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleAdvanceStatus(order)}
                          className="px-3 py-2 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 transition-colors whitespace-nowrap"
                        >
                          {updatingOrderId === order.id
                            ? "Updating..."
                            : `Mark ${
                                nextStatus === "dispatched"
                                  ? "Dispatched"
                                  : "Completed"
                              }`}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                      >
                        View Receipt &amp; Dispatch
                      </button>

                      <Link
                        href={`/stores/${store.id}`}
                        className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-950 transition-opacity hover:opacity-90 whitespace-nowrap"
                        style={{ backgroundColor: store.accentColor }}
                      >
                        Buy Again →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Slide-Over Order Receipt & Utah Dispatch Telemetry Drawer */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Order Receipt ${selectedOrder.orderNumber}`}
        >
          <div className="w-full max-w-lg bg-[#0F172A] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-mono text-emerald-400">
                    FIRESTORE RECORD · storeOrders/{selectedOrder.id}
                  </p>
                  <h2 className="text-xl font-bold text-white font-mono tabular-nums">
                    Order {selectedOrder.orderNumber}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                >
                  Close ✕
                </button>
              </div>

              {(() => {
                const detailStore = getStoreBySlug(selectedOrder.storeSlug);
                const nextStatus = getNextOrderStatus(selectedOrder.status);
                return (
                  <div className="space-y-5">
                    <StoreProductVisual
                      storeId={detailStore.id}
                      productIndex={0}
                      accentColor={detailStore.accentColor}
                      secondaryColor={detailStore.secondaryColor}
                      title={detailStore.hero}
                      category={detailStore.name}
                    />

                    <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Storefront Brand</span>
                        <span className="text-white font-semibold">
                          {detailStore.name} ({detailStore.id})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Selected Tier</span>
                        <span className="text-slate-200 font-medium text-right max-w-[240px]">
                          {selectedOrder.tierLabel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Unlocked VIP Gift</span>
                        <span className="text-amber-300 font-medium text-right max-w-[240px]">
                          {detailStore.freeGift}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fulfillment Hub</span>
                        <span className="text-slate-200">
                          {detailStore.shippingHub}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Placed Timestamp</span>
                        <span className="text-slate-300 font-mono tabular-nums">
                          {formatReadableDate(selectedOrder.createdAtIso)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Updated</span>
                        <span className="text-slate-300 font-mono tabular-nums">
                          {formatReadableDate(selectedOrder.updatedAtIso)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                        <span className="text-slate-300 font-semibold">
                          Total Charged (USD)
                        </span>
                        <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                          ${selectedOrder.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* 3-Step Fulfillment Milestone Timeline */}
                    <div className="rounded-xl bg-[#090D16] border border-slate-800 p-4 space-y-3">
                      <p className="text-xs font-semibold text-white uppercase tracking-wider">
                        Utah Priority Fulfillment Pipeline
                      </p>
                      <ol className="space-y-2.5 text-xs">
                        <li className="flex items-center justify-between">
                          <span className="text-emerald-400 font-medium">
                            01. Order Verified &amp; Allocated
                          </span>
                          <span className="font-mono text-slate-400">
                            Completed
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span
                            className={
                              selectedOrder.status === "dispatched" ||
                              selectedOrder.status === "completed"
                                ? "text-emerald-400 font-medium"
                                : "text-slate-400"
                            }
                          >
                            02. Dispatched from Utah Hub (USPS Priority)
                          </span>
                          <span className="font-mono text-slate-400">
                            {selectedOrder.status === "dispatched" ||
                            selectedOrder.status === "completed"
                              ? "Dispatched"
                              : "Pending"}
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span
                            className={
                              selectedOrder.status === "completed"
                                ? "text-emerald-400 font-medium"
                                : "text-slate-400"
                            }
                          >
                            03. Delivered &amp; Terminal State Locked
                          </span>
                          <span className="font-mono text-slate-400">
                            {selectedOrder.status === "completed"
                              ? "Locked ✓"
                              : "In Progress"}
                          </span>
                        </li>
                      </ol>

                      {nextStatus && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(selectedOrder)}
                          className="w-full mt-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition-colors"
                        >
                          Advance Status to{" "}
                          {nextStatus === "dispatched"
                            ? "DISPATCHED"
                            : "COMPLETED"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <Link
                href={`/stores/${selectedOrder.storeSlug}`}
                className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold text-center transition-colors"
              >
                Visit Storefront &amp; Reorder →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record a New Order into storeOrders */}
      {isNewOrderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Record Store Order"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-xs font-mono text-emerald-400">
                  FIRESTORE COLLECTION · storeOrders
                </p>
                <h2 className="text-lg font-bold text-white">
                  Record New Storefront Order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="new-order-store"
                  className="block text-xs font-medium text-slate-300"
                >
                  Select Storefront Brand (15 Stores)
                </label>
                <select
                  id="new-order-store"
                  value={newOrderStoreSlug}
                  onChange={(e) => setNewOrderStoreSlug(e.target.value)}
                  className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                >
                  {INITIAL_STORES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.hero}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="new-order-tier"
                  className="block text-xs font-medium text-slate-300"
                >
                  Select Offer Tier Ladder
                </label>
                <select
                  id="new-order-tier"
                  value={newOrderTierType}
                  onChange={(e) =>
                    setNewOrderTierType(
                      e.target.value as "solo" | "vip" | "master"
                    )
                  }
                  className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="solo">
                    Solo Standard Edition (${selectedModalStore.soloPrice.toFixed(2)})
                  </option>
                  <option value="vip">
                    VIP Bundle + Free {selectedModalStore.freeGift} ($
                    {selectedModalStore.bundlePrice.toFixed(2)})
                  </option>
                  <option value="master">
                    Master Collector Suite ($
                    {(
                      selectedModalStore.masterPrice ||
                      selectedModalStore.bundlePrice * 1.65
                    ).toFixed(2)}
                    )
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-order-status"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Initial Status
                  </label>
                  <select
                    id="new-order-status"
                    value={newOrderStatus}
                    onChange={(e) =>
                      setNewOrderStatus(
                        e.target.value as OrderFulfillmentStatus
                      )
                    }
                    className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="processing">processing</option>
                    <option value="dispatched">dispatched</option>
                    <option value="completed">completed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="new-order-number"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Order Number (Optional)
                  </label>
                  <input
                    id="new-order-number"
                    type="text"
                    value={newOrderCustomNum}
                    onChange={(e) => setNewOrderCustomNum(e.target.value)}
                    placeholder="Auto: UT-XXXXXX"
                    className="w-full bg-[#090D16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-[#090D16] border border-slate-800 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tier Label</span>
                  <span className="text-slate-200 font-medium truncate max-w-[220px]">
                    {selectedModalTierLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-emerald-400 font-bold font-mono tabular-nums">
                    ${selectedModalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {newOrderError && (
                <p role="alert" className="text-xs text-rose-400">
                  {newOrderError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-slate-950 transition-colors disabled:opacity-50"
                >
                  {isSavingOrder ? "Saving Order..." : "Save to Order History"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
