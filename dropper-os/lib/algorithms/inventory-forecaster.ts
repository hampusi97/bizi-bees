/**
 * Predictive Inventory Burn-Rate & Runout Forecaster
 * File: dropper-os/lib/algorithms/inventory-forecaster.ts
 * Implements linear velocity burn model and runout projections.
 */

export interface ProductInventoryState {
  productId: string;
  variantId: string;
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
  title: string;
  sku: string;
  currentStock: number;
  dailyBurnVelocity: number; // v = unitsSold14Days / 14
  daysRemaining: number; // Current Inventory / v
  projectedRunoutDate: string;
  suggestedReorderQty: number; // v * leadTimeDays * 1.5
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  runoutTrajectory: { day: number; projectedStock: number }[];
}

export function calculateDailyBurnVelocity(unitsSold14Days: number): number {
  return parseFloat((unitsSold14Days / 14).toFixed(3));
}

export function calculateDaysRemaining(currentStock: number, dailyVelocity: number): number {
  if (dailyVelocity <= 0) return 999;
  return Math.max(0, parseFloat((currentStock / dailyVelocity).toFixed(1)));
}

export function calculateSuggestedReorder(dailyVelocity: number, leadTimeDays = 14): number {
  // Q = v * leadTimeDays * 1.5 safety buffer
  const base = dailyVelocity * leadTimeDays * 1.5;
  return Math.max(25, Math.ceil(base / 10) * 10); // round up to nearest multiple of 10
}

export function forecastProductRunout(item: ProductInventoryState): InventoryForecastResult {
  const v = calculateDailyBurnVelocity(item.unitsSold14Days);
  const daysRemaining = calculateDaysRemaining(item.currentStock, v);

  const runoutMs = Date.now() + daysRemaining * 86400000;
  const projectedRunoutDate = new Date(runoutMs).toISOString().split('T')[0];

  const suggestedReorderQty = calculateSuggestedReorder(v, item.leadTimeDays);

  let status: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
  if (daysRemaining < 7) {
    status = 'CRITICAL';
  } else if (daysRemaining <= 14) {
    status = 'WARNING';
  }

  // Generate 30-day projection trajectory
  const runoutTrajectory: { day: number; projectedStock: number }[] = [];
  for (let d = 0; d <= 30; d += 3) {
    const projected = Math.max(0, Math.round(item.currentStock - v * d));
    runoutTrajectory.push({ day: d, projectedStock: projected });
  }

  return {
    productId: item.productId,
    variantId: item.variantId,
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
  // Default active catalog items for Bizi Bees Boutique & Sister Brands
  const items: ProductInventoryState[] = [
    {
      productId: 'bizi-001',
      variantId: 'var-001',
      title: 'Bizi Bees™ Bookish Mystery Crate (Vintage Edition)',
      sku: 'BIZI-BOX-VINTAGE',
      currentStock: 14,
      unitsSold14Days: 42, // v = 3.0 units/day -> 4.6 days remaining (CRITICAL)
      unitCost: 8.50,
      retailPrice: 24.00,
      leadTimeDays: 7,
    },
    {
      productId: 'bizi-002',
      variantId: 'var-002',
      title: 'Solid Brass Botanical Bookmark Clip (Antiqued)',
      sku: 'BIZI-ACC-BRASS',
      currentStock: 6,
      unitsSold14Days: 28, // v = 2.0 units/day -> 3.0 days remaining (CRITICAL)
      unitCost: 2.20,
      retailPrice: 14.00,
      leadTimeDays: 10,
    },
    {
      productId: 'bizi-003',
      variantId: 'var-003',
      title: 'Amber Glass Botanical Honey & Vanilla Candle (4oz)',
      sku: 'BIZI-CNDL-AMBER',
      currentStock: 32,
      unitsSold14Days: 35, // v = 2.5 units/day -> 12.8 days remaining (WARNING)
      unitCost: 4.80,
      retailPrice: 18.00,
      leadTimeDays: 12,
    },
    {
      productId: 'luma-001',
      variantId: 'var-luma1',
      title: 'LumaGlow™ QuadWave Pro 4-in-1 Facial Sculptor',
      sku: 'LUMA-GLOW-PRO',
      currentStock: 65,
      unitsSold14Days: 49, // v = 3.5 units/day -> 18.5 days remaining (HEALTHY)
      unitCost: 11.20,
      retailPrice: 39.99,
      leadTimeDays: 14,
    },
  ];

  return items.map(forecastProductRunout);
}
