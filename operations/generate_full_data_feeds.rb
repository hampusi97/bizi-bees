#!/usr/bin/env ruby
# ==============================================================================
# Bizi Bees & Luma Wellness — Full 315-Product & 55-Collection Data Engine
# ==============================================================================
# 1. Harvests all 315 live products (multi-page) + 55 live collections.
# 2. Generates the exact 40-column Google Merchant Center TSV & CSV matching
#    the uploaded Google Merchant Excel template (`media_1793654408470_418463b2.xlsx`).
# 3. Generates `google-shopping-feed.xml` (RSS 2.0 g: namespace) for scheduled fetch.
# 4. Generates `operations/full_store_data_intelligence.json` with complete catalog analytics.
# ==============================================================================

require "net/http"
require "uri"
require "json"
require "csv"
require "time"
require "fileutils"

BASE_URL = "https://bizibees-store.myshopify.com"
REPO_DIR = "/Users/lars/Documents/GitHub/bizi-bees"
FALLBACK_IMG = "https://cdn.shopify.com/s/files/1/0778/2465/5527/files/photo-1570172619644-dfd03ed5d881.jpg?v=1793651117"

all_products = []
(1..5).each do |page|
  res = Net::HTTP.get_response(URI("#{BASE_URL}/products.json?limit=250&page=#{page}"))
  break unless res.code == "200"
  batch = JSON.parse(res.body)["products"]
  break if batch.nil? || batch.empty?
  all_products.concat(batch)
end

all_collections = []
col_res = Net::HTTP.get_response(URI("#{BASE_URL}/collections.json?limit=250"))
if col_res.code == "200"
  all_collections = JSON.parse(col_res.body)["collections"] || []
end

puts "Fetched #{all_products.length} total live products and #{all_collections.length} live collections."

# Exact 40 headers from media_1793654408470_418463b2.xlsx Row 1
HEADERS = [
  "id", "title", "description", "availability", "availability_date", "expiration_date",
  "link", "mobile_link", "image_link", "price", "sale_price", "sale_price_effective_date",
  "identifier_exists", "gtin", "mpn", "brand", "product_highlight", "product_detail",
  "additional_image_link", "condition", "adult", "color", "size", "size_type", "size_system",
  "gender", "material", "pattern", "age_group", "multipack", "is bundle",
  "unit_pricing_measure", "unit_pricing_base_measure", "energy_efficiency_class",
  "min_energy_efficiency_class", "max_energy_efficiency", "item_group_id",
  "video_link", "virtual_model_link", "cost_of_goods_sold"
]

tsv_path = File.join(REPO_DIR, "content", "google_merchant_center_exact_feed.tsv")
csv_path = File.join(REPO_DIR, "content", "google_merchant_center_exact_feed.csv")
xml_path = File.join(REPO_DIR, "google-shopping-feed.xml")
intel_path = File.join(REPO_DIR, "operations", "full_store_data_intelligence.json")

xml_items = []
sale_window = "2026-11-01T00:00:00-07:00/2026-12-31T23:59:59-07:00"

CSV.open(tsv_path, "w", col_sep: "\t") do |tsv|
  CSV.open(csv_path, "w") do |csv|
    tsv << HEADERS
    csv << HEADERS

    all_products.each do |p|
      variant = p["variants"]&.first || {}
      sku = variant["sku"].to_s.strip
      sku = "BIZIBEES-#{p['id']}" if sku.empty?

      raw_title = p["title"].to_s.strip[0..149]
      clean_desc = p["body_html"].to_s.gsub(/<[^>]+>/, " ").gsub(/\s+/, " ").strip
      if clean_desc.length < 40
        clean_desc = "#{raw_title} by #{p['vendor']}. Curated quality from Bizi Bees & Luma Wellness with fast, free US shipping from Provo, Utah and 35% off with code PROVOTODAY."
      end
      short_desc = clean_desc[0..4900]

      avail = variant["available"] ? "in_stock" : "out_of_stock"
      prod_link = "#{BASE_URL}/products/#{p['handle']}"
      img_link = p.dig("images", 0, "src") || FALLBACK_IMG
      add_imgs = (p["images"] || [])[1..5].to_a.map { |i| i["src"] }.join(",")

      base_price_num = variant["price"].to_f
      compare_num = variant["compare_at_price"].to_f
      if compare_num > base_price_num
        price_str = sprintf("%.2f USD", compare_num)
        sale_price_str = sprintf("%.2f USD", base_price_num)
        eff_date = sale_window
      else
        price_str = sprintf("%.2f USD", base_price_num)
        sale_price_str = sprintf("%.2f USD", (base_price_num * 0.65).round(2))
        eff_date = sale_window
      end

      brand = p["vendor"].to_s.strip
      brand = "Bizi Bees" if brand.empty?
      ptype = p["product_type"].to_s.downcase
      is_apparel = ptype.include?("shirt") || ptype.include?("pants") || ptype.include?("tops") || ptype.include?("clothing")
      is_toy = ptype.include?("toy") || ptype.include?("game") || ptype.include?("baby") || ptype.include?("plush")

      age_group = is_toy ? "children" : "adult"
      gender = "unisex"
      color = is_apparel ? "Multi" : ""
      size = is_apparel ? (variant["title"] != "Default Title" ? variant["title"].to_s : "Standard") : ""
      multipack = raw_title.downcase.include?("2-pack") || raw_title.downcase.include?("2-cap") ? "2" : ""
      is_bundle = raw_title.downcase.include?("bundle") || raw_title.downcase.include?("set") ? "yes" : "no"

      row = [
        sku,
        raw_title,
        short_desc,
        avail,
        "",
        "",
        prod_link,
        prod_link,
        img_link,
        price_str,
        sale_price_str,
        eff_date,
        "no",
        "",
        sku,
        brand,
        "Free US Shipping from Utah, 35% Off with Code PROVOTODAY, 60-Day Satisfaction Guarantee",
        "Category:#{p['product_type'].to_s.empty? ? 'General' : p['product_type']}",
        add_imgs,
        "new",
        "no",
        color,
        size,
        "",
        "US",
        gender,
        "",
        "",
        age_group,
        multipack,
        is_bundle,
        "", "", "", "", "",
        p["id"].to_s,
        "", "", ""
      ]

      tsv << row
      csv << row

      xml_items << <<~ITEM
        <item>
          <g:id><![CDATA[#{sku}]]></g:id>
          <g:title><![CDATA[#{raw_title}]]></g:title>
          <g:description><![CDATA[#{short_desc[0..900]}]]></g:description>
          <g:link>#{prod_link}</g:link>
          <g:image_link>#{img_link}</g:image_link>
          <g:availability>#{avail}</g:availability>
          <g:price>#{price_str}</g:price>
          <g:sale_price>#{sale_price_str}</g:sale_price>
          <g:brand><![CDATA[#{brand}]]></g:brand>
          <g:condition>new</g:condition>
          <g:identifier_exists>no</g:identifier_exists>
          <g:shipping>
            <g:country>US</g:country>
            <g:service>Free Standard Shipping</g:service>
            <g:price>0.00 USD</g:price>
          </g:shipping>
        </item>
      ITEM
    end
  end
end

xml_feed = <<~XML
  <?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
    <channel>
      <title>Bizi Bees &amp; Luma Wellness — Complete 315-Product Google Merchant Feed</title>
      <link>#{BASE_URL}</link>
      <description>Official Google Shopping Product Feed for Bizi Bees &amp; Luma Wellness (Provo, Utah). Free US Shipping on all orders.</description>
      #{xml_items.join("\n")}
    </channel>
  </rss>
XML
File.write(xml_path, xml_feed)

# Build Full Store Data Intelligence JSON
intel = {
  generated_at: Time.now.iso8601,
  store_domain: BASE_URL,
  totals: {
    total_products: all_products.length,
    in_stock_products: all_products.count { |p| p["variants"].any? { |v| v["available"] } },
    out_of_stock_products: all_products.count { |p| p["variants"].none? { |v| v["available"] } },
    total_collections: all_collections.length,
    non_empty_collections: all_collections.count { |c| c["products_count"].to_i > 0 }
  },
  top_vendors: all_products.group_by { |p| p["vendor"] }.transform_values(&:count).sort_by { |_, v| -v }.to_h,
  top_collections: all_collections.select { |c| c["products_count"].to_i > 0 }
                                  .sort_by { |c| -c["products_count"].to_i }
                                  .map { |c| { title: c["title"], handle: c["handle"], url: "#{BASE_URL}/collections/#{c['handle']}", products_count: c["products_count"] } },
  flagship_luma_wellness: all_products.select { |p| p["vendor"] == "Luma Wellness" }.map { |p|
    v = p["variants"].first
    {
      id: p["id"],
      title: p["title"],
      handle: p["handle"],
      url: "#{BASE_URL}/products/#{p['handle']}",
      retail_price: v["price"].to_f,
      compare_at_price: v["compare_at_price"].to_f,
      provotoday_35_off_price: (v["price"].to_f * 0.65).round(2),
      image: p.dig("images", 0, "src") || FALLBACK_IMG
    }
  }
}
File.write(intel_path, JSON.pretty_generate(intel))

puts "✓ Generated 40-column Google Merchant TSV (#{all_products.length} rows): #{tsv_path}"
puts "✓ Generated 40-column Google Merchant CSV (#{all_products.length} rows): #{csv_path}"
puts "✓ Generated Google Shopping RSS 2.0 XML (#{all_products.length} items): #{xml_path}"
puts "✓ Generated Full Store Data Intelligence JSON: #{intel_path}"
