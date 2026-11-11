/**
 * Inventory Forecast & Restock Ops API Route
 * File: dropper-os/app/api/inventory/forecast/route.ts
 */

import { NextResponse } from 'next/server';
import { getFleetInventoryForecast } from '@/lib/algorithms/inventory-forecaster';
import { syncInventoryRestockIssues } from '@/lib/github/issue-ops';

export async function GET() {
  const forecasts = getFleetInventoryForecast();
  return NextResponse.json({ success: true, forecasts });
}

export async function POST() {
  try {
    const forecasts = getFleetInventoryForecast();
    const opsResults = await syncInventoryRestockIssues(forecasts);
    return NextResponse.json({
      success: true,
      auditedCount: forecasts.length,
      criticalCount: forecasts.filter(f => f.status === 'CRITICAL').length,
      opsResults,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
