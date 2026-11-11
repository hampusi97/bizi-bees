import { NextResponse } from "next/server";
import { DropperKernel } from "@/lib/dropper-core";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const kernel = new DropperKernel();
    const telemetry = await kernel.getFleetTelemetry();
    return NextResponse.json({ success: true, telemetry });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a production setup, this updates stores.config.json or database
    return NextResponse.json({
      success: true,
      message: `Store ${body.name || body.id} registered into Dropper OS fleet`,
      store: body,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
