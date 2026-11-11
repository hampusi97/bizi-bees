/**
 * app/api/orders/route.ts — order intake for the 17 standalone stores.
 * Writes every order to orders/<store>.jsonl and returns an order id.
 */
import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = String(body.store || "unknown").replace(/[^a-z0-9-]/gi, "");
    const items = Array.isArray(body.items) ? body.items : [];
    if (!store || items.length === 0) {
      return NextResponse.json({ error: "store and items required" }, { status: 400 });
    }
    const total = items.reduce((s: number, i: any) => s + Number(i.priceUsd || 0) * Number(i.qty || 1), 0);
    const order = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      store,
      items,
      total: Math.round(total * 100) / 100,
      customer: { name: body.name || "", email: body.email || "", address: body.address || "" },
      createdAt: new Date().toISOString(),
      status: "unpaid_no_payment_processor",
    };
    const dir = join(process.cwd(), "orders");
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, `${store}.jsonl`), JSON.stringify(order) + "\n", "utf8");
    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
