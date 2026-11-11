/**
 * Predictive Inventory Burn-Rate & Runout Forecaster
 * File: lib/algorithms/inventory-forecaster.ts
 * Implements linear velocity burn model (v = UnitsSold14d / 14) and Days of Inventory Remaining (DIR = Stock / v).
 */

export interface ProductInventoryState {
  productId: string;
  variantId: string;
  storeSlug: string;
  storeName: string;
  title: string;
  sku: string;
  currentStock: number;
  unitsSold14Days: number;
  unitCost: number;
  retailPrice: number;
  leadTimeDays: number;
}

export interface InventoryForecastResult {
  productId: string;
  variantId: string;
  storeSlug: string;
  storeName: string;
  title: string;
  sku: string;
  currentStock: number;
  dailyBurnVelocity: number; // v = unitsSold14Days / 14
  daysRemaining: number; // DIR = Current Stock / v
  projectedRunoutDate: string;
  suggestedReorderQty: number; // v * leadTimeDays * 1.5
  status: "CRITICAL" | "WARNING" | "HEALTHY";
  runoutTrajectory: { day: number; projectedStock: number }[];
}

export function calculateDailyBurnVelocity(unitsSold14Days: number): number {
  return parseFloat((unitsSold14Days / 14).toFixed(3));
}

export function calculateDaysRemaining(
  currentStock: number,
  dailyVelocity: number
): number {
  if (dailyVelocity <= 0) return 999;
  return Math.max(0, parseFloat((currentStock / dailyVelocity).toFixed(1)));
}

export function calculateSuggestedReorder(
  dailyVelocity: number,
  leadTimeDays = 14
): number {
  const base = dailyVelocity * leadTimeDays * 1.5;
  return Math.max(25, Math.ceil(base / 10) * 10);
}

export function forecastProductRunout(
  item: ProductInventoryState
): InventoryForecastResult {
  const v = calculateDailyBurnVelocity(item.unitsSold14Days);
  const daysRemaining = calculateDaysRemaining(item.currentStock, v);

  const runoutMs = Date.now() + daysRemaining * 86400000;
  const projectedRunoutDate = new Date(runoutMs).toISOString().split("T")[0];

  const suggestedReorderQty = calculateSuggestedReorder(v, item.leadTimeDays);

  let status: "CRITICAL" | "WARNING" | "HEALTHY" = "HEALTHY";
  if (daysRemaining < 7) {
    status = "CRITICAL";
  } else if (daysRemaining <= 14) {
    status = "WARNING";
  }

  const runoutTrajectory: { day: number; projectedStock: number }[] = [];
  for (let d = 0; d <= 30; d += 3) {
    const projected = Math.max(0, Math.round(item.currentStock - v * d));
    runoutTrajectory.push({ day: d, projectedStock: projected });
  }

  return {
    productId: item.productId,
    variantId: item.variantId,
    storeSlug: item.storeSlug,
    storeName: item.storeName,
    title: item.title,
    sku: item.sku,
    currentStock: item.currentStock,
    dailyBurnVelocity: v,
    daysRemaining,
    projectedRunoutDate,
    suggestedReorderQty,
    status,
    runoutTrajectory,
  };
}

export function getFleetInventoryForecast(): InventoryForecastResult[] {
  const items: ProductInventoryState[] = [
    {
      productId: "bizi-001",
      variantId: "var-001",
      storeSlug: "bizi-bees",
      storeName: "Bizi Bees Boutique",
      title: "Blind Date with a Book & Cozy Evening Crate (Pre-Loved Hardcover)",
      sku: "BIZI-BOX-VINTAGE",
      currentStock: 14,
      unitsSold14Days: 42, // v = 3.0 units/day -> DIR = 4.7 days (CRITICAL < 7d)
      unitCost: 8.5,
      retailPrice: 28.0,
      leadTimeDays: 7,
    },
    {
      productId: "bizi-002",
      variantId: "var-002",
      storeSlug: "bizi-bees",
      storeName: "Bizi Bees Boutique",
      title: "Solid Brass Honeybee & Botanical Bookmark Set",
      sku: "BIZI-ACC-BRASS",
      currentStock: 6,
      unitsSold14Days: 28, // v = 2.0 units/day -> DIR = 3.0 days (CRITICAL < 7d)
      unitCost: 2.2,
      retailPrice: 14.0,
      leadTimeDays: 10,
    },
    {
      productId: "bizi-003",
      variantId: "var-003",
      storeSlug: "bizi-bees",
      storeName: "Bizi Bees Boutique",
      title: "Heirloom Wooden Mancala & Tabletop Strategy Edition",
      sku: "BIZI-GAME-WOOD",
      currentStock: 28,
      unitsSold14Days: 35, // v = 2.5 units/day -> DIR = 11.2 days (WARNING)
      unitCost: 7.4,
      retailPrice: 34.0,
      leadTimeDays: 12,
    },
    {
      productId: "luma-001",
      variantId: "var-luma1",
      storeSlug: "luma-clinical",
      storeName: "Luma Clinical™",
      title: "LumaGlow™ QuadWave Pro 660nm Red-Light Sculpting Wand",
      sku: "LUMA-GLOW-PRO",
      currentStock: 65,
      unitsSold14Days: 49, // v = 3.5 units/day -> DIR = 18.6 days (HEALTHY)
      unitCost: 11.2,
      retailPrice: 44.0,
      leadTimeDays: 14,
    },
    {
      productId: "ember-001",
      variantId: "var-ember1",
      storeSlug: "ember-oak",
      storeName: "Ember & Oak™ Reserve",
      title: "Charred American Oak Cocktail & Bourbon Smoker Box",
      sku: "EMBER-OAK-SMOKER",
      currentStock: 11,
      unitsSold14Days: 35, // v = 2.5 units/day -> DIR = 4.4 days (CRITICAL < 7d)
      unitCost: 12.0,
      retailPrice: 49.0,
      leadTimeDays: 10,
    },
  ];

  return items.map(forecastProductRunout);
}
