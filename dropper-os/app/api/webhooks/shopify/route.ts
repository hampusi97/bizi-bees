import { NextResponse } from "next/server";
import { verifyShopifyHmac } from "@/lib/shopify-hmac";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    // 1. Mandatory HMAC SHA256 Signature Verification using process.env.SHOPIFY_WEBHOOK_SECRET
    if (!secret) {
      console.error("🚨 Webhook configuration error: SHOPIFY_WEBHOOK_SECRET environment variable is missing.");
      return NextResponse.json(
        { error: "Unauthorized: Webhook secret not configured on server" },
        { status: 401 }
      );
    }

    if (!hmacHeader) {
      console.error("🚨 Webhook security alert: Missing x-shopify-hmac-sha256 header.");
      return NextResponse.json(
        { error: "Unauthorized: Missing HMAC signature header" },
        { status: 401 }
      );
    }

    const isValid = verifyShopifyHmac(rawBody, hmacHeader, secret);
    if (!isValid) {
      console.error("🚨 Webhook forgery attempt: Invalid HMAC SHA256 signature.");
      return NextResponse.json(
        { error: "Unauthorized Security Signature: Verification failed" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody || "{}");
    const orderNumber = payload.order_number || payload.id || "SAMPLE";
    const totalPrice = payload.total_price || "0.00";
    const currency = payload.currency || "USD";

    console.log(`[DropperOS Webhook] Verified Order #${orderNumber} received: ${currency} ${totalPrice}`);

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
