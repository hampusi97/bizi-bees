import { NextResponse } from "next/server";
import { INITIAL_STORES, auditEntireFleet } from "@/lib/stores-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const audit = auditEntireFleet();
  return NextResponse.json({
    status: "ok",
    service: "RepoOS™ Mission Control",
    version: "2.5 AI Studio",
    fleetSize: INITIAL_STORES.length,
    totalProducts: audit.totalProducts,
    averageAuditScore: audit.averageScore,
    allStoresHealthy: audit.allVerified,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
