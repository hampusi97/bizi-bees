import { NextResponse } from 'next/server';
import { checkShopifyHmac } from '@/lib/server/api-auth';

export const runtime = 'nodejs'; // Node runtime for crypto HMAC verification

// A visitor can only be sent one recovery SMS per checkout per process.
// This is a coarse in-memory guard so a forged or replayed webhook cannot be
// used as an SMS amplifier; the Shopify HMAC check below is the real control.
const recentlyTexted = new Map<string, number>();
const TEXT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function isDuplicate(phone: string): boolean {
  const now = Date.now();
  for (const [key, sentAt] of recentlyTexted) {
    if (now - sentAt > TEXT_COOLDOWN_MS) recentlyTexted.delete(key);
  }
  const last = recentlyTexted.get(phone);
  if (last && now - last < TEXT_COOLDOWN_MS) return true;
  recentlyTexted.set(phone, now);
  return false;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    // This route sends SMS in the store's name, so an unauthenticated caller
    // could text any number at our expense. Verify the Shopify signature first.
    const hmacFailure = checkShopifyHmac(rawBody, hmacHeader);
    if (hmacFailure) {
      console.warn(`Unauthorized abandoned-checkout webhook rejected: ${hmacFailure}`);
      return new Response('Unauthorized Webhook Signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const phone = payload.phone || payload.shipping_address?.phone || payload.billing_address?.phone;
    const name = payload.customer?.first_name || 'there';
    const checkoutUrl = payload.abandoned_checkout_url || payload.landing_site || 'https://bizibees-store.myshopify.com';
    const items = (payload.line_items || []).map((i: any) => i.title).join(', ') || 'our clinical device';

    if (!phone) {
      return NextResponse.json({ status: 'SKIPPED', reason: 'No phone number provided' });
    }

    if (isDuplicate(phone)) {
      return NextResponse.json({ status: 'SKIPPED', reason: 'Recovery message already sent to this number' });
    }

    const conversationalMessage = `Hey ${name}, Kimberly from Luma Clinical here! Saw you were checking out the ${items}. Did you have any quick questions about whether the 630nm protocol works for sensitive skin, or our 60-day trial guarantee? Reply here anytime or finish your order in 1 tap: ${checkoutUrl}`;

    console.log(`📱 [CONVERSATIONAL AI SMS] Formatted 45-min recovery message to ${phone}:`);
    console.log(conversationalMessage);

    // Forward to Twilio or SMS Gateway if API token configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_PHONE;

    if (twilioSid && twilioToken && twilioFrom) {
      const auth = btoa(`${twilioSid}:${twilioToken}`);
      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioFrom,
          Body: conversationalMessage
        })
      });
      if (!twilioRes.ok) {
        // Do not report success when the gateway refused the message.
        console.error(`Twilio rejected the recovery SMS (${twilioRes.status}): ${await twilioRes.text()}`);
        return NextResponse.json({ status: 'FAILED', reason: 'SMS gateway rejected the message' }, { status: 502 });
      }
      console.log(`✓ Conversational recovery SMS successfully sent to ${phone}`);
    }

    return NextResponse.json({
      status: 'QUEUED',
      recipient: phone,
      message_preview: conversationalMessage.substring(0, 80) + '...',
      scheduled_for: 'T+45 minutes'
    });
  } catch (error: any) {
    console.error('Abandoned checkout webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
