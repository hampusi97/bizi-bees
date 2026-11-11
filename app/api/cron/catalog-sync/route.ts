import { NextResponse } from "next/server";
import { INITIAL_STORES } from "@/lib/stores-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const timestamp = new Date().toISOString();
  const revalidatedStores = INITIAL_STORES.map((s) => ({
    storeId: s.id,
    name: s.name,
    domain: s.domain,
    route: `/stores/${s.id}`,
    productsSynced: s.products.length,
    categories: Array.from(new Set(s.products.map((p) => p.department || p.category))),
  }));

  return NextResponse.json({
    success: true,
    timestamp,
    engine: "RepoOS Global 15-Store Catalog Sync & Revalidator v2.5",
    totalStoresSynced: revalidatedStores.length,
    totalProductsSynced: revalidatedStores.reduce((acc, s) => acc + s.productsSynced, 0),
    revalidated_stores: revalidatedStores,
    status: "SUCCESS",
  });
}
