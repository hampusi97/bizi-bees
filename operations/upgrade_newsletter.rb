require "net/http"
require "json"
require "uri"

u = URI("https://bizibees-store.myshopify.com/admin/api/2024-01/themes/157915938983/assets.json?asset[key]=snippets/newsletter.liquid")
r = Net::HTTP::Get.new(u)
r["X-Shopify-Access-Token"] = "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"
res = Net::HTTP.start(u.hostname, u.port, use_ssl: true) { |h| h.request(r) }

new_newsletter = %{
<section class="wrap block" style="padding: 40px 0;">
  <div class="story" style="background: radial-gradient(120% 120% at 50% 0%, #fffbeb 0%, #ffffff 100%); border: 2px solid #fde68a; border-radius: 20px; padding: 42px 36px; box-shadow: 0 10px 25px rgba(217,119,6,0.06);">
    <div>
      <div style="display:inline-flex; align-items:center; gap:6px; background:#fef3c7; border:1px solid #fcd34d; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:800; color:#92400e; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:12px;">
        🎁 VIP LAUNCH SPECIAL
      </div>
      <h2 style="font-size:clamp(28px, 4vw, 38px); font-weight:900; margin:0 0 12px; color:#111827; line-height:1.15;">
        Get 35% Off Your Order.<br><span style="color:#b45309;">Plus 100% Free US Shipping.</span>
      </h2>
      <p style="font-size:15px; color:#4b5563; line-height:1.5; margin:0 0 16px; max-width:480px;">
        Join our VIP insider circle. Unlock your instant 35% discount code, secret flash sales, and early access to fresh vintage book drops and clinical wellness tools.
      </p>
      <div style="display:flex; gap:16px; font-size:12px; font-weight:700; color:#059669; flex-wrap:wrap;">
        <span>✓ Instant Discount Code</span>
        <span>✓ Zero Spam Ever</span>
        <span>✓ Unsubscribe Anytime</span>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; justify-content:center;">
      {% form 'customer', id: 'WeeklyNewsletter' %}
        <input type="hidden" name="contact[tags]" value="newsletter,vip-launch,35-off">
        {% if form.posted_successfully? %}
          <div style="background:#ecfdf5; border:2px solid #34d399; padding:20px; border-radius:14px; text-align:center;">
            <div style="font-size:24px; margin-bottom:6px;">🎉</div>
            <h3 style="margin:0 0 6px; color:#065f46; font-size:18px; font-weight:900;">You're on the VIP List!</h3>
            <p style="margin:0 0 14px; font-size:14px; color:#047857;">Your 35% off promo code is: <strong style="font-family:monospace; font-size:18px; background:#ffffff; padding:2px 8px; border-radius:6px; border:1px dashed #059669; color:#dc2626;">PROVOTODAY</strong></p>
            <a href="/discount/PROVOTODAY?redirect=/collections/all" style="display:inline-block; background:#059669; color:#ffffff; font-weight:800; font-size:14px; padding:12px 22px; border-radius:8px; text-decoration:none;">
              Shop Now (35% Auto-Applied) →
            </a>
          </div>
        {% else %}
          {{ form.errors | default_errors }}
          <div style="display:flex; flex-direction:column; gap:10px;">
            <label for="NewsletterEmail" style="font-size:13px; font-weight:700; color:#374151; margin:0;">Enter your email address:</label>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <input id="NewsletterEmail" type="email" name="contact[email]" autocomplete="email" required placeholder="Enter your email for 35% off..." style="flex:1; min-width:220px; padding:14px 16px; border:2px solid #d1d5db; border-radius:10px; font-size:15px;">
              <button type="submit" style="background:#dc2626; color:#ffffff; font-weight:900; font-size:15px; padding:14px 26px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(220,38,38,0.3); white-space:nowrap;">
                Claim 35% Off ⚡
              </button>
            </div>
            <p style="font-size:11px; color:#9ca3af; margin:6px 0 0;">
              By signing up, you agree to receive marketing updates from Bizi Bees &amp; Luma Wellness. Unsubscribe at any time.
            </p>
          </div>
        {% endif %}
      {% endform %}
    </div>
  </div>
</section>
}

put_uri = URI("https://bizibees-store.myshopify.com/admin/api/2024-01/themes/157915938983/assets.json")
put_req = Net::HTTP::Put.new(put_uri)
put_req["X-Shopify-Access-Token"] = "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"
put_req["Content-Type"] = "application/json"
put_req.body = JSON.generate({ "asset" => { "key" => "snippets/newsletter.liquid", "value" => new_newsletter } })

put_res = Net::HTTP.start(put_uri.hostname, put_uri.port, use_ssl: true) { |h| h.request(put_req) }
puts "Upgraded newsletter snippet: HTTP #{put_res.code}"
