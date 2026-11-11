import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "RepoOS™ Mission Control",
    version: "2.4 Enterprise",
    fleetSize: 13,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
