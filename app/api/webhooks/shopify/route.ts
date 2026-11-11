import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const SUPPLIER_API_URL = process.env.SUPPLIER_API_ENDPOINT || 'https://api.cjdropshipping.com/order/create';

/**
 * Constant-time comparison preventing timing side-channel attacks.
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Cryptographic HMAC-SHA256 signature verification for Shopify webhooks.
 * Uses process.env.SHOPIFY_WEBHOOK_SECRET to ensure only authentic Shopify webhook calls are processed.
 */
function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null | undefined,
  secret: string | undefined = process.env.SHOPIFY_WEBHOOK_SECRET
): boolean {
  if (!secret || !hmacHeader || !rawBody) {
    return false;
  }
  try {
    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    return timingSafeCompare(generatedHash, hmacHeader);
  } catch (err) {
    console.error('HMAC verification error:', err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic') || 'orders/create';
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

    // 1. Mandatory HMAC SHA256 Signature Verification using process.env.SHOPIFY_WEBHOOK_SECRET
    if (!secret) {
      console.error('🚨 Webhook configuration error: SHOPIFY_WEBHOOK_SECRET environment variable is missing.');
      return new Response('Unauthorized: Webhook secret not configured on server', { status: 401 });
    }

    if (!hmacHeader) {
      console.error('🚨 Webhook forgery attempt: Missing x-shopify-hmac-sha256 header.');
      return new Response('Unauthorized: Missing HMAC signature header', { status: 401 });
    }

    const isValid = verifyShopifyWebhook(rawBody, hmacHeader, secret);
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
