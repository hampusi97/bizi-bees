#!/usr/bin/env ruby
# ==============================================================================
# Bizi Bees & Luma Wellness — Programmatic Shopify Admin API Catalog Updater
# ==============================================================================
# Usage: SHOPIFY_TOKEN=shpat_xxx ruby push_to_shopify_api.rb
# Or:    ruby push_to_shopify_api.rb <SHPAT_TOKEN>
# ==============================================================================

require "net/http"
require "uri"
require "json"
require "csv"
require "time"

TOKEN = ARGV[0] || ENV["SHOPIFY_TOKEN"]
STORE = "bizibees-store.myshopify.com"
API_VER = "2024-01"
BASE_URL = "https://#{STORE}/admin/api/#{API_VER}"

if TOKEN.nil? || TOKEN.empty?
  puts "Usage: SHOPIFY_TOKEN=shpat_xxx ruby push_to_shopify_api.rb"
  puts "Error: Missing Shopify Admin Access Token."
  exit 1
end

# Verify token
uri = URI("#{BASE_URL}/shop.json")
req = Net::HTTP::Get.new(uri)
req["X-Shopify-Access-Token"] = TOKEN
res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }

if res.code != "200"
  puts "❌ Authentication failed (HTTP #{res.code}): #{res.body}"
  exit 1
end

shop_name = JSON.parse(res.body).dig("shop", "name")
puts "✅ Successfully authenticated with: #{shop_name} (#{STORE})"

csv_path = "/Users/lars/Documents/GitHub/bizi-bees/content/shopify_catalog_sanitized_import.csv"
unless File.exist?(csv_path)
  puts "❌ CSV file not found: #{csv_path}"
  exit 1
end

puts "Reading sanitized catalog from #{csv_path}..."
rows = CSV.read(csv_path, headers: true)
puts "Loaded #{rows.length} product rows. Beginning API update..."

# Group by handle
grouped = rows.group_by { |r| r["Handle"] }
puts "Found #{grouped.length} unique products to update."

grouped.each_with_index do |(handle, prows), idx|
  first_row = prows.first
  puts "[#{idx + 1}/#{grouped.length}] Updating #{handle}..."

  # Find product by handle
  s_uri = URI("#{BASE_URL}/products.json?handle=#{handle}")
  s_req = Net::HTTP::Get.new(s_uri)
  s_req["X-Shopify-Access-Token"] = TOKEN
  s_res = Net::HTTP.start(s_uri.hostname, s_uri.port, use_ssl: true) { |h| h.request(s_req) }
  
  if s_res.code != "200"
    puts "  ⚠️ Failed to fetch #{handle}: #{s_res.code}"
    next
  end

  prods = JSON.parse(s_res.body)["products"]
  if prods.empty?
    puts "  ⚠️ Product not found in store for handle: #{handle}"
    next
  end

  prod = prods.first
  pid = prod["id"]

  # Payload
  update_payload = {
    product: {
      id: pid,
      body_html: first_row["Body (HTML)"],
      tags: first_row["Tags"],
      vendor: first_row["Vendor"],
      product_type: first_row["Custom Product Type"]
    }
  }

  u_uri = URI("#{BASE_URL}/products/#{pid}.json")
  u_req = Net::HTTP::Put.new(u_uri)
  u_req["X-Shopify-Access-Token"] = TOKEN
  u_req["Content-Type"] = "application/json"
  u_req.body = JSON.generate(update_payload)

  u_res = Net::HTTP.start(u_uri.hostname, u_uri.port, use_ssl: true) { |h| h.request(u_req) }
  if u_res.code == "200"
    puts "  ✓ Updated product #{pid} (#{handle})"
  else
    puts "  ❌ Failed to update product #{pid}: #{u_res.code} - #{u_res.body[0..150]}"
  end

  # Rate limit safety
  sleep 0.5
end

puts "\n🎉 All #{grouped.length} products updated successfully via Shopify Admin API!"
