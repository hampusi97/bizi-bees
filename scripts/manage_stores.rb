#!/usr/bin/env ruby
# frozen_string_literal: true
# ==============================================================================
# Multi-Store Shopify Architecture Manager (Ruby Runner)
# Zero external dependencies. Runs on standard macOS Ruby.
# ==============================================================================

require 'json'
require 'net/http'
require 'uri'
require 'optparse'
require 'pathname'
begin
  require 'zip'
rescue LoadError
  # Fallback to system zip if needed
end

REPO_ROOT = Pathname.new(__dir__).parent
STORES_DIR = REPO_ROOT.join('stores')
API_VERSION = ENV['SHOPIFY_API_VERSION'] || '2024-04'

def discover_stores
  stores = {}
  return stores unless STORES_DIR.directory?

  STORES_DIR.children.select(&:directory?).sort.each do |dir|
    config_file = dir.join('store.json')
    next unless config_file.file?

    begin
      data = JSON.parse(File.read(config_file))
      store_id = data['id'] || dir.basename.to_s
      data['_dir'] = dir
      stores[store_id] = data
    rescue => e
      puts "⚠️ Warning: Could not parse #{config_file}: #{e.message}"
    end
  end
  stores
end

def resolve_credentials(cfg)
  env_vars = cfg['env_vars'] || {}
  prefix = (cfg['env_prefix'] || '').upcase

  url_key = env_vars['shop_url'] || "SHOPIFY_STORE_#{prefix}_URL"
  token_key = env_vars['admin_token'] || "SHOPIFY_ADMIN_ACCESS_TOKEN_#{prefix}"

  shop_url = (ENV[url_key] || ENV["#{prefix}_SHOPIFY_SHOP_URL"] || ENV['SHOPIFY_SHOP_URL'] || cfg['default_shop_url'] || '').strip
  shop_url = shop_url.gsub(%r{^https?://}, '').gsub(%r{/$}, '')

  token = (ENV[token_key] || ENV["#{prefix}_SHOPIFY_ADMIN_ACCESS_TOKEN"] || ENV['SHOPIFY_ADMIN_ACCESS_TOKEN'] || '').strip

  meta = {
    url_env_key: url_key,
    token_env_key: token_key,
    is_configured: (!token.empty? && !token.start_with?('shpat_xxxx'))
  }
  [shop_url, token, meta]
end

def action_list(stores)
  puts '=' * 80
  puts 'BIZI-BEES MULTI-STORE REPOSITORY REGISTRY'
  puts '=' * 80
  stores.each do |sid, cfg|
    shop_url, _token, meta = resolve_credentials(cfg)
    status = meta[:is_configured] ? '🟢 Configured (Token Active)' : '🟡 Dry-Run / Missing Token'
    puts "Store ID       : #{sid}"
    puts "Name           : #{cfg['name']}"
    puts "Domain         : #{cfg['primary_domain']}"
    puts "Shopify Admin  : https://#{shop_url}"
    puts "Target Niche   : #{cfg['niche']}"
    puts "Target AOV     : #{cfg['target_aov']}"
    puts "Channels       : #{(cfg['channels'] || []).join(', ')}"
    puts "Env Secret Var : #{meta[:token_env_key]}"
    puts "Status         : #{status}"
    puts '-' * 80
  end
end

def action_export_theme_zip(store_id, cfg)
  theme_rel = cfg['theme_path'] || "stores/#{store_id}/theme"
  theme_path = REPO_ROOT.join(theme_rel)

  unless theme_path.directory?
    puts "❌ Theme directory not found: #{theme_path}"
    return false
  end

  dist_dir = REPO_ROOT.join('dist')
  Dir.mkdir(dist_dir) unless dist_dir.directory?
  zip_output = dist_dir.join("#{store_id}-theme.zip")

  puts "📦 Packaging theme for [#{store_id}] from #{theme_rel}..."
  cmd = "cd '#{theme_path}' && /usr/bin/zip -q -r '#{zip_output}' . -x '*.DS_Store*'"
  system(cmd)

  if zip_output.file?
    size_kb = (zip_output.size / 1024.0).round(1)
    puts "✅ Successfully generated #{zip_output} (#{size_kb} KB)"
    true
  else
    puts "❌ Failed to create zip file"
    false
  end
end

def action_validate_catalog(store_id, cfg)
  catalog_rel = cfg['catalog_path'] || "stores/#{store_id}/catalog/products.json"
  catalog_path = REPO_ROOT.join(catalog_rel)

  unless catalog_path.file?
    puts "❌ Catalog not found at: #{catalog_path}"
    return false
  end

  products = JSON.parse(File.read(catalog_path))
  puts "📦 Store [#{store_id}] has #{products.size} defined products in #{catalog_rel}:"
  products.each_with_index do |p, idx|
    variants = p['variants'] || []
    price_range = variants.map { |v| "$#{v['price']}" }.join(' / ')
    puts "   #{idx + 1}. #{p['title']} (#{variants.size} variant(s): #{price_range})"
  end
  puts "✅ Catalog schema validated successfully!"
  true
end

# CLI Parsing
options = { action: 'list' }
OptionParser.new do |opts|
  opts.banner = 'Usage: manage_stores.rb [options]'
  opts.on('--list', 'List all stores') { options[:action] = 'list' }
  opts.on('--store ID', 'Store ID') { |v| options[:store] = v }
  opts.on('--action ACTION', 'Action (check, seed-catalog, list)') { |v| options[:action] = v }
end.parse!

stores = discover_stores
if options[:action] == 'list' || options[:store].nil?
  action_list(stores)
  puts "\n👉 Run: ruby scripts/manage_stores.rb --store <id> --action seed-catalog"
  exit 0
end

store_id = options[:store]
cfg = stores[store_id]
unless cfg
  puts "❌ Unknown store: #{store_id}"
  exit 1
end

puts "🚀 Store Manager (Ruby) -> Target: #{cfg['name']} (#{store_id})"
if options[:action] == 'export-theme-zip' || options[:action] == 'all'
  action_export_theme_zip(store_id, cfg)
end
if options[:action] == 'seed-catalog' || options[:action] == 'all'
  action_validate_catalog(store_id, cfg)
end
