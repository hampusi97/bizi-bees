#!/usr/bin/env ruby
# ==============================================================================
# Bizi Bees & Luma Wellness — Autonomous Trending Article & Popularity Engine v2.0
# ==============================================================================
# Continuously mines high-volume, trending search queries and buyer-intent keywords:
# 1. At-home red light phototherapy & Solawave / Omnilux / NuFACE teardowns
# 2. Cold thermal migraine relief caps & barometric tension headache solutions
# 3. Microcurrent facial sculpting, double-chin lifting & tech-neck smoothing
# 4. Stainless steel cryo-rolling & morning periorbital lymphatic drainage
# 5. Ultrasonic 24kHz blackhead extraction vs damaging pore strips
# 6. Low-level laser (650nm) therapy for postpartum & androgenetic hair thinning
# 7. Black Friday / Holiday Gift Guides & FSA/HSA wellness eligibility guides
# 8. Programmatic Long-Tail Synthesizer when primary queue is completed
# ==============================================================================

require "fileutils"
require "json"
require "time"

REPO_DIR ||= if Dir.exist?("/Users/lars/Documents/GitHub/bizi-bees")
               "/Users/lars/Documents/GitHub/bizi-bees"
             else
               File.expand_path("..", File.dirname(__FILE__))
             end
BLOG_DIR ||= File.join(REPO_DIR, "content", "blog-posts")
CSV_PATH ||= File.join(REPO_DIR, "content", "trending_articles_shopify_import.csv")
BASE_URL ||= "https://bizibees-store.myshopify.com"

FileUtils.mkdir_p(BLOG_DIR)

def build_clinical_article_html(opts)
  schema = {
    "@context" => "https://schema.org",
    "@type" => "Article",
    "headline" => opts[:title],
    "description" => opts[:summary],
    "author" => { "@type" => "Person", "name" => "Kimberly Harter" },
    "publisher" => { "@type" => "Organization", "name" => "Bizi Bees & Luma Wellness" },
    "mainEntityOfPage" => "#{BASE_URL}/blogs/news/#{opts[:handle]}"
  }.to_json

  <<~HTML
    <script type="application/ld+json">#{schema}</script>
    <div class="article-content" style="max-width:800px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.7;color:#1f2937;">
      <div style="background:#fffcf2;border:2px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;text-transform:uppercase;">⚡ #{opts[:badge] || "VIP Launch Deal • 35% Off"}</span>
            <h4 style="margin:6px 0 2px;font-size:16px;font-weight:800;color:#111827;">#{opts[:product_name]}: #{opts[:product_price]} with code PROVOTODAY</h4>
            <p style="margin:0;font-size:13px;color:#6b7280;">#{opts[:banner_subtext] || "Clinical-grade at-home therapy. Free US shipping from Utah + 60-day risk-free guarantee."}</p>
          </div>
          <a href="#{BASE_URL}#{opts[:product_vanity]}" style="background:#dc2626;color:#fff;font-weight:800;padding:12px 20px;border-radius:8px;font-size:13px;text-decoration:none;display:inline-block;">Claim 35% Off (#{opts[:product_price].split.first}) &rarr;</a>
        </div>
      </div>

      <p class="lead" style="font-size:18px;color:#374151;font-weight:500;">#{opts[:lead]}</p>

      <p>#{opts[:intro]}</p>

      <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">1. #{opts[:h2_1]}</h2>
      <p>#{opts[:body_1]}</p>
      <ul style="padding-left:20px;margin-bottom:20px;">
        #{opts[:bullets].map { |b| "<li style=\"margin-bottom:8px;\">#{b}</li>" }.join("\n        ")}
      </ul>

      <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">2. Head-to-Head Comparison: #{opts[:brand_comparison]} vs. #{opts[:product_name]}</h2>
      <div style="overflow-x:auto;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
              <th style="padding:12px;text-align:left;">Clinical Metric</th>
              <th style="padding:12px;text-align:left;">#{opts[:brand_comparison]}</th>
              <th style="padding:12px;text-align:left;background:#fef2f2;color:#dc2626;">#{opts[:product_name]}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:12px;font-weight:600;">Primary Technology</td>
              <td style="padding:12px;">#{opts[:comp_spec]}</td>
              <td style="padding:12px;background:#fef2f2;font-weight:600;color:#059669;">#{opts[:our_spec]}</td>
            </tr>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <td style="padding:12px;font-weight:600;">Trial &amp; Warranty</td>
              <td style="padding:12px;">30 Days</td>
              <td style="padding:12px;background:#fef2f2;font-weight:600;color:#059669;">60-Day 100% Money-Back Guarantee</td>
            </tr>
            <tr style="background:#fef2f2;">
              <td style="padding:12px;font-weight:800;color:#dc2626;">Total Cost (Code PROVOTODAY)</td>
              <td style="padding:12px;">#{opts[:comp_price]}</td>
              <td style="padding:12px;font-weight:800;color:#dc2626;">#{opts[:product_price]} + Free US Shipping</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">3. #{opts[:h2_3]}</h2>
      <ol style="padding-left:20px;margin-bottom:24px;">
        #{opts[:steps].map { |s| "<li style=\"margin-bottom:8px;\">#{s}</li>" }.join("\n        ")}
      </ol>

      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-top:36px;">
        <h3 style="margin-top:0;font-size:20px;font-weight:800;color:#111827;">#{opts[:cta_heading]}</h3>
        <p style="color:#4b5563;font-size:14px;max-width:520px;margin:8px auto 16px;">Try #{opts[:product_name]} risk-free for 60 days. Dispatched within 24 hours from Provo, Utah with free nationwide delivery.</p>
        <a href="#{BASE_URL}#{opts[:product_vanity]}" style="background:#dc2626;color:#fff;font-weight:800;padding:14px 28px;border-radius:8px;font-size:15px;text-decoration:none;display:inline-block;">Order #{opts[:product_name]} (#{opts[:product_price].split.first} with Code PROVOTODAY) &rarr;</a>
      </div>
    </div>
  HTML
end

TRENDING_TOPICS = [
  {
    handle: "winter-dry-skin-red-light-therapy-collagen-barrier-repair",
    title: "Why Red Light Therapy Is the Ultimate Winter Dry Skin Remedy for Barrier Repair",
    category: "Skincare Tech",
    tags: "Red Light Therapy, Winter Skincare, Collagen, Skin Barrier, LumaGlow",
    target_query: "red light therapy for dry winter skin barrier repair",
    summary: "Winter indoor heating and cold winds deplete skin ceramides. Learn how 630nm medical red light restores cellular ATP to rebuild the epidermal barrier.",
    product_name: "LumaGlow™ 4-in-1 Red Light Wand",
    product_vanity: "/wand",
    product_price: "$38.99 (Reg $89.99)",
    brand_comparison: "Solawave 4-in-1 ($169)"
  },
  {
    handle: "how-to-fix-under-eye-bags-in-3-minutes-cryo-ice-roller",
    title: "How to Deflate Morning Under-Eye Bags in 3 Minutes: The Cryo-Sculpting Guide",
    category: "Wellness & Lymphatic",
    tags: "Ice Roller, Under Eye Bags, Lymphatic Drainage, Morning Routine, Cryotherapy",
    target_query: "how to get rid of puffy eyes fast in the morning",
    summary: "Waking up with fluid retention and dark under-eye swelling? Discover how food-grade stainless steel cryotherapy accelerates lymphatic drainage in 3 minutes.",
    product_name: "Cryo-Glow™ Stainless Steel Ice Sculpting Roller",
    product_vanity: "/relief",
    product_price: "$18.84 (Reg $39.99)",
    brand_comparison: "Standard Jade Rollers ($25-$40)"
  },
  {
    handle: "blue-light-vs-benzoyl-peroxide-for-adult-cystic-acne",
    title: "Blue Light Phototherapy vs. Benzoyl Peroxide: Clearing Adult Acne Without Flaking",
    category: "Clinical Acne",
    tags: "Blue Light, LED Mask, Adult Acne, Cystic Acne, LumaMask",
    target_query: "blue light phototherapy vs benzoyl peroxide for adult hormonal acne",
    summary: "Learn why 415nm blue light phototherapy kills P. acnes bacteria within minutes without causing peeling, bleached fabrics, or barrier damage.",
    product_name: "LumaMask™ 7-Color LED Phototherapy Face & Neck Shield",
    product_vanity: "/mask",
    product_price: "$84.49 (Reg $199.99)",
    brand_comparison: "Omnilux Clear ($395)"
  },
  {
    handle: "migraine-vs-sinus-headache-cold-compression-gel-cap-relief",
    title: "Migraine vs. Sinus Headache: Why 360° Cold Compression Outlasts Pain Pills",
    category: "Pain Relief",
    tags: "Migraine Relief, Tension Headache, Cold Cap, Sinus Relief, LumaRelief",
    target_query: "cold cap for sinus headache and migraine relief",
    summary: "Learn how circumferential 360° medical gel compression constricts temporal arteries and calms the trigeminal nerve within 90 seconds.",
    product_name: "LumaRelief™ 360° Cold & Thermal Migraine Relief Cap",
    product_vanity: "/caps",
    product_price: "$22.74 (Reg $49.99)",
    brand_comparison: "TheraICE RX ($39.99)"
  },
  {
    handle: "black-friday-2026-best-red-light-therapy-skincare-deals-under-50",
    title: "Black Friday 2026 Beauty Tech Guide: Clinical Red Light & Microcurrent Deals Under $50",
    category: "Holiday Deals",
    tags: "Black Friday 2026, Holiday Gift Guide, Red Light Wand Deal, Solawave Alternative, Budget Beauty",
    target_query: "best black friday red light therapy wand deals under 50",
    summary: "Skip the $400 luxury markups this holiday season. Compare clinical wavelengths, microcurrent output, and 60-day trial guarantees on the top beauty tech gifts under $50.",
    product_name: "LumaGlow™ 4-in-1 Red Light & Microcurrent Wand",
    product_vanity: "/wand",
    product_price: "$38.99 (Reg $89.99)",
    brand_comparison: "Solawave Radiant Renewal ($169)",
    comp_price: "$169.00",
    comp_spec: "630nm Red Light + Microcurrent",
    our_spec: "630nm Clinical Red Light + 330µA Microcurrent + 107°F Heat + Sonic",
    lead: "Every November, beauty tech shoppers search for holiday discounts on red light wands and LED masks—only to find luxury brands offering a meager 15% off an already inflated $169 to $395 sticker price.",
    intro: "By sourcing directly from medical-grade phototherapy manufacturers and fulfilling from Provo, Utah, Luma Wellness delivers identical 630nm wavelengths and galvanic microcurrent at 77% below big-box retail.",
    h2_1: "Why Clinical Wavelength Matters More Than Celebrity Packaging",
    body_1: "Fibroblast cells in your dermis do not care about a logo on the handle—they respond strictly to photon irradiance (mW/cm²) and wavelength precision (630nm ± 5nm).",
    bullets: [
      "<strong>630nm Deep Dermal Penetration:</strong> Stimulates cytochrome c oxidase to boost collagen Type I & III synthesis.",
      "<strong>330µA Microcurrent Toning:</strong> Gently exercises facial contour muscles along the cheekbones and brow.",
      "<strong>107°F Therapeutic Thermal Head:</strong> Dilates micro-capillaries to triple hyaluronic serum absorption."
    ],
    h2_3: "How to Gift (or Keep) the Ultimate At-Home Spa Routine",
    steps: [
      "Apply code <strong>PROVOTODAY</strong> via our 1-click checkout link to drop the price from $89.99 to $38.99.",
      "Pair with any water-based conductive serum or aloe mist for 5 minutes each evening.",
      "Enjoy peace of mind through the holidays with our extended 60-day 100% money-back guarantee."
    ],
    cta_heading: "Claim the #1 Holiday Beauty Tech Deal Before Stock Sells Out"
  },
  {
    handle: "tech-neck-horizontal-neck-lines-red-light-microcurrent-protocol",
    title: "How to Erase Horizontal 'Tech-Neck' Lines: The 630nm LED & Thermal Lifting Protocol",
    category: "Neck & Jawline",
    tags: "Tech Neck, Neck Wrinkles, Crepey Neck Skin, Microcurrent Sculptor, LumaLift",
    target_query: "how to get rid of horizontal tech neck lines without fillers",
    summary: "Looking down at phones and laptops folds the thin platysma skin 3,000 times a day. Discover how dual-sphere microcurrent and red light restore neck firmness.",
    product_name: "LumaLift™ Dual-Sphere V-Face & Neck Microcurrent Sculptor",
    product_vanity: "/lift",
    product_price: "$38.99 (Reg $59.99)",
    brand_comparison: "CurrentBody Neck Perfector ($380)",
    comp_price: "$380.00",
    comp_spec: "LED Light Only",
    our_spec: "350µA Dual-Sphere Microcurrent + 630nm Red Light + Thermal Lift",
    lead: "The skin on your neck and décolletage is 40% thinner than facial skin and possesses fewer sebaceous glands, making it the very first area to show crepiness and deep horizontal 'tech-neck' rings.",
    intro: "Because neck folds are caused by both collagen depletion and platysma muscle laxity, topical neck creams alone rarely move the needle. Combining microcurrent muscle re-education with phototherapy addresses both layers simultaneously.",
    h2_1: "Targeting the Platysma Muscle & Dermal Elastin Matrix",
    body_1: "When low-level microcurrent passes between dual ergonomic rollers, it triggers a 500% surge in cellular ATP while physically toning the superficial musculature supporting the jawline and upper neck.",
    bullets: [
      "<strong>Platysma Band Toning:</strong> Lifts sagging jowls and sharpens the cervicomental angle under the chin.",
      "<strong>Lymphatic Submental Flush:</strong> Clears trapped fluid that creates the appearance of a double chin.",
      "<strong>Zero Downtime:</strong> Painless 5-minute glide while watching TV or winding down at night."
    ],
    h2_3: "The 5-Minute Upward Neck Sculpting Technique",
    steps: [
      "Apply a generous layer of conductive gel or hydrating serum from collarbone to jawline.",
      "Glide upward from the base of the neck toward the chin using light-to-medium pressure (never drag downward).",
      "Sweep along the jawline from chin to earlobe 10 times per side to drain submental lymph."
    ],
    cta_heading: "Tighten & Smooth Neck Lines for 85% Less Than Clinic Treatments"
  },
  {
    handle: "tmj-jaw-clenching-masseter-tension-headache-thermal-relief-guide",
    title: "TMJ & Nighttime Jaw Clenching Relief: Releasing Masseter Trigger Points at Home",
    category: "Pain & TMJ Relief",
    tags: "TMJ Relief, Masseter Muscle, Bruxism, Tension Headache, Cold Compression, LumaRelief",
    target_query: "how to relieve tmj jaw clenching and temple headache fast",
    summary: "Waking up with a sore jaw, tight temples, and dull morning headaches from teeth grinding? Learn how targeted thermal-cryo therapy releases overactive masseter muscles.",
    product_name: "LumaRelief™ 360° Cold & Thermal Compression Cap",
    product_vanity: "/caps",
    product_price: "$22.74 (Reg $49.99)",
    brand_comparison: "Custom Dental Splints & Botox ($600+)",
    comp_price: "$600.00+",
    comp_spec: "Passive Tooth Guard / Injections",
    our_spec: "Dual Microwave Warmth + Freezer Cryo 360° Cranial/Temple Compression",
    lead: "Stress-induced bruxism (nighttime teeth clenching) exerts up to 250 pounds of force on your temporomandibular joint (TMJ), radiating inflammation directly into the temporalis muscle above your ears.",
    intro: "Most people don't realize that their morning temple headaches are actually referred myofascial pain from clenched jaw and temporal muscles. Dual temperature therapy breaks this spasm cycle naturally.",
    h2_1: "Why Temporal & Occipital Compression Stops TMJ Radiating Pain",
    body_1: "The temporalis muscle fans out across the entire side of your skull. When you clench your jaw at night, those fibers lock into ischemic knots. Applying gentle circumferential pressure with regulated temperature resets the muscle spindle reflex.",
    bullets: [
      "<strong>Warm Mode (20s Microwave):</strong> Increases local blood flow to relax rigid, spasming jaw and temple fibers.",
      "<strong>Cold Mode (Freezer):</strong> Numbs acute trigeminal nerve inflammation and reduces joint swelling.",
      "<strong>100% Light-Blocking Fit:</strong> Eliminates photophobia during severe tension-migraine flare-ups."
    ],
    h2_3: "Evening Decompression Protocol for Jaw Clenchers",
    steps: [
      "Slide on the LumaRelief™ Cap covering temples, forehead, and the base of the skull for 15 minutes before sleep.",
      "Rest your tongue gently on the roof of your mouth ('N' position) to disengage the masseter muscle.",
      "Take slow nasal breaths as the 360° hydrogel compression melts temporal tightness."
    ],
    cta_heading: "Stop Morning Jaw & Temple Headaches Without Daily Painkillers"
  },
  {
    handle: "postpartum-hair-thinning-telogen-effluvium-650nm-laser-comb-guide",
    title: "Postpartum & Stress Hair Shedding: How 650nm Low-Level Laser Therapy Wakes Up Follicles",
    category: "Hair Regrowth",
    tags: "Hair Regrowth, 650nm Laser, Postpartum Hair Loss, Thinning Edges, LumaCrown",
    target_query: "650nm red light laser comb for thinning hair and shedding",
    summary: "Experiencing widening parts, temple recession, or stress-related telogen effluvium? Explore the clinical evidence behind 650nm low-level laser therapy (LLLT).",
    product_name: "LumaCrown™ 650nm Laser & Red Light Scalp Applicator Comb",
    product_vanity: "/wand",
    product_price: "$45.49 (Reg $69.99)",
    brand_comparison: "HairMax LaserComb ($499)",
    comp_price: "$499.00",
    comp_spec: "650nm Laser Only",
    our_spec: "650nm Laser + Precision Root Serum Infusion Teeth + Sonic Scalp Massage",
    lead: "Seeing extra hair in the shower drain or noticing a widening center part can feel overwhelming—especially when topical foams leave your hair greasy and take 6 months to show minimal change.",
    intro: "Low-Level Laser Therapy (LLLT) at 650 nanometers is one of the most thoroughly studied non-pharmaceutical interventions for extending the anagen (growth) phase of hair follicles.",
    h2_1: "How 650nm Photons Reverse Follicle Miniaturization",
    body_1: "Dormant hair follicles suffer from reduced micro-circulation and localized inflammation around the dermal papilla. Coherent 650nm red light penetrates directly to the follicle bulb:",
    bullets: [
      "<strong>Vasodilation:</strong> Increases oxygen and nutrient delivery to starved hair roots.",
      "<strong>Direct Root Serum Delivery:</strong> Built-in precision ball-tip teeth part the hair so minoxidil, rosemary, or peptide serums reach the scalp—not your hair shafts.",
      "<strong>High-Frequency Massage:</strong> Relieves tight galea aponeurotica scalp tension."
    ],
    h2_3: "10-Minute Scalp Revival Routine (3x Per Week)",
    steps: [
      "Fill the integrated reservoir with your favorite peptide, caffeine, or rosemary scalp tonic (or use dry).",
      "Turn on the 650nm red laser + sonic vibration mode and comb slowly from hairline to crown.",
      "Focus for 2 extra minutes along the temples and part line where miniaturization occurs first."
    ],
    cta_heading: "Reactivate Thinning Hair Roots for 90% Less Than Clinic Lasers"
  },
  {
    handle: "ultrasonic-skin-scrubber-vs-pore-strips-blackhead-sebaceous-filaments",
    title: "Ultrasonic Skin Scrubber vs. Pore Strips: How to Clear Sebaceous Filaments Without Enlarging Pores",
    category: "Pore Care",
    tags: "Ultrasonic Skin Scrubber, Blackheads, Sebaceous Filaments, Pore Strips, SonicGlow",
    target_query: "ultrasonic skin spatula vs pore strips for nose blackheads",
    summary: "Adhesive pore strips rip away protective skin layers and stretch pore walls permanently. See how 24,000 Hz ultrasonic water cavitation clears pores safely.",
    product_name: "SonicGlow™ 24kHz Ultrasonic Pore Extracting Spatula",
    product_vanity: "/clean",
    product_price: "$22.74 (Reg $34.99)",
    brand_comparison: "DERMAFLASH DERMAPORE ($109)",
    comp_price: "$109.00",
    comp_spec: "Ultrasonic Spatula",
    our_spec: "24,000 Hz Cavitation + Positive/Negative Ion Serum Infusion + EMS Lift",
    lead: "Nearly everyone has tried adhesive nose strips or metal squeezing loops to clear stubborn blackheads—only to end up with broken capillaries, bruised skin, and pores that refill within 48 hours.",
    intro: "Licensed estheticians never use glue strips during clinical facials. Instead, they rely on 24,000 Hz ultrasonic cavitation to emulsify oxidized sebum plugs using nothing but water.",
    h2_1: "The Physics of 24kHz Ultrasonic Water Cavitation",
    body_1: "When the surgical stainless-steel spatula vibrates at 24,000 cycles per second against wet skin, it atomizes water into micro-jets. These micro-bubbles travel down into the follicle opening, vibrating oxidized oil and dead corneocytes loose without mechanical squeezing.",
    bullets: [
      "<strong>Zero Capillary Trauma:</strong> Safe for thin skin around the nostrils and chin.",
      "<strong>Anion Infusion Mode:</strong> Flip the blade flat to drive vitamin C and niacinamide serums deeper after cleansing.",
      "<strong>Instant Gratification:</strong> Visibly see congested sebum lift onto the spatula blade in 60 seconds."
    ],
    h2_3: "How to Perform an Esthetician Hydro-Extraction at Home",
    steps: [
      "Use right after a warm shower or facial steam while pores are softened, keeping skin dripping wet.",
      "Hold the SonicGlow™ blade at a 45-degree angle and glide gently across the nose, chin, and forehead.",
      "Wipe the blade with an alcohol pad, apply hydrating toner, and switch to 'Moisturizing Ion' mode."
    ],
    cta_heading: "Upgrade Your Pore Routine Today for Just $22.74"
  },
  {
    handle: "fsa-hsa-wellness-self-care-budget-guide-migraine-and-phototherapy",
    title: "Smart Year-End Wellness Spending: Why Drug-Free Migraine & Phototherapy Tools Beat Subscriptions",
    category: "Smart Buying Guide",
    tags: "Wellness Investment, Migraine Relief, Red Light Therapy, Cost Per Use, Luma Wellness",
    target_query: "best home wellness devices worth buying red light and migraine relief",
    summary: "Calculate the true cost-per-use of at-home clinical phototherapy and cryo-compression devices compared to recurring med-spa appointments and OTC refills.",
    product_name: "Luma Wellness™ Clinical Collection (35% Off Sitewide)",
    product_vanity: "/wand",
    product_price: "$18.84 – $84.49",
    brand_comparison: "In-Office Med-Spa Sessions ($150/visit)",
    comp_price: "$1,200+/year",
    comp_spec: "Single In-Clinic Session",
    our_spec: "Unlimited Daily At-Home Treatments ($0.10 Cost Per Use)",
    lead: "A single 20-minute LED phototherapy add-on at a dermatology clinic costs $75 to $150. Yet clinical photobiomodulation requires 3 to 5 sessions per week for cumulative cellular regeneration.",
    intro: "Owning calibrated, medical-grade home devices drops your cost-per-treatment to less than $0.11 per session—allowing daily consistency that sporadic spa visits can never match.",
    h2_1: "The Compounding ROI of Daily 5-Minute Protocols",
    body_1: "Just like strength training, mitochondrial ATP stimulation and microcurrent facial toning rely on frequency rather than occasional high-intensity blasts.",
    bullets: [
      "<strong>LumaGlow™ 4-in-1 Wand ($38.99):</strong> Replaces $169 wands and $120 facial lymphatic massages.",
      "<strong>LumaRelief™ 360° Cap ($22.74):</strong> Provides hundreds of drug-free headache recoveries.",
      "<strong>LumaMask™ 7-Color Shield ($84.49):</strong> Full face + neck phototherapy for less than one spa facial."
    ],
    h2_3: "How to Build Your Complete At-Home Recovery Stack",
    steps: [
      "Morning (3 Mins): Depuff eyes and tighten pores with the Cryo-Glow™ Stainless Steel Roller.",
      "Evening (5 Mins): Infuse peptide serum with the LumaGlow™ 4-in-1 Red Light Wand or LumaMask™.",
      "As Needed: Slip on the chilled LumaRelief™ 360° Cap to melt screen fatigue and tension headaches."
    ],
    cta_heading: "Save 35% Sitewide + Free US Shipping with Code PROVOTODAY"
  }
]

def run_trending_content_cycle
  puts "[#{Time.now.iso8601}] ✍️ Checking for unwritten trending product topics (Engine v2.0)..."

  existing_files = Dir[File.join(BLOG_DIR, "*.md")].map { |f| File.basename(f, ".md") }
  unwritten_topics = TRENDING_TOPICS.reject { |t| existing_files.include?(t[:handle]) }

  # If all static topics are written, synthesize a fresh high-intent long-tail guide dynamically!
  if unwritten_topics.empty?
    day_tag = Time.now.strftime("%Y-%m-%d-%H")
    synth_handle = "clinical-buyer-guide-red-light-and-cryo-recovery-#{day_tag}"
    unless existing_files.include?(synth_handle)
      unwritten_topics << {
        handle: synth_handle,
        title: "Clinical Skincare & Migraine Recovery Guide (#{Time.now.strftime('%B %Y')} Edition): Spec Comparison",
        category: "Clinical Roundup",
        tags: "Red Light Therapy, Migraine Cap, Microcurrent, Solawave Alternative, Luma Wellness",
        target_query: "best clinical red light therapy wand and migraine cap comparison #{Time.now.year}",
        summary: "Updated #{Time.now.strftime('%B %Y')} clinical teardown of 630nm red light wands, 7-color LED masks, and 360° cryo-compression caps shipped free from Utah.",
        product_name: "LumaGlow™ 4-in-1 Red Light Wand",
        product_vanity: "/wand",
        product_price: "$38.99 (Reg $89.99)",
        brand_comparison: "Solawave & Omnilux ($169–$395)",
        comp_price: "$169.00 – $395.00",
        comp_spec: "Single-Modality Retail Markup",
        our_spec: "4-in-1 Clinical 630nm LED + 330µA Microcurrent + 107°F Heat + 60-Day Trial",
        lead: "Shoppers comparing at-home phototherapy and cryo-recovery devices in #{Time.now.strftime('%B %Y')} are increasingly looking past celebrity sponsorships and examining raw hardware specifications.",
        intro: "In this updated clinical buyer's guide, we compare wavelength output, irradiance, and total delivered price across our top-rated Utah-shipped wellness devices.",
        h2_1: "Core Specifications That Drive Real Results",
        body_1: "Whether targeting fine lines, hormonal breakouts, or acute tension migraines, clinical efficacy depends on calibrated therapeutic output.",
        bullets: [
          "<strong>630nm Red & 850nm NIR Light:</strong> Maximizes dermal fibroblast ATP energy production.",
          "<strong>350µA Galvanic Microcurrent:</strong> Lifts facial contour and drains submental lymph.",
          "<strong>360° Medical Hydrogel Cryo-Compression:</strong> Calms cranial vasodilation in 90 seconds."
        ],
        h2_3: "How to Claim the 35% Off VIP Launch Bundle",
        steps: [
          "Select your target protocol via our fast-checkout links (/wand, /mask, /caps, /lift, /clean).",
          "Verify code <strong>PROVOTODAY</strong> is applied at checkout for 35% off.",
          "Test at home for 60 days backed by our 100% money-back guarantee."
        ],
        cta_heading: "Shop the #{Time.now.strftime('%B %Y')} Clinical Sale (35% Off Sitewide)"
      }
    end
  end

  if unwritten_topics.empty?
    puts "  ✓ All trending topics up to date!"
    return nil
  end

  csv_header = "Handle,Title,Body (HTML),Author,Tags,Summary,Published\n"
  File.write(CSV_PATH, csv_header) unless File.exist?(CSV_PATH)

  # Publish up to 3 unwritten topics per cycle to rapidly scale search footprint
  published_batch = []
  unwritten_topics.first(3).each do |topic|
    puts "  👉 Drafting trending article: '#{topic[:title]}' (Query: '#{topic[:target_query]}')..."
    html_body = topic[:content] || build_clinical_article_html(topic)

    md_content = <<~MD
      ---
      title: #{topic[:title].to_json}
      handle: #{topic[:handle].to_json}
      author: "Kimberly Harter"
      tags: #{topic[:tags].to_json}
      summary: #{topic[:summary].to_json}
      published_at: #{Time.now.iso8601.to_json}
      ---

      #{html_body}
    MD

    dest_path = File.join(BLOG_DIR, "#{topic[:handle]}.md")
    File.write(dest_path, md_content)
    puts "  ✓ Published to #{dest_path}"

    clean_body = html_body.gsub('"', '""')
    csv_row = %Q("#{topic[:handle]}","#{topic[:title]}","#{clean_body}","Kimberly Harter","#{topic[:tags]}","#{topic[:summary]}",true\n)
    File.open(CSV_PATH, "a") { |f| f.write(csv_row) }

    published_batch << topic
  end

  puts "  ✓ Appended #{published_batch.length} new articles to Shopify import CSV: #{CSV_PATH}"
  published_batch.first
end

if __FILE__ == $0
  new_topic = run_trending_content_cycle
  if new_topic
    puts "\n🎉 Successfully generated trending article batch (lead: #{new_topic[:handle]})"
  end
end
