/**
 * app/api/checkout/route.ts — Stripe Checkout for the 17 standalone stores.
 *
 * POST { store, items:[{sku,title,priceUsd,qty}], name, email, address }
 *   -> { ok, mode:"stripe", url }        when STRIPE_SECRET_KEY is set
 *   -> { ok, mode:"local", order }       when it is not (order still recorded)
 *
 * Also: GET -> { configured:boolean, store } so a page can show the right button.
 */
import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

type Item = { sku: string; title: string; priceUsd: number; qty: number };

function record(store: string, order: Record<string, unknown>) {
  const dir = join(process.cwd(), "orders");
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, `${store}.jsonl`), JSON.stringify(order) + "\n", "utf8");
}

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store") || "";
  return NextResponse.json({
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
    store,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const store = String(body.store || "").replace(/[^a-z0-9-]/gi, "");
  const items = (Array.isArray(body.items) ? body.items : []) as Item[];
  if (!store || items.length === 0) {
    return NextResponse.json({ error: "store and items required" }, { status: 400 });
  }

  const total =
    Math.round(items.reduce((s, i) => s + Number(i.priceUsd || 0) * Number(i.qty || 1), 0) * 100) / 100;
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const customer = {
    name: String(body.name || ""),
    email: String(body.email || ""),
    address: String(body.address || ""),
  };

  const order = {
    id: orderId,
    store,
    items,
    total,
    customer,
    createdAt: new Date().toISOString(),
    status: "pending_payment",
  };

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    record(store, { ...order, status: "paid_pending_fulfillment", mode: "local" });
    return NextResponse.json({
      ok: true,
      mode: "local",
      order: { ...order, status: "paid_pending_fulfillment" },
    });
  }

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key);
    const origin =
      process.env.PUBLIC_ORIGIN || req.headers.get("origin") || `http://${req.headers.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email || undefined,
      client_reference_id: orderId,
      metadata: { store, orderId },
      line_items: items.map((i) => ({
        quantity: Number(i.qty || 1),
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(i.priceUsd || 0) * 100),
          product_data: { name: String(i.title || i.sku), metadata: { sku: String(i.sku) } },
        },
      })),
      success_url: `${origin}/stores/${store}/?paid=${orderId}`,
      cancel_url: `${origin}/stores/${store}/?cancelled=1`,
    });

    record(store, { ...order, status: "checkout_created", sessionId: session.id });
    return NextResponse.json({ ok: true, mode: "stripe", url: session.url, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
