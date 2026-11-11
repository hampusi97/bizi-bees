INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('ember-oak', 'Ember & Oak™ Reserve', 'Luxury Cigars, Briar Pipes & Humidors', 'ember-oak.myshopify.com', 'Spanish Cedar Humidor & Aficionado Torch Kit', '48.00', '78.00', '128.7', 'Cut-Crystal Cigar & Pipe Rest ($24 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('bizi-bees', 'Bizi Bees Boutique', 'Curated Vintage Books & Cozy Gifts', 'bizibees-store.myshopify.com', 'Blind Date with a Book & Cozy Evening Crate', '14.99', '38.00', '62.7', 'Solid Brass Honeybee Bookmark ($12 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('luma-clinical', 'Luma Clinical™', 'Clinical Derm-Tech', 'luma-clinical.myshopify.com', 'LumaGlow™ QuadWave Pro 4-in-1 Wand', '38.99', '59.99', '98.98', 'Full-Size Activating Peptide Serum ($24 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('luma-relief', 'Luma Relief™', 'Migraine & Tension Recovery', 'luma-relief.myshopify.com', 'LumaRelief™ 360° Cold Compression Cap', '22.74', '32.49', '53.61', 'Herbal Sinus Acupressure Roller ($18 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('fizz-lab', 'Fizz Lab™ Soda', 'Utah Dirty Soda Bar Kits', 'fizz-lab.myshopify.com', 'Custom At-Home Dirty Soda Bar Kit', '32.00', '48.00', '79.2', 'High-Speed Electric Cream Frother ($16 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('crave-lab', 'Crave Lab™ Chocolates', 'Artisanal Belgian Confections', 'crave-lab.myshopify.com', 'Custom 4-Bar Chocolate Bento Box', '24.00', '38.00', '62.7', 'Smoked Sea Salt Dark Tasting Bar ($9 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('aura-sculpt', 'Aura Sculpt™', 'CloudSoft™ Seamless Activewear', 'aura-sculpt.myshopify.com', '2-Piece Mix & Match Sculpt Set', '38.00', '54.00', '89.1', 'Non-Slip Pilates Grip Socks ($16 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('pawglow', 'PawGlow Co™', 'Pet Grooming Tech', 'pawglow.myshopify.com', 'Ultrasonic Steam Deshedding Pet Brush', '22.99', '34.99', '57.73', 'Organic Lavender Coat Mist ($15 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('zenith-sleep', 'Zenith Sleep™', 'Deep Sleep Biohacking', 'zenith-sleep.myshopify.com', 'Bluetooth 3D Zero-Pressure Blackout Mask', '34.99', '49.99', '82.48', 'Satin Travel Case + Earplugs ($14 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('aura-posture', 'Aura Posture™', 'Smart Spine Ergonomics', 'aura-posture.myshopify.com', 'Smart Haptic Posture Alignment Sensor', '38.00', '54.00', '89.1', 'Ergonomic Gel Wrist Rest ($18 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('lumicarve', 'LumiCarve™', 'Precision DIY & Crafting', 'lumicarve.myshopify.com', 'Cordless High-Speed Micro Engraving Pen', '42.00', '58.00', '95.7', '30-Piece Diamond Burr Bit Kit ($22 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('dermasonic', 'Dermasonic™', 'Ultrasonic Pore Care', 'dermasonic.myshopify.com', 'Ultrasonic Water-Ion Blackhead Scrubber', '29.99', '44.99', '74.23', 'Pore-Melting Botanical Toner ($19 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('calmcore', 'CalmCore™', 'Weighted Thermal Therapy', 'calmcore.myshopify.com', 'Weighted Clay Herbal Neck & Shoulder Wrap', '44.00', '64.00', '105.6', 'Aromatherapy Essential Oil Roll-On ($16 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('floraspring', 'FloraSpring™', 'Cottagecore Plant Tech', 'floraspring.myshopify.com', 'Terracotta Self-Watering Spikes (Set of 4)', '21.99', '34.99', '57.73', 'Organic Liquid Plant Food Drops ($14 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;
INSERT INTO fleet_stores 
      (store_slug, name, niche, domain, hero_product, solo_price, bundle_price, master_price, free_gift, accent_color, revenue_24h, orders_24h, aov, conversion_rate, status, seo_articles_count, audit_score, last_healed)
      VALUES ('velobrew', 'VeloBrew™', 'Portable Barista Tech', 'velobrew.myshopify.com', 'Cordless 20-Bar Thermal Portable Espresso Maker', '54.00', '74.00', '122.1', 'Stainless Steel Dosing Ring & Tamper ($20 Value)', '#D9822B', '1450.00', 28, '51.78', '3.45', 'online', 15, 100, 'Just now')
      ON CONFLICT (store_slug) DO UPDATE SET
        name = EXCLUDED.name,
        hero_product = EXCLUDED.hero_product,
        solo_price = EXCLUDED.solo_price,
        bundle_price = EXCLUDED.bundle_price,
        master_price = EXCLUDED.master_price,
        free_gift = EXCLUDED.free_gift;