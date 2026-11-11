/**
 * app/api/webhooks/shopify/route.ts — Shopify orders/paid webhook endpoint
 * Dropper OS — Phase 5
 *
 * Verifies HMAC-SHA256 signature, then routes the order via SupplyBot:
 *  - SKU DIGITAL-* -> instant vault delivery ($0 COGS, mark fulfilled + email link)
 *  - SKU DROP-* -> CJdropshipping / Zendrop API (fastest US/3PL, tracking sync every 4h, failover <20 units)
 *  - SKU UTAH-*  -> Utah Local Packing Queue
 *
 * Requires SHOPIFY_WEBHOOK_SECRET env var (set in Shopify Admin notifications).
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SupplyBot } from "@/lib/bots/05-supply-bot";

const bot = new SupplyBot();
const secret = process.env.SHOPIFY_WEBHOOK_SECRET || "";

export const runtime = "nodejs";

function verify(body: string, hmacHeader: string): boolean {
  if (!secret) return false;
  const computed = createHmac("sha256", secret).update(body).digest("base64");
  const a = Buffer.from(computed, "base64");
  const b = Buffer.from(hmacHeader, "base64");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const hmac = request.headers.get("x-shopify-hmac-sha256") || "";
  const body = await request.text();

  if (!verify(body, hmac)) {
    return NextResponse.json({ error: "invalid webhook signature" }, { status: 401 });
  }

  try {
    const order = JSON.parse(body) as any;
    const result = await bot.routeOrder(order);
    return NextResponse.json({ status: "accepted", routed: result }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
