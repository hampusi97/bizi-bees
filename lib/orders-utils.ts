import { INITIAL_STORES, getStoreById, type StoreDefinition } from "./stores-catalog";

export type OrderFulfillmentStatus = "processing" | "dispatched" | "completed";

export interface StoreOrderViewModel {
  id: string;
  ownerId: string;
  orderNumber: string;
  storeSlug: string;
  tierLabel: string;
  totalAmount: number;
  status: OrderFulfillmentStatus;
  createdAtIso: string;
  updatedAtIso: string;
  source: "firestore" | "preview";
}

export interface OrdersFilterCriteria {
  statusFilter: "all" | OrderFulfillmentStatus;
  storeFilter: string; // "all" or store.id
  searchQuery: string;
  sortBy: "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
}

export interface OrdersSummaryStats {
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  processingCount: number;
  dispatchedCount: number;
  completedCount: number;
  vipBundlesCount: number;
  unlockedGiftValueTotal: number;
}

const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

/**
 * Verifies outgoing StoreOrderRecord mutations against the exact volumetric and pattern
 * boundaries declared in firebase-blueprint.json and firestore.rules.
 */
export function validateStoreOrderPayload(payload: {
  ownerId: string;
  orderNumber: string;
  storeSlug: string;
  tierLabel: string;
  totalAmount: number;
  status: string;
}): { valid: boolean; error?: string } {
  if (
    !payload.ownerId ||
    payload.ownerId.length < 1 ||
    payload.ownerId.length > 128 ||
    !ID_PATTERN.test(payload.ownerId)
  ) {
    return { valid: false, error: "Invalid ownerId format or length." };
  }
  if (
    !payload.orderNumber ||
    payload.orderNumber.length < 3 ||
    payload.orderNumber.length > 64 ||
    !ID_PATTERN.test(payload.orderNumber)
  ) {
    return {
      valid: false,
      error: "Order number must be 3–64 alphanumeric/hyphen characters (e.g. UT-849201).",
    };
  }
  if (
    !payload.storeSlug ||
    payload.storeSlug.length < 1 ||
    payload.storeSlug.length > 64 ||
    !ID_PATTERN.test(payload.storeSlug)
  ) {
    return { valid: false, error: "Invalid storeSlug identifier." };
  }
  if (
    !payload.tierLabel ||
    payload.tierLabel.trim().length < 1 ||
    payload.tierLabel.length > 120
  ) {
    return { valid: false, error: "Tier label must be between 1 and 120 characters." };
  }
  if (
    typeof payload.totalAmount !== "number" ||
    Number.isNaN(payload.totalAmount) ||
    payload.totalAmount < 0 ||
    payload.totalAmount > 100000
  ) {
    return { valid: false, error: "Total amount must be between $0.00 and $100,000.00." };
  }
  if (
    payload.status !== "processing" &&
    payload.status !== "dispatched" &&
    payload.status !== "completed"
  ) {
    return { valid: false, error: "Status must be processing, dispatched, or completed." };
  }
  return { valid: true };
}

export function getStoreBySlug(storeSlug: string): StoreDefinition {
  return getStoreById(storeSlug) || INITIAL_STORES[0];
}

export function getNextOrderStatus(
  current: OrderFulfillmentStatus
): OrderFulfillmentStatus | null {
  if (current === "processing") return "dispatched";
  if (current === "dispatched") return "completed";
  return null; // Terminal state locked per firestore.rules
}

export function filterAndSortOrders(
  orders: StoreOrderViewModel[],
  criteria: OrdersFilterCriteria
): StoreOrderViewModel[] {
  const q = criteria.searchQuery.trim().toLowerCase();

  const filtered = orders.filter((order) => {
    if (
      criteria.statusFilter !== "all" &&
      order.status !== criteria.statusFilter
    ) {
      return false;
    }
    if (
      criteria.storeFilter !== "all" &&
      order.storeSlug !== criteria.storeFilter
    ) {
      return false;
    }
    if (q) {
      const store = getStoreBySlug(order.storeSlug);
      const matchesOrderNum = order.orderNumber.toLowerCase().includes(q);
      const matchesSlug = order.storeSlug.toLowerCase().includes(q);
      const matchesStoreName = store.name.toLowerCase().includes(q);
      const matchesTier = order.tierLabel.toLowerCase().includes(q);
      const matchesStatus = order.status.toLowerCase().includes(q);
      if (
        !matchesOrderNum &&
        !matchesSlug &&
        !matchesStoreName &&
        !matchesTier &&
        !matchesStatus
      ) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (criteria.sortBy === "amount-desc") {
      return b.totalAmount - a.totalAmount;
    }
    if (criteria.sortBy === "amount-asc") {
      return a.totalAmount - b.totalAmount;
    }
    const timeA = new Date(a.createdAtIso).getTime() || 0;
    const timeB = new Date(b.createdAtIso).getTime() || 0;
    if (criteria.sortBy === "date-asc") {
      return timeA - timeB;
    }
    return timeB - timeA;
  });

  return sorted;
}

export function computeOrdersSummary(
  orders: StoreOrderViewModel[]
): OrdersSummaryStats {
  const totalOrders = orders.length;
  const totalSpend = Number(
    orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toFixed(2)
  );
  const averageOrderValue =
    totalOrders > 0 ? Number((totalSpend / totalOrders).toFixed(2)) : 0;

  let processingCount = 0;
  let dispatchedCount = 0;
  let completedCount = 0;
  let vipBundlesCount = 0;
  let unlockedGiftValueTotal = 0;

  for (const order of orders) {
    if (order.status === "processing") processingCount += 1;
    else if (order.status === "dispatched") dispatchedCount += 1;
    else if (order.status === "completed") completedCount += 1;

    const lowerTier = order.tierLabel.toLowerCase();
    const isVipOrMaster =
      lowerTier.includes("vip") ||
      lowerTier.includes("master") ||
      lowerTier.includes("bundle") ||
      order.totalAmount >= 35;

    if (isVipOrMaster) {
      vipBundlesCount += 1;
      const store = getStoreBySlug(order.storeSlug);
      unlockedGiftValueTotal += store.freeGiftValue || 18;
    }
  }

  return {
    totalOrders,
    totalSpend,
    averageOrderValue,
    processingCount,
    dispatchedCount,
    completedCount,
    vipBundlesCount,
    unlockedGiftValueTotal: Number(unlockedGiftValueTotal.toFixed(2)),
  };
}

export const INITIAL_PREVIEW_ORDERS: StoreOrderViewModel[] = [
  {
    id: "UT-849201",
    ownerId: "preview-operator",
    orderNumber: "UT-849201",
    storeSlug: "bizi-bees",
    tierLabel: "VIP Bundle (+ Free Gift) · Wildflower Raw Reserve",
    totalAmount: 58.0,
    status: "dispatched",
    createdAtIso: "2026-11-10T18:45:00.000Z",
    updatedAtIso: "2026-11-10T19:30:00.000Z",
    source: "preview",
  },
  {
    id: "UT-848914",
    ownerId: "preview-operator",
    orderNumber: "UT-848914",
    storeSlug: "luma-clinical",
    tierLabel: "Master Collector Suite · 660nm Clinical Pro Edition",
    totalAmount: 145.2,
    status: "completed",
    createdAtIso: "2026-11-08T14:20:00.000Z",
    updatedAtIso: "2026-11-09T16:10:00.000Z",
    source: "preview",
  },
  {
    id: "UT-849388",
    ownerId: "preview-operator",
    orderNumber: "UT-849388",
    storeSlug: "ember-oak",
    tierLabel: "VIP Bundle (+ Free Gift) · Charred American Oak",
    totalAmount: 79.0,
    status: "processing",
    createdAtIso: "2026-11-10T20:15:00.000Z",
    updatedAtIso: "2026-11-10T20:15:00.000Z",
    source: "preview",
  },
  {
    id: "UT-847602",
    ownerId: "preview-operator",
    orderNumber: "UT-847602",
    storeSlug: "calmcore",
    tierLabel: "3-Piece Custom Bundle (-25% Off + Free VIP Gift)",
    totalAmount: 96.75,
    status: "completed",
    createdAtIso: "2026-11-05T11:05:00.000Z",
    updatedAtIso: "2026-11-07T09:40:00.000Z",
    source: "preview",
  },
  {
    id: "UT-849110",
    ownerId: "preview-operator",
    orderNumber: "UT-849110",
    storeSlug: "pawglow",
    tierLabel: "VIP Bundle (+ Free Gift) · Therapeutic Pet Care Edition",
    totalAmount: 64.0,
    status: "dispatched",
    createdAtIso: "2026-11-09T22:10:00.000Z",
    updatedAtIso: "2026-11-10T08:00:00.000Z",
    source: "preview",
  },
];
