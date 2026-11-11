import { NextResponse } from "next/server";
import { INITIAL_STORES } from "@/lib/stores-catalog";
import { checkBearerSecret } from "@/lib/server/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Fail closed: the previous check only rejected a *wrong* header, so a request
  // with no Authorization header at all ran the job. Vercel Cron must now send
  // "Authorization: Bearer $CRON_SECRET".
  const authFailure = checkBearerSecret(request.headers.get("authorization"), "CRON_SECRET");
  if (authFailure) {
    console.warn(`Cron rejected: ${authFailure}`);
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
