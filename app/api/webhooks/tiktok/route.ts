import { NextResponse } from "next/server";
import crypto from "crypto";
import { timingSafeEqualStrings } from "@/lib/server/api-auth";

export const dynamic = "force-dynamic";

/**
 * Validates TikTok Shop webhook signature.
 */
function verifyTikTokSignature(
  rawBody: string,
  signature: string | null,
  secret: string | undefined = process.env.TIKTOK_SHOP_WEBHOOK_SECRET
): boolean {
  // Fail closed. An unset secret used to mean "accept everything", which turned
  // this endpoint into an open door in any environment missing the variable.
  if (!secret) {
    console.error("TIKTOK_SHOP_WEBHOOK_SECRET is not configured; rejecting webhook.");
    return false;
  }
  if (!signature) return false;

  try {
    const generated = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    return timingSafeEqualStrings(generated, signature);
  } catch (err) {
    console.error("TikTok HMAC verification error:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("tiktok-shop-signature") || req.headers.get("x-tts-signature");
    const eventType = req.headers.get("x-tts-event-type") || "ORDER_STATUS_CHANGE";

    const isAuthentic = verifyTikTokSignature(rawBody, signature);
    if (!isAuthentic) {
      console.warn("⚠️ Unauthorized TikTok Shop webhook signature failure.");
      return new Response("Unauthorized signature", { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const timestamp = new Date().toISOString();
    console.log(`🎵 [TIKTOK SHOP WEBHOOK] Received event: ${eventType} at ${timestamp}`);

    // Handle Event Types
    switch (eventType) {
      case "ORDER_STATUS_CHANGE": {
        const orderId = payload.data?.order_id || payload.order_id || `TTS-${Date.now()}`;
        const orderStatus = payload.data?.order_status || "AWAITING_SHIPMENT";
        const lineItems = payload.data?.order_line_list || [];

        console.log(`📦 [TIKTOK ORDER] Order ${orderId} status: ${orderStatus} with ${lineItems.length} items`);
        // Simulated or live Shopify inventory deduction loop
        return NextResponse.json({
          success: true,
          event: "ORDER_STATUS_CHANGE",
          orderId,
          orderStatus,
          action: "INVENTORY_ALLOCATED_SHOPIFY",
          dispatchHub: "Salt Lake City, Utah (24h SLA)",
          timestamp,
        });
      }

      case "PRODUCT_STATUS_CHANGE": {
        const productId = payload.data?.product_id || payload.product_id;
        const auditStatus = payload.data?.status || "AUDIT_APPROVED";
        console.log(`🏷️ [TIKTOK PRODUCT AUDIT] Product ${productId} is now ${auditStatus}`);
        return NextResponse.json({
          success: true,
          event: "PRODUCT_STATUS_CHANGE",
          productId,
          auditStatus,
          timestamp,
        });
      }

      default: {
        return NextResponse.json({
          success: true,
          event: eventType,
          message: "Acknowledged TikTok Shop webhook event",
          timestamp,
        });
      }
    }
  } catch (error: any) {
    console.error("Error processing TikTok Shop webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
