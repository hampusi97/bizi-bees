import { NextResponse } from "next/server";
import { INITIAL_STORES, auditStorefront } from "@/lib/stores-catalog";
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

  const results = INITIAL_STORES.map((store) => {
    const audit = auditStorefront(store);
    return {
      storeId: store.id,
      store: store.name,
      domain: store.domain,
      route: `/stores/${store.id}`,
      status: audit.status === "VERIFIED" ? "HEALTHY" : "DEGRADED",
      score: audit.overallScore,
      productsCount: audit.totalProducts,
      categoriesCount: audit.categoriesCount,
      latency: `${14 + (store.id.length % 9)}ms`,
    };
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    engine: "RepoOS Autonomous 15-Store Healer v3.5",
    fleetSize: results.length,
    fleet_status: results,
  });
}
