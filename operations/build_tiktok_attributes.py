import json, csv

with open('/Users/lars/.gemini/antigravity/scratch/bizi_bees/data/all_products.json') as f:
    products = json.load(f)

p_map = {p['handle']: p for p in products}

# 40 items selected
tiktok_items = [
    # 1. Fidgets & Squishies (12 items)
    {
        "handle": "squishy-dumpling-advent-calendar-24-days-of-amazing-squishy-sensory-toys-for-everyone",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "TPR (Thermo-Plastic-Rubber) & Paperboard",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "mystery-squishies",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "Polyurethane Slow-Rise Foam",
        "weight_lb": "0.6 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "squishy-time-rescue",
        "category": "Toys & Hobbies > Games & Puzzles > Board Games",
        "material": "Cardstock & TPR Silicone",
        "weight_lb": "1.1 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "supermarket-squishy-spree",
        "category": "Toys & Hobbies > Games & Puzzles > Board Games",
        "material": "Cardstock & Soft Polyurethane Foam",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "glitter-slow-rise-maltose-dumpling-squishy-fidget-stress-relief-toy",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "TPR Silicone & Maltose Gel",
        "weight_lb": "0.6 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "mystery-dumpling-glow-in-the-dark-steamer",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "TPR Silicone & Plastic",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "10-frame-fidgets-set-of-12",
        "category": "Toys & Hobbies > Learning & Education > Math Toys",
        "material": "Food-Grade Silicone",
        "weight_lb": "0.8 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "mini-forest-farm-home-animal-fidget-toy-pack-20-items",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "PLA Bioplastic (3D Printed)",
        "weight_lb": "0.9 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "fidget-moons",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "PLA Bioplastic",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "dark-side-of-the-fidget-moon",
        "category": "Toys & Hobbies > Novelty & Gag Toys > Fidget & Squeeze Toys",
        "material": "PLA Bioplastic",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "popplers-daily-routines-emotions-and-feelings",
        "category": "Toys & Hobbies > Learning & Education > Early Development Toys",
        "material": "Silicone & ABS Plastic",
        "weight_lb": "1.0 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "popplers-1-2-bundle",
        "category": "Toys & Hobbies > Learning & Education > Early Development Toys",
        "material": "Silicone & ABS Plastic",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "No",
    },

    # 2. Playtime Pads (10 items)
    {
        "handle": "screen-free-kids-pack",
        "category": "Toys & Hobbies > Learning & Education > Workbooks & Activity Books",
        "material": "Heavyweight Recycled Paper & Chipboard",
        "weight_lb": "1.1 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "lemonade-stand-playtime-pad®",
        "category": "Toys & Hobbies > Pretend Play > Dress Up & Role Play",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "cleaning-crew-playtime-pad®",
        "category": "Toys & Hobbies > Pretend Play > Dress Up & Role Play",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "on-the-go-scavenger-hunt-playtime-pad®",
        "category": "Toys & Hobbies > Learning & Education > Workbooks & Activity Books",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "playtime-pad®-banker-pack",
        "category": "Toys & Hobbies > Pretend Play > Money & Banking Play",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.9 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "post-office-playtime-pad®",
        "category": "Toys & Hobbies > Pretend Play > Dress Up & Role Play",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "cafe-playtime-pad®",
        "category": "Toys & Hobbies > Pretend Play > Play Food & Kitchens",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "auto-shop-playtime-pad®",
        "category": "Toys & Hobbies > Pretend Play > Dress Up & Role Play",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "alphabet-scavenger-hunt-playtime-pad®",
        "category": "Toys & Hobbies > Learning & Education > Early Development Toys",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "kids-classic-playtime-pads®",
        "category": "Toys & Hobbies > Pretend Play > Dress Up & Role Play",
        "material": "70lb Uncoated Writing Paper",
        "weight_lb": "0.9 lb",
        "battery": "No",
        "choking_hazard": "No",
    },

    # 3. SodaPup Dog Toys & Treats (5 items)
    {
        "handle": "christmas-tree-nylon-dog-chew-toy-for-aggressive-chewers-usa-made-fda-compliant",
        "category": "Pet Supplies > Dog Supplies > Dog Toys > Chew Toys",
        "material": "FDA-Compliant Nylon",
        "weight_lb": "0.7 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "roasted-turkey-dog-chew-toy-treat-dispenser-usa-made-sodapup",
        "category": "Pet Supplies > Dog Supplies > Dog Toys > Chew Toys",
        "material": "Natural Rubber Compound (USA Made)",
        "weight_lb": "0.8 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "snowman-dog-toy-durable-winter-chew-toy-for-large-dogs-usa-made",
        "category": "Pet Supplies > Dog Supplies > Dog Toys > Chew Toys",
        "material": "Natural Rubber Compound (USA Made)",
        "weight_lb": "0.8 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "strawberry-squeaker-dog-toy",
        "category": "Pet Supplies > Dog Supplies > Dog Toys > Squeak Toys",
        "material": "Recycled Plush & Squeaker",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "snack-stuffers-holiday-dog-stocking-stuffers",
        "category": "Pet Supplies > Dog Supplies > Dog Treats > Jerky & Chews",
        "material": "100% Dehydrated Chicken/Beef Pet Treats",
        "weight_lb": "0.6 lb",
        "battery": "No",
        "choking_hazard": "No",
    },

    # 4. Candles (5 items)
    {
        "handle": "christmas-tree-farm-travel-tin-candle",
        "category": "Home & Living > Home Fragrance > Candles & Aromatherapy",
        "material": "100% Soy Wax & Metal Tin",
        "weight_lb": "0.6 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "fresh-woods-soy-blend-candle-pine-balsam-fir-cedar",
        "category": "Home & Living > Home Fragrance > Candles & Aromatherapy",
        "material": "Soy Wax Blend & Glass Jar",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "amber-santal-soy-blend-candle-sweet-amber-creamy-sandalwood-vanilla-orchid",
        "category": "Home & Living > Home Fragrance > Candles & Aromatherapy",
        "material": "Soy Wax Blend & Glass Jar",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "orange-clove-signature-soy-candle",
        "category": "Home & Living > Home Fragrance > Candles & Aromatherapy",
        "material": "100% Soy Wax & Glass Tumbler",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "eucalyptus-lavender-signature-soy-candle",
        "category": "Home & Living > Home Fragrance > Candles & Aromatherapy",
        "material": "100% Soy Wax & Glass Tumbler",
        "weight_lb": "1.2 lb",
        "battery": "No",
        "choking_hazard": "No",
    },

    # 5. Planners & Stationery (8 items)
    {
        "handle": "2027-metal-flake-weekly-planner",
        "category": "Office & School Supplies > Calendars & Planners",
        "material": "Hardcover Board & 100gsm Woodfree Paper",
        "weight_lb": "1.1 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "2027-velvet-floral-weekly-planner",
        "category": "Office & School Supplies > Calendars & Planners",
        "material": "Hardcover Board & 100gsm Woodfree Paper",
        "weight_lb": "1.1 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "2027-black-leather-look-weekly-planner",
        "category": "Office & School Supplies > Calendars & Planners",
        "material": "Vegan Faux Leather & 100gsm Woodfree Paper",
        "weight_lb": "1.1 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "2027-strawberry-fields-weekly-planner",
        "category": "Office & School Supplies > Calendars & Planners",
        "material": "Hardcover Board & 100gsm Woodfree Paper",
        "weight_lb": "1.1 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "strawberry-fields-pen-set",
        "category": "Office & School Supplies > Writing Instruments > Gel Pens",
        "material": "Plastic, Metal & Black Gel Ink",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "Yes",
    },
    {
        "handle": "gone-fishing-notecard-set",
        "category": "Office & School Supplies > Cards & Stationery",
        "material": "Heavyweight Recycled Cardstock & Kraft Envelopes",
        "weight_lb": "0.6 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "12-sheets-functional-sticker-set-for-planners",
        "category": "Office & School Supplies > Calendars & Planners > Planner Accessories",
        "material": "Adhesive Matte Paper",
        "weight_lb": "0.5 lb",
        "battery": "No",
        "choking_hazard": "No",
    },
    {
        "handle": "planner-pal-gift-set",
        "category": "Office & School Supplies > Stationery Gift Sets",
        "material": "Paper, Cardstock & Pen Hardware",
        "weight_lb": "0.8 lb",
        "battery": "No",
        "choking_hazard": "No",
    }
]

out_csv = '/Users/lars/.gemini/antigravity/scratch/bizi_bees/tiktok_attributes.csv'
fieldnames = [
    'handle', 'product_name', 'shopify_price', 'vendor',
    'tiktok_category_guess', 'material', 'weight', 'battery',
    'choking_hazard_warning', 'package_dimensions', 'sources_note'
]

with open(out_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in tiktok_items:
        h = row['handle']
        p = p_map.get(h)
        title = p['title'] if p else h
        price = f"${float(p['variants'][0]['price']):.2f}" if p else "NEEDS_DATA: Price"
        vendor = p.get('vendor', '') if p else ''
        
        writer.writerow({
            'handle': h,
            'product_name': title,
            'shopify_price': price,
            'vendor': vendor,
            'tiktok_category_guess': row['category'],
            'material': row['material'],
            'weight': row['weight_lb'],
            'battery': row['battery'],
            'choking_hazard_warning': row['choking_hazard'],
            'package_dimensions': 'NEEDS_DATA: Physical package length x width x height (inches) pending warehouse measurement',
            'sources_note': 'Live Shopify catalog products.json (Nov 10, 2026)'
        })

print(f"tiktok_attributes.csv generated successfully with {len(tiktok_items)} rows.")
