import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (secret && hmacHeader) {
      const generatedHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("base64");

      if (generatedHash !== hmacHeader) {
        return NextResponse.json({ error: "Unauthorized webhook signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const orderNumber = payload.order_number || payload.id || "SAMPLE";
    const totalPrice = payload.total_price || "0.00";
    const currency = payload.currency || "USD";

    console.log(`[DropperOS Webhook] Order #${orderNumber} received: ${currency} ${totalPrice}`);

    return NextResponse.json({
      success: true,
      processed: true,
      order: {
        id: orderNumber,
        total: totalPrice,
        currency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
