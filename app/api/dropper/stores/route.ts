import { NextResponse } from "next/server";
import { INITIAL_STORES } from "@/lib/stores-catalog";

export async function GET() {
  const totalRevenue24h = Number(
    INITIAL_STORES.reduce((acc, s) => acc + s.revenue24h, 0).toFixed(2)
  );
  const totalOrders24h = INITIAL_STORES.reduce(
    (acc, s) => acc + s.orders24h,
    0
  );

  return NextResponse.json({
    success: true,
    version: "2.0.0",
    totalStores: INITIAL_STORES.length,
    totalRevenue24h,
    targetRevenueDaily: 25000,
    totalOrders24h,
    targetOrdersDaily: 390,
    stores: INITIAL_STORES.map((s) => ({
      id: s.id,
      name: s.name,
      domain: s.domain,
      niche: s.niche,
      revenue24h: s.revenue24h,
      orders24h: s.orders24h,
      aov: s.aov,
      conversionRate: s.conversionRate,
      shippingHub: s.shippingHub,
    })),
  });
}
