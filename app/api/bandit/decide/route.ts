import { NextRequest, NextResponse } from "next/server";
import { banditEngine } from "@/lib/algorithms/multi-armed-bandit";
import { sseEventBus } from "@/lib/telemetry/sse-event-bus";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experimentId =
    searchParams.get("experiment") || "free-shipping-threshold";

  try {
    const decision = banditEngine.selectVariant(experimentId);
    const experiments = banditEngine.getAllExperiments();

    sseEventBus.broadcast("bandit", "variant_served", {
      experimentId,
      variantId: decision.selectedVariantId,
      isExploration: decision.isExploration,
      conversionRate: decision.conversionRate,
    });

    return NextResponse.json(
      { success: true, decision, experiments },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bandit error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 404, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { experimentId, variantId } = body;

    if (!experimentId || !variantId) {
      return NextResponse.json(
        { success: false, error: "Missing experimentId or variantId" },
        { status: 400 }
      );
    }

    const recorded = banditEngine.recordConversion(experimentId, variantId);

    if (recorded) {
      sseEventBus.broadcast("bandit", "conversion_recorded", {
        experimentId,
        variantId,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      {
        success: recorded,
        experiments: banditEngine.getAllExperiments(),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Bandit POST error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
