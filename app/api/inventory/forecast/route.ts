import { NextResponse } from "next/server";
import { getFleetInventoryForecast } from "@/lib/algorithms/inventory-forecaster";
import { syncInventoryRestockIssues } from "@/lib/github/issue-ops";

export async function GET() {
  const forecasts = getFleetInventoryForecast();
  return NextResponse.json({
    success: true,
    forecasts,
    criticalCount: forecasts.filter((f) => f.status === "CRITICAL").length,
  });
}

export async function POST() {
  try {
    const forecasts = getFleetInventoryForecast();
    const opsResults = await syncInventoryRestockIssues(forecasts);
    return NextResponse.json({
      success: true,
      auditedCount: forecasts.length,
      criticalCount: forecasts.filter((f) => f.status === "CRITICAL").length,
      opsResults,
      forecasts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forecast error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
