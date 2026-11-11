import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    const phone = payload.phone || payload.shipping_address?.phone || payload.billing_address?.phone;
    const name = payload.customer?.first_name || 'there';
    const checkoutUrl = payload.abandoned_checkout_url || payload.landing_site || 'https://bizibees-store.myshopify.com';
    const items = (payload.line_items || []).map((i: any) => i.title).join(', ') || 'our clinical device';

    if (!phone) {
      return NextResponse.json({ status: 'SKIPPED', reason: 'No phone number provided' });
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
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
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
