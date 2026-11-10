import csv, re

items = [
    {
        "handle": "squishy-dumpling-advent-calendar-24-days-of-amazing-squishy-sensory-toys-for-everyone",
        "name": "Squishy Dumpling Advent Calendar (24 Days)",
        "shopify_price": 28.99,
        "math": "28.99 * 1.15 = 33.3385 -> $33.49",
        "ebay_price": 33.49,
        "title": "Squishy Dumpling Advent Calendar 2026 Christmas Holiday Countdown 24 Day Mochi Sensory Fidget Toys Gift Box Only 4 Left",
        "desc": "Count down the holiday season with 24 individually boxed mochi dumpling squishies designed for hands-on sensory joy. Each day reveals a super-soft slow-rising mini dumpling that makes a delightful tactile desk toy or stocking surprise. With only approximately four units remaining in stock, this viral holiday gift pack is ready for fast, free US shipping.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "mystery-squishies",
        "name": "Mystery Squishies Blind Box",
        "shopify_price": 19.99,
        "math": "19.99 * 1.15 = 22.9885 -> $22.99",
        "ebay_price": 22.99,
        "title": "Mystery Squishies Blind Box Surprise Pack Cute Slow Rise Foam Tactile Sensory Fidget Desk Toy Gift for Kids Teens Adults",
        "desc": "Unbox the fun of surprise with this collectible mystery squishy pack featuring ultra-soft slow-rising sensory characters. Perfect for tactile desk fidgeting, classroom prize boxes, or fun holiday stocking stuffers for kids and teens alike. Ships brand new and sealed with free US standard shipping on every order.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "squishy-time-rescue",
        "name": "Squishy Time Rescue Sensory Game Set",
        "shopify_price": 29.99,
        "math": "29.99 * 1.15 = 34.4885 -> $34.49 (exact brief price)",
        "ebay_price": 34.49,
        "title": "Squishy Time Rescue Interactive Sensory Board Game with Soft Squishies Family Game Night Tactile Fidget Toy Gift Set",
        "desc": "Bring hands-on tactile fun to family game night with Squishy Time Rescue, the interactive game where players rescue adorable squishies. Designed to encourage cooperative play, turn-taking, and screen-free tactile engagement for young kids and families. Complete game set includes colorful challenge cards and lovable squishy rescue figures.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "supermarket-squishy-spree",
        "name": "Supermarket Squishy Spree Game",
        "shopify_price": 39.99,
        "math": "39.99 * 1.15 = 45.9885 -> $45.99",
        "ebay_price": 45.99,
        "title": "Supermarket Squishy Spree Board Game Cute Grocery Sensory Squishies Pretend Play Family Fun Screen Free Kids Toy Gift",
        "desc": "Race down pretend grocery aisles collecting adorable miniature grocery squishies in this fast-paced tactile board game. Kids practice sorting, basic counting, and social play while enjoying ultra-satisfying squeeze toys. Perfect gift for screen-free family game nights, playdates, and elementary classroom reward centers.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "glitter-slow-rise-maltose-dumpling-squishy-fidget-stress-relief-toy",
        "name": "Glitter Slow Rise Maltose Dumpling Squishy",
        "shopify_price": 17.99,
        "math": "17.99 * 1.15 = 20.6885 -> $20.69",
        "ebay_price": 20.69,
        "title": "Glitter Maltose Dumpling Squishy Toy Sparkling Slow Rise Sensory Squeeze Fidget Clear Steamer Desk Toy Stocking Stuffer",
        "desc": "Experience ultra-satisfying resistance with this sparkling glitter-filled maltose dumpling squishy encased in a mini steamer basket. The heavy, slow-rising tactile texture provides a calming hands-on sensory experience during study or office work. Arrives brand new and sealed with free standard shipping across the United States.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "mystery-dumpling-glow-in-the-dark-steamer",
        "name": "Mystery Dumpling Glow-in-the-Dark Steamer",
        "shopify_price": 12.00,
        "math": "12.00 * 1.15 = 13.80 -> $13.99",
        "ebay_price": 13.99,
        "title": "Glow in the Dark Mystery Dumpling Squishy in Mini Steamer Basket Cute Night Glow Sensory Fidget Toy Fun Stocking Stuffer",
        "desc": "Discover a surprise glowing dumpling squishy tucked neatly inside its own miniature bamboo-style steamer container. Simply expose the squishy to light to activate a soothing nocturnal glow that makes nighttime fidgeting fun and magical. A delightful, budget-friendly holiday stocking stuffer or party favor that ships free nationwide.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "10-frame-fidgets-set-of-12",
        "name": "10 Frame Fidgets (Set of 12)",
        "shopify_price": 14.99,
        "math": "14.99 * 1.15 = 17.2385 -> $17.49",
        "ebay_price": 17.49,
        "title": "10 Frame Fidgets Set of 12 Math Learning Sensory Poppers Tactile Counting Tool Ten Frame Classroom Desk Fidget Toy Bulk Pack",
        "desc": "Combine hands-on tactile popping with early math visualization using this durable 12-pack of colorful ten-frame fidgets. Teachers and parents love these tactile tools for teaching counting, addition bonds, and number sense without screens. Compact, washable silicone construction makes them ideal for classroom sensory bins, math centers, and travel bags.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "mini-forest-farm-home-animal-fidget-toy-pack-20-items",
        "name": "Mini Animal Fidget Pack (20 Pieces)",
        "shopify_price": 30.00,
        "math": "30.00 * 1.15 = 34.50 -> $34.49",
        "ebay_price": 34.49,
        "title": "20 Pc Mini Animal Fidget Toy Pack Forest Farm Pets Articulated Sensory Toys 3D Printed Cute Collectibles Gift Box Set",
        "desc": "Unpack an entire zoo of articulated sensory animals including woodland critters, farm animals, and favorite household pets. Each flexible creature features smooth interlocking joints that bend, twist, and click for hours of soothing tactile exploration. An impressive 20-piece variety set ready to split into party favors or give as a complete collector gift.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "fidget-moons",
        "name": "Fidget Moons Sensory Fidget",
        "shopify_price": 16.95,
        "math": "16.95 * 1.15 = 19.4925 -> $19.49",
        "ebay_price": 19.49,
        "title": "Fidget Moons Dual Color Smooth Articulated Tactile Sensory Hand Toy Quiet Desk Fidget for Focus Classroom Office Gift",
        "desc": "Glide the interlocking crescent arcs of Fidget Moons through your fingertips for a quiet, continuous tactile flow. Engineered with ultra-smooth edges, this compact fidget toy operates silently to support everyday focus during meetings or study sessions. Crafted in attractive two-tone finishes and delivered anywhere in the US with free shipping.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "dark-side-of-the-fidget-moon",
        "name": "Dark Side of the Fidget Moon",
        "shopify_price": 21.95,
        "math": "21.95 * 1.15 = 25.2425 -> $25.49",
        "ebay_price": 25.49,
        "title": "Dark Side of the Fidget Moon Black Edition Articulated Tactile Sensory Toy Smooth Desk Fidget Quiet Hand Tool for Adults",
        "desc": "Featuring a sleek midnight colorway, the Dark Side of the Fidget Moon offers an elegant tactile experience for professionals and students. Its interlocking curved segments slide effortlessly against one another, offering discreet, silent fidgeting to keep hands engaged. A premium gift for anyone who appreciates minimalist design and soothing tactile motion.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "popplers-daily-routines-emotions-and-feelings",
        "name": "Popplers: Daily Routines & Emotions",
        "shopify_price": 34.99,
        "math": "34.99 * 1.15 = 40.2385 -> $40.49",
        "ebay_price": 40.49,
        "title": "Popplers Daily Routines and Emotions Sensory Bubble Board Visual Schedule Social Emotional Learning Tactile Toy for Kids",
        "desc": "Help young children master morning and evening routines while identifying big feelings with this interactive sensory bubble board. Kids push and pop durable silicone bubbles as they complete daily milestones and express emotional states. A wonderful screen-free communication aid designed for preschoolers, kindergarteners, and calm-down corners.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "screen-free-kids-pack",
        "name": "Screen-Free Kids Pack (3 Playtime Pads Bundle)",
        "shopify_price": 29.85,
        "math": "29.85 * 1.15 = 34.3275 -> $34.49",
        "ebay_price": 34.49,
        "title": "Screen Free Kids Pack 3 Playtime Pads Bundle Interactive Pretend Play Notepads Restaurant Travel Activity Book Gift Set",
        "desc": "Ditch screens and spark hours of creative pretend play with this value bundle containing three bestselling Playtime Pad activity notepads. Kids love taking orders, filling out pretend receipts, and solving interactive paper challenges at home or in restaurants. Heavyweight tear-off paper sheets provide portable, mess-free entertainment for long road trips and family dining.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "lemonade-stand-playtime-pad®",
        "name": "Lemonade Stand Playtime Pad®",
        "shopify_price": 9.95,
        "math": "9.95 * 1.15 = 11.4425 -> $11.49",
        "ebay_price": 11.49,
        "title": "Lemonade Stand Playtime Pad Pretend Play Activity Notepad 50 Tear Off Sheets Screen Free Creative Business Fun for Kids",
        "desc": "Inspire young entrepreneurs with this colorful 50-sheet pretend lemonade stand order pad designed for immersive imaginative play. Children take custom drink orders, calculate pretend prices, and serve smiling customers with real paper receipts. Compact 5x7 inch notepad slips easily into backpacks for playdates, neighborhood lemonade stands, and rainy day fun.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "cleaning-crew-playtime-pad®",
        "name": "Cleaning Crew Playtime Pad®",
        "shopify_price": 9.95,
        "math": "9.95 * 1.15 = 11.4425 -> $11.49",
        "ebay_price": 11.49,
        "title": "Cleaning Crew Playtime Pad Kids Chore Helper Notepad Pretend Play Cleaning Checklist 50 Tear Off Sheets Screen Free Activity",
        "desc": "Turn household chores into an exciting pretend mission with the Cleaning Crew Playtime Pad checklist notepad. Kids wear the imaginary crew chief hat as they inspect rooms, check off sparkle tasks, and celebrate neat spaces. Includes 50 tear-off sheets that make tidying up feel like an interactive adventure rather than a chore.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "on-the-go-scavenger-hunt-playtime-pad®",
        "name": "On The Go Scavenger Hunt Playtime Pad®",
        "shopify_price": 9.95,
        "math": "9.95 * 1.15 = 11.4425 -> $11.49",
        "ebay_price": 11.49,
        "title": "On The Go Scavenger Hunt Playtime Pad Travel Activity Pad Car Ride Road Trip Games Screen Free Kids Notepad 50 Sheets",
        "desc": "Keep travel quiet and engaging with this portable 50-sheet travel scavenger hunt pad crafted specifically for family road trips. Young travelers hunt for road signs, license plates, passing vehicles, and roadside landmarks without needing a tablet. An essential glove-compartment companion that keeps backseat boredom away on every journey.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "playtime-pad®-banker-pack",
        "name": "Playtime Pad® Banker Pack",
        "shopify_price": 19.95,
        "math": "19.95 * 1.15 = 22.9425 -> $22.95",
        "ebay_price": 22.95,
        "title": "Playtime Pad Banker Pack Pretend Play Bank Notepads Play Checks Deposit Slips Money Math Activity Set for Kids 3 Pads",
        "desc": "Encourage financial imagination and hands-on math practice with this 3-pad banker bundle containing pretend checks, deposit slips, and transaction logs. Young bankers practice writing numbers, endorsing pretend checks, and managing imaginary vaults during creative playtime. Made with premium, easy-to-write paper sheets that make financial pretend play feel completely authentic.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "2027-metal-flake-weekly-planner",
        "name": "2027 Metal Flake Weekly Planner",
        "shopify_price": 45.00,
        "math": "45.00 * 1.15 = 51.75 -> $51.75 (if $47: 47 * 1.15 = 54.05 -> $54.49)",
        "ebay_price": 51.75,
        "title": "2027 Metal Flake Weekly Planner Premium Hardcover Dated Agenda Goal Organizer Ribbon Bookmark Elegant Stationery Gift",
        "desc": "Step into the upcoming year with this stunning 2027 dated weekly planner featuring a shimmering metal-flake hardcover exterior. Inside, find spacious weekly spreads, monthly overviews, habit trackers, and thick ink-bleed-resistant pages tailored for effortless organization. Finished with a satin ribbon marker and lay-flat binding for an elevated daily planning ritual.",
        "source": "Store Brief ($47) / live products.json ($45) (Nov 10, 2026)"
    },
    {
        "handle": "2027-velvet-floral-weekly-planner",
        "name": "2027 Velvet Floral Weekly Planner",
        "shopify_price": 45.00,
        "math": "45.00 * 1.15 = 51.75 -> $51.75",
        "ebay_price": 51.75,
        "title": "2027 Velvet Floral Weekly Planner Hardcover Botanical 12 Month Agenda Goal Setting Schedule Book Luxury Stationery Gift",
        "desc": "Organize your schedule in botanical elegance with the 2027 Velvet Floral dated weekly agenda planner. Designed with lush floral cover art, intuitive week-at-a-glance layouts, and dedicated goal-setting sections for seamless personal and work tracking. High-grade archival paper ensures smooth writing with your favorite fountain or gel ink pens without bleeding.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "strawberry-fields-pen-set",
        "name": "Strawberry Fields Pen Set",
        "shopify_price": 12.95,
        "math": "12.95 * 1.15 = 14.8925 -> $14.89",
        "ebay_price": 14.89,
        "title": "Strawberry Fields Pen Set Cute Floral Gel Pens Smooth Black Ink Fine Tip Aesthetic Stationery Set for Planners Journaling",
        "desc": "Add a touch of sweet vintage charm to your planner or daily journal with this coordinating Strawberry Fields pen set. Engineered with fine-point precision tips and rich, skip-free black gel ink, each pen glides effortlessly across notebook paper. Packaged in a lovely ready-to-gift box that makes a thoughtful token for writers, teachers, and stationery lovers.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "gone-fishing-notecard-set",
        "name": "Gone Fishing Notecard Set",
        "shopify_price": 14.95,
        "math": "14.95 * 1.15 = 17.1925 -> $17.19",
        "ebay_price": 17.19,
        "title": "Gone Fishing Notecard Set with Envelopes Blank Inside Vintage Angler Trout Outdoor Greeting Cards Box Set of 8",
        "desc": "Share warm greetings or handwritten gratitude with this boxed set of premium textured notecards featuring hand-illustrated fishing motifs. Each heavyweight card is blank inside to give you ample room for personalized correspondence, thank-yous, or birthday notes. Paired with matching kraft envelopes and printed on sustainably sourced cardstock with free domestic shipping.",
        "source": "Store Brief & live products.json (Nov 10, 2026)"
    },
    {
        "handle": "christmas-tree-farm-travel-tin-candle",
        "name": "Christmas Tree Farm Travel Tin Candle",
        "shopify_price": 14.00,
        "math": "14.00 * 1.15 = 16.10 -> $16.49",
        "ebay_price": 16.49,
        "title": "Christmas Tree Farm Travel Tin Candle Hand Poured Fresh Pine Evergreen Soy Wax Candle Portable Holiday Scent Gift",
        "desc": "Fill your living space with the nostalgic crisp aroma of freshly cut pine, cedarwood, and balsam fir with this artisanal travel tin candle. Hand-poured with clean-burning American-grown soy wax and lead-free cotton wicks for a soot-free, comforting holiday ambiance. Compact, lidded metal tin makes it simple to bring warm holiday memories along on seasonal travels.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "orange-clove-signature-soy-candle",
        "name": "Orange + Clove Signature Soy Candle",
        "shopify_price": 36.00,
        "math": "36.00 * 1.15 = 41.40 -> $41.49",
        "ebay_price": 41.49,
        "title": "Orange and Clove Signature Soy Candle Hand Poured Essential Oil Candle Warm Spiced Citrus Glass Jar Aromatherapy Gift",
        "desc": "Infuse your home with comforting seasonal warmth through this signature soy candle fragranced with pure orange peel and warm spiced clove. Carefully poured into a reusable glass tumbler with premium vegan soy wax and unbleached cotton wicks for a long, tranquil burn. Creates a cozy, welcoming atmosphere ideal for chilly autumn evenings and relaxing holiday gatherings.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "christmas-tree-nylon-dog-chew-toy-for-aggressive-chewers-usa-made-fda-compliant",
        "name": "Christmas Tree Nylon Dog Chew Toy",
        "shopify_price": 12.99,
        "math": "12.99 * 1.15 = 14.9385 -> $14.99",
        "ebay_price": 14.99,
        "title": "Christmas Tree Nylon Dog Chew Toy SodaPup Heavy Duty Chewers Holiday Dog Toy USA Made Food Grade Durable Pet Gift",
        "desc": "Built for persistent power chewers, this festive evergreen tree nylon dog toy by SodaPup withstands heavy biting and active indoor play. Textured tree ridges help keep dog teeth clean while the hollow center can be filled with peanut butter or spreadable treats. Proudly manufactured in the USA from non-toxic, pet-safe material and backed by free standard US shipping.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "roasted-turkey-dog-chew-toy-treat-dispenser-usa-made-sodapup",
        "name": "Roasted Turkey Dog Chew Toy & Dispenser",
        "shopify_price": 15.99,
        "math": "15.99 * 1.15 = 18.3885 -> $18.49",
        "ebay_price": 18.49,
        "title": "Roasted Turkey Dog Chew Toy SodaPup Treat Dispenser Durable Rubber Toy for Power Chewers USA Made Holiday Dog Gift",
        "desc": "Treat your pup to their very own holiday feast with this ultra-durable roasted turkey rubber chew toy and boredom-busting treat dispenser. Stuff the hollow interior with kibble, yogurt, or healthy spreadable snacks to keep active dogs mentally stimulated and happily occupied. Made in the USA from proprietary pet-safe natural rubber for long-lasting chewing satisfaction.",
        "source": "live products.json (Nov 10, 2026)"
    },
    {
        "handle": "snowman-dog-toy-durable-winter-chew-toy-for-large-dogs-usa-made",
        "name": "Snowman Dog Toy - Durable Winter Chew",
        "shopify_price": 15.99,
        "math": "15.99 * 1.15 = 18.3885 -> $18.49",
        "ebay_price": 18.49,
        "title": "Snowman Dog Toy SodaPup Heavy Duty Winter Rubber Chew Toy Treat Dispenser Large Dogs USA Made Holiday Pet Stocking Stuffer",
        "desc": "Celebrate winter with the cheerful SodaPup snowman rubber dog toy designed to satisfy the chew instincts of medium and large dogs. Its hollow center functions as a challenging treat puzzle that dispenses biscuits and peanut butter during solo play sessions. Made in the USA using durable, non-toxic natural rubber that rinses clean quickly under warm tap water.",
        "source": "live products.json (Nov 10, 2026)"
    }
]

out_csv = '/Users/lars/.gemini/antigravity/scratch/bizi_bees/ebay_pack.csv'
fieldnames = ['handle', 'product_name', 'shopify_price', 'ebay_price_math', 'ebay_price', 'ebay_title_140char', 'ebay_description_3sentences', 'sources_note']

with open(out_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for it in items:
        # validate title length
        title_len = len(it['title'])
        assert title_len <= 140, f"Title too long ({title_len}): {it['title']}"
        
        # validate sentence count (3 sentences)
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', it['desc']) if s.strip()]
        assert len(sentences) == 3, f"Desc sentences != 3 ({len(sentences)}): {it['desc']}"
        
        writer.writerow({
            'handle': it['handle'],
            'product_name': it['name'],
            'shopify_price': f"${it['shopify_price']:.2f}",
            'ebay_price_math': it['math'],
            'ebay_price': f"${it['ebay_price']:.2f}",
            'ebay_title_140char': it['title'],
            'ebay_description_3sentences': it['desc'],
            'sources_note': it['source']
        })

print(f"ebay_pack.csv successfully created with {len(items)} items. All title lengths <= 140 and descriptions exactly 3 sentences.")
