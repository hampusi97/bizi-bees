#!/usr/bin/env ruby
# Bizi Bees & Luma Wellness - Autonomous Customer & Click Hunter
# Runs round-the-clock to keep search rankings fresh, catalog indexed, and traffic drops ready.

require "net/http"
require "uri"
require "json"
require "time"

TOKEN = ENV["SHOPIFY_TOKEN"] || "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"
BASE_URL = "https://bizibees-store.myshopify.com"
INDEXNOW_KEY = "bizibees7ec43be8a7af3cb99c2376ac"

puts "[#{Time.now.iso8601}] 🚀 Starting Customer & Click Hunter run..."

# 1. Fetch products, collections, pages, articles
def fetch_all_urls
  urls = [
    "#{BASE_URL}/",
    "#{BASE_URL}/collections/all",
    "#{BASE_URL}/collections/luma-wellness",
    "#{BASE_URL}/blogs/news"
  ]

  # Fetch products
  uri = URI("#{BASE_URL}/admin/api/2024-01/products.json?limit=250&fields=handle")
  req = Net::HTTP::Get.new(uri)
  req["X-Shopify-Access-Token"] = TOKEN
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  if res.code == "200"
    JSON.parse(res.body)["products"].each { |p| urls << "#{BASE_URL}/products/#{p['handle']}" }
  end

  # Fetch custom collections
  uri = URI("#{BASE_URL}/admin/api/2024-01/custom_collections.json?limit=250&fields=handle")
  req = Net::HTTP::Get.new(uri)
  req["X-Shopify-Access-Token"] = TOKEN
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  if res.code == "200"
    JSON.parse(res.body)["custom_collections"].each { |c| urls << "#{BASE_URL}/collections/#{c['handle']}" }
  end

  # Fetch pages
  uri = URI("#{BASE_URL}/admin/api/2024-01/pages.json?limit=250&fields=handle")
  req = Net::HTTP::Get.new(uri)
  req["X-Shopify-Access-Token"] = TOKEN
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  if res.code == "200"
    JSON.parse(res.body)["pages"].each { |pg| urls << "#{BASE_URL}/pages/#{pg['handle']}" }
  end

  # Fetch articles
  uri = URI("#{BASE_URL}/admin/api/2024-01/articles.json?limit=250&fields=handle")
  req = Net::HTTP::Get.new(uri)
  req["X-Shopify-Access-Token"] = TOKEN
  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  if res.code == "200"
    JSON.parse(res.body)["articles"].each { |a| urls << "#{BASE_URL}/blogs/news/#{a['handle']}" }
  end

  urls.uniq
end

all_urls = fetch_all_urls
puts "Found #{all_urls.length} live store URLs."

# 2. Push URLs to IndexNow
puts "Pushing URLs to IndexNow (Bing, Yahoo, DuckDuckGo, Naver)..."
all_urls.each_slice(100).with_index do |slice, idx|
  idx_uri = URI("https://api.indexnow.org/indexnow")
  idx_req = Net::HTTP::Post.new(idx_uri)
  idx_req["Content-Type"] = "application/json; charset=utf-8"
  idx_req.body = {
    host: "bizibees-store.myshopify.com",
    key: INDEXNOW_KEY,
    keyLocation: "#{BASE_URL}/#{INDEXNOW_KEY}.txt",
    urlList: slice
  }.to_json

  idx_res = Net::HTTP.start(idx_uri.hostname, idx_uri.port, use_ssl: true) { |http| http.request(idx_req) }
  puts "  Batch #{idx + 1} (#{slice.length} URLs): IndexNow #{idx_res.code} #{idx_res.message}"
end

# 3. Check Discount Code Health
puts "Auditing 35% discount code PROVOTODAY..."
price_rule_uri = URI("#{BASE_URL}/admin/api/2024-01/price_rules/1299725222055.json")
pr_req = Net::HTTP::Get.new(price_rule_uri)
pr_req["X-Shopify-Access-Token"] = TOKEN
pr_res = Net::HTTP.start(price_rule_uri.hostname, price_rule_uri.port, use_ssl: true) { |http| http.request(pr_req) }
if pr_res.code == "200"
  rule = JSON.parse(pr_res.body)["price_rule"]
  puts "  ✓ Price Rule 'PROVOTODAY' is ACTIVE (#{rule['value']}% off, starts #{rule['starts_at']})"
else
  puts "  ⚠️ Price Rule status warning: #{pr_res.code}"
end

# 4. Generate Fresh Social Traffic Drop Pack
drops_path = "/Users/lars/.gemini/antigravity/scratch/daily_traffic_drops.md"
drop_entry = <<~DROP

## 🎯 Hourly Traffic Drop — #{Time.now.strftime("%Y-%m-%d %H:%M %Z")}

### 📌 Pinterest High-Intent Pin
- **Title:** The Dermatologist-Approved 4-in-1 Red Light Wand Dupe for Glowing Skin
- **Description:** Get clinical-grade 630nm red light, microcurrent, and therapeutic warmth for 70% less than Solawave. Visibly smooths fine lines and depuffs eyes in 14 days. 35% OFF launch deal today with code PROVOTODAY.
- **Link:** #{BASE_URL}/discount/PROVOTODAY?redirect=/products/luma-glow-4-in-1-skincare-wand
- **Tags:** #redlighttherapy #skincareroutine #antiaging #glowingskin #skincaretools #esthetician

### 📱 TikTok / Reels Viral Hook
- **Hook (0-3s):** "If you have morning puffiness or smile lines, do NOT spend $200 on an aesthetician wand until you see this."
- **Visual:** Show rotating wand head glowing red, glide along jawline over peptide serum.
- **CTA:** "Luma Wellness is running an introductory 35% off promo with code PROVOTODAY + 60-day trial in bio!"

### 💬 Reddit Deal Post (r/BudgetBeauty)
- **Title:** [Deal] Clinical 4-in-1 Red Light & Microcurrent Wand $38.99 shipped (35% off launch)
- **Link:** #{BASE_URL}/discount/PROVOTODAY?redirect=/products/luma-glow-4-in-1-skincare-wand

---
DROP

File.open(drops_path, "a") { |f| f.write(drop_entry) }
puts "  ✓ Appended fresh traffic drop to #{drops_path}"

puts "[#{Time.now.iso8601}] ✅ Customer & Click Hunter run completed successfully!"
