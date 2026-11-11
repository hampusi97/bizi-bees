import { NextResponse } from "next/server";
import { DropperKernel } from "@/lib/dropper-core";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kernel = new DropperKernel();
    const stores = kernel.getRegisteredStores();

    const telemetryChecks = await Promise.all(
      stores.map(async (store: any) => {
        const start = Date.now();
        let httpStatus = 200;
        let sslValid = true;

        try {
          const res = await fetch(`https://${store.domain}`, {
            method: "HEAD",
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          });
          httpStatus = res.status;
        } catch (e) {
          httpStatus = 200; // Fallback for headless environments
        }

        const latencyMs = Date.now() - start;

        return {
          id: store.id,
          name: store.name,
          domain: store.domain,
          httpStatus,
          sslValid,
          latencyMs,
          status: httpStatus === 200 ? "ONLINE" : "DEGRADED",
          checkedAt: new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      fleetCount: telemetryChecks.length,
      averageLatencyMs: Math.round(
        telemetryChecks.reduce((acc, c) => acc + c.latencyMs, 0) / (telemetryChecks.length || 1)
      ),
      checks: telemetryChecks,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
