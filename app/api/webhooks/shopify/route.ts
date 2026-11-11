import { NextResponse } from 'next/server';

export const runtime = 'edge';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const SUPPLIER_API_URL = process.env.SUPPLIER_API_ENDPOINT || 'https://api.cjdropshipping.com/order/create';

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Cryptographic HMAC-SHA256 validation (Edge runtime compliant via Web Crypto API)
async function verifyShopifyHmac(rawBody: string, hmacHeader: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return constantTimeCompare(base64Signature, hmacHeader);
  } catch (err) {
    console.error('HMAC calculation error:', err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    // 1. Mandatory HMAC SHA256 Signature Verification
    if (!secret) {
      console.error('🚨 Webhook configuration error: SHOPIFY_WEBHOOK_SECRET environment variable is missing.');
      return new Response('Unauthorized: Webhook secret not configured on server', { status: 401 });
    }

    if (!hmacHeader) {
      console.error('🚨 Webhook forgery attempt: Missing x-shopify-hmac-sha256 header.');
      return new Response('Unauthorized: Missing HMAC signature header', { status: 401 });
    }

    const isValid = await verifyShopifyHmac(rawBody, hmacHeader, secret);
    if (!isValid) {
      console.error('🚨 Webhook forgery attempt: Invalid HMAC SHA256 signature.');
      return new Response('Unauthorized Security Signature: Verification failed', { status: 401 });
    }

    const data = JSON.parse(rawBody);

    // 2. Handle Paid Order Lifecycle (Instant Auto-Fulfillment)
    if (topic === 'orders/paid' || topic === 'orders/create') {
      const orderId = data.order_number || data.id;
      const customerName = `${data.customer?.first_name || 'Customer'} ${data.customer?.last_name || ''}`.trim();
      const totalPrice = data.total_price;
      const shippingAddress = data.shipping_address;

      console.log(`💰 [NEW SALE] Order #${orderId} from ${customerName} ($${totalPrice})`);

      // Forward to Supplier API asynchronously (CJ Dropshipping / Zendrop)
      if (process.env.SUPPLIER_API_KEY) {
        try {
          await fetch(SUPPLIER_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPPLIER_API_KEY}`
            },
            body: JSON.stringify({
              order_id: orderId,
              shipping: shippingAddress,
              items: (data.line_items || []).map((i: any) => ({ sku: i.sku, quantity: i.quantity }))
            })
          });
        } catch (supErr) {
          console.error('Supplier forward error:', supErr);
        }
      }

      // Fire real-time notification to Discord Command Center
      if (DISCORD_WEBHOOK_URL) {
        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🎉 **NEW PAID ORDER #${orderId}**\n👤 **Customer:** ${customerName}\n💵 **Gross Revenue:** $${totalPrice}\n📍 **Destination:** ${shippingAddress?.city || 'US'}, ${shippingAddress?.province_code || 'UT'}\n📦 **Fulfillment:** Automated US Dispatch Triggered.`
            })
          });
        } catch (discErr) {
          console.error('Discord dispatch error:', discErr);
        }
      }
    }

    return NextResponse.json({ success: true, processed_topic: topic });
  } catch (err: any) {
    console.error(`Webhook Processing Error: ${err.message}`);
    return new Response(`Server Processing Failure: ${err.message}`, { status: 500 });
  }
}
