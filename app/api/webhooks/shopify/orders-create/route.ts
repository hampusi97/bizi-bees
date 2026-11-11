import { NextResponse } from 'next/server';
import { checkShopifyHmac } from '@/lib/server/api-auth';

export const runtime = 'nodejs'; // Node runtime for crypto HMAC verification

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    // 1. Shopify HMAC signature is mandatory. This used to be skipped whenever
    // the secret was unset or the header was simply omitted, which let anyone
    // POST a fake paid order and trigger the supplier forward and Discord alert.
    const hmacFailure = checkShopifyHmac(rawBody, hmacHeader);
    if (hmacFailure) {
      console.warn(`Unauthorized webhook rejected: ${hmacFailure}`);
      return new Response('Unauthorized Webhook Signature', { status: 401 });
    }

    const order = JSON.parse(rawBody);
    const orderNumber = order.order_number || order.id || 'N/A';
    const customer = order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : 'Customer';
    const totalPrice = order.total_price || '0.00';
    const currency = order.currency || 'USD';
    const lineItems = (order.line_items || [])
      .map((item: any) => `${item.quantity}x ${item.title}`)
      .join(', ');
    const destination = order.shipping_address
      ? `${order.shipping_address.city}, ${order.shipping_address.province_code || order.shipping_address.country}`
      : 'US Domestic';

    console.log(`💰 [NEW ORDER] #${orderNumber} from ${customer} &mdash; $${totalPrice} ${currency}`);

    // 2. Dispatch Live Alert to Discord Command Center
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhook) {
      const discordPayload = {
        embeds: [
          {
            title: `💰 New Order #${orderNumber} Confirmed!`,
            color: 0x0d9488, // Luma Teal
            fields: [
              { name: 'Customer', value: customer || 'Anonymous', inline: true },
              { name: 'Total', value: `$${totalPrice} ${currency}`, inline: true },
              { name: 'Destination', value: destination, inline: true },
              { name: 'Items', value: lineItems || 'N/A' }
            ],
            footer: { text: 'Automated Supplier Webhook Dispatched • Dispatches in 24h from Utah Hub' },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      }).catch(err => console.error('Discord dispatch error:', err));
    }

    // 3. Return 200 OK immediately to Shopify to confirm receipt
    return NextResponse.json({
      status: 'PROCESSED',
      order_id: order.id,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Webhook processing exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
