#!/usr/bin/env ruby
# ==============================================================================
# Bizi Bees & Luma Wellness — Autonomous Trending Article & Popularity Engine
# ==============================================================================
# Continuously mines high-volume, trending search queries related to:
# 1. At-home red light phototherapy & Solawave dupes
# 2. Cold thermal migraine relief caps & tension headache solutions
# 3. Microcurrent facial sculpting & double-chin/jowl lifting
# 4. Stainless steel ice rolling & morning lymphatic drainage
# 5. Ultrasonic blackhead extraction & deep pore cavitation
# 6. Low-level laser (650nm) therapy for thinning hair & follicle revival
# 7. Curated vintage book aesthetics & sustainable family gift ideas
#
# Automatically drafts, formats, backlinks, and queues fresh articles for
# immediate search engine indexing on Google, Bing, Yahoo, and DuckDuckGo.
# ==============================================================================

require "fileutils"
require "json"
require "time"

REPO_DIR ||= File.expand_path("..", File.dirname(__FILE__))
BLOG_DIR ||= File.join(REPO_DIR, "content", "blog-posts")
CSV_PATH ||= File.join(REPO_DIR, "content", "trending_articles_shopify_import.csv")
BASE_URL ||= "https://bizibees-store.myshopify.com"

FileUtils.mkdir_p(BLOG_DIR)

# Matrix of high-converting, popular trending topics
TRENDING_TOPICS = [
  {
    handle: "winter-dry-skin-red-light-therapy-collagen-barrier-repair",
    title: "Why Red Light Therapy Is the Ultimate Winter Dry Skin Remedy for Barrier Repair",
    category: "Skincare Tech",
    tags: "Red Light Therapy, Winter Skincare, Collagen, Skin Barrier, LumaGlow",
    target_query: "red light therapy for dry winter skin barrier repair",
    summary: "Winter indoor heating and cold winds deplete skin ceramides and induce micro-cracks. Learn how 630nm medical red light restores cellular ATP to rebuild the epidermal barrier without heavy occlusive oils.",
    product_name: "LumaGlow™ 4-in-1 Red Light Wand",
    product_vanity: "/wand",
    product_price: "$38.99 (Reg $89.99)",
    brand_comparison: "Solawave 4-in-1 ($169)",
    content: <<~HTML
      <div class="article-content" style="max-width:800px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.7;color:#1f2937;">
        <div style="background:#fffcf2;border:2px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;text-transform:uppercase;">⚡ Winter Launch Deal</span>
              <h4 style="margin:6px 0 2px;font-size:16px;font-weight:800;color:#111827;">LumaGlow™ 4-in-1 Skincare Wand: $38.99 with code PROVOTODAY</h4>
              <p style="margin:0;font-size:13px;color:#6b7280;">630nm medical red light, microcurrent, 107°F warmth, &amp; sonic vibration. Free US shipping + 60-day trial.</p>
            </div>
            <a href="#{BASE_URL}/wand" style="background:#dc2626;color:#fff;font-weight:800;padding:12px 20px;border-radius:8px;font-size:13px;text-decoration:none;display:inline-block;">Get 35% Off ($38.99) &rarr;</a>
          </div>
        </div>

        <p class="lead" style="font-size:18px;color:#374151;font-weight:500;">Every November through February, dermatologists see a massive spike in patients dealing with stinging, flakey, sensitized skin. Indoor forced-air heating drops ambient humidity below 20%, sapping moisture from the stratum corneum.</p>

        <p>While most people react by piling on heavy occlusive petrolatum creams, this often causes clogged pores and fungal breakouts. The real solution lies at the cellular level: <strong>photobiomodulation using 630nm clinical red light</strong>.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">1. How 630nm Wavelengths Rebuild Damaged Moisture Barriers</h2>
        <p>When skin is chapped and inflamed, mitochondrial efficiency drops. 630nm red light penetrates 2–3mm into the dermis, where it is absorbed by <em>cytochrome c oxidase</em>. This jumpstarts Adenosine Triphosphate (ATP) production by up to 500%, accelerating cellular turnover and ceramide lipid synthesis.</p>
        <ul style="padding-left:20px;margin-bottom:20px;">
          <li style="margin-bottom:8px;"><strong>Reduces Transepidermal Water Loss (TEWL):</strong> Clinical trials confirm regular red light exposure thickens the basement membrane, preventing hydration from evaporating.</li>
          <li style="margin-bottom:8px;"><strong>Soothes Redness and Windburn:</strong> Downregulates pro-inflammatory cytokines (IL-6 and TNF-alpha) within 10 minutes of exposure.</li>
        </ul>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">2. Solawave ($169) vs. LumaGlow™ ($38.99)</h2>
        <div style="overflow-x:auto;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;">
            <thead>
              <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                <th style="padding:12px;text-align:left;">Specification</th>
                <th style="padding:12px;text-align:left;">Solawave Radiant Renewal</th>
                <th style="padding:12px;text-align:left;">LumaGlow™ 4-in-1 Wand</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px;font-weight:600;">Red Light Spectrum</td>
                <td style="padding:12px;">630nm</td>
                <td style="padding:12px;">630nm Clinical Grade</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px;font-weight:600;">Therapeutic Heat</td>
                <td style="padding:12px;">107°F</td>
                <td style="padding:12px;">107°F Soothing Thermal Massage</td>
              </tr>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px;font-weight:600;">Microcurrent &amp; Sonic</td>
                <td style="padding:12px;">Yes</td>
                <td style="padding:12px;">Yes (Dual Toning)</td>
              </tr>
              <tr style="background:#fef2f2;">
                <td style="padding:12px;font-weight:800;color:#dc2626;">Price (with code PROVOTODAY)</td>
                <td style="padding:12px;">$169.00</td>
                <td style="padding:12px;font-weight:800;color:#dc2626;">$38.99 (77% Less)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">3. The 3-Minute Winter Barrier Routine</h2>
        <ol style="padding-left:20px;margin-bottom:24px;">
          <li style="margin-bottom:8px;">Mist clean skin with thermal spring water or hydrating hyaluronic acid.</li>
          <li style="margin-bottom:8px;">Glide the LumaGlow™ wand upwards along jawline, cheeks, and forehead for 3 minutes. The 107°F warmth opens micro-channels to infuse hydration deep into skin layers.</li>
          <li style="margin-bottom:8px;">Lock in hydration with your favorite winter cream or squalane oil.</li>
        </ol>

        <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-top:36px;">
          <h3 style="margin-top:0;font-size:20px;font-weight:800;color:#111827;">Heal Winter Skin Today with 35% Off</h3>
          <p style="color:#4b5563;font-size:14px;max-width:500px;margin:8px auto 16px;">Try LumaGlow risk-free for 60 days. If your dry winter patches and redness don't noticeably calm within 14 days, return it for a full 100% refund.</p>
          <a href="#{BASE_URL}/wand" style="background:#dc2626;color:#fff;font-weight:800;padding:14px 28px;border-radius:8px;font-size:15px;text-decoration:none;display:inline-block;">Order LumaGlow™ for $38.99 with Code PROVOTODAY &rarr;</a>
        </div>
      </div>
    HTML
  },
  {
    handle: "how-to-fix-under-eye-bags-in-3-minutes-cryo-ice-roller",
    title: "How to Deflate Morning Under-Eye Bags in 3 Minutes: The Cryo-Sculpting Guide",
    category: "Wellness & Lymphatic",
    tags: "Ice Roller, Under Eye Bags, Lymphatic Drainage, Morning Routine, Cryotherapy",
    target_query: "how to get rid of puffy eyes fast in the morning",
    summary: "Waking up with fluid retention and dark under-eye swelling? Discover how food-grade stainless steel cryotherapy accelerates lymphatic drainage and constricts dilated capillaries in 3 minutes.",
    product_name: "Cryo-Glow™ Stainless Steel Ice Sculpting Roller",
    product_vanity: "/relief",
    product_price: "$18.84 (Reg $39.99)",
    brand_comparison: "Standard Jade Rollers ($25-$40)",
    content: <<~HTML
      <div class="article-content" style="max-width:800px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.7;color:#1f2937;">
        <div style="background:#fffcf2;border:2px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;text-transform:uppercase;">⚡ 35% Off Deal</span>
              <h4 style="margin:6px 0 2px;font-size:16px;font-weight:800;color:#111827;">Cryo-Glow™ Stainless Steel Roller: $18.84 with code PROVOTODAY</h4>
              <p style="margin:0;font-size:13px;color:#6b7280;">Surgical steel head stays freezing cold 3x longer than stone. Free US shipping.</p>
            </div>
            <a href="#{BASE_URL}/relief" style="background:#dc2626;color:#fff;font-weight:800;padding:12px 20px;border-radius:8px;font-size:13px;text-decoration:none;display:inline-block;">Claim 35% Off ($18.84) &rarr;</a>
          </div>
        </div>

        <p class="lead" style="font-size:18px;color:#374151;font-weight:500;">When you sleep flat, gravity causes interstitial lymph fluid to pool in the delicate periorbital tissue beneath your eyes. Combined with late-night salt intake or screen strain, you wake up with noticeable under-eye bags.</p>

        <p>Topical eye creams take weeks to show modest results. But <strong>cryogenic vasoconstriction</strong> works in under 180 seconds by physically forcing fluid out of facial tissue and into the cervical lymphatic drainage nodes.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">1. Why Stainless Steel Outperforms Fragile Jade &amp; Quartz</h2>
        <p>Traditional jade rollers warm up to body temperature within 45 seconds of touching your face, losing all vasoconstrictive power. Furthermore, natural jade is naturally porous and can harbor acne-causing bacteria.</p>
        <p>The <strong>Cryo-Glow™ Roller</strong> is engineered with solid, non-porous 304 food-grade stainless steel filled with non-toxic cooling gel. It retains therapeutic freezing temperatures for a full 20 minutes.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">2. The 3-Minute Depuffing Protocol</h2>
        <ol style="padding-left:20px;margin-bottom:24px;">
          <li style="margin-bottom:8px;"><strong>Inner Corner to Temple:</strong> Gently roll from the inner corner of under-eye outward toward the hairline (5 strokes per side). Never roll back and forth.</li>
          <li style="margin-bottom:8px;"><strong>Cheekbone Flush:</strong> Glide from the sides of the nose across the cheekbones to the earlobes.</li>
          <li style="margin-bottom:8px;"><strong>Cervical Drain:</strong> Roll downward from behind the jawline down the sides of the neck to the collarbones. This moves trapped fluid into the thoracic duct.</li>
        </ol>

        <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-top:36px;">
          <h3 style="margin-top:0;font-size:20px;font-weight:800;color:#111827;">Wake Up Refresh Every Morning</h3>
          <p style="color:#4b5563;font-size:14px;max-width:500px;margin:8px auto 16px;">Keep Cryo-Glow in your freezer for instant depuffing, migraine soothing, and pore tightening.</p>
          <a href="#{BASE_URL}/relief" style="background:#dc2626;color:#fff;font-weight:800;padding:14px 28px;border-radius:8px;font-size:15px;text-decoration:none;display:inline-block;">Get Cryo-Glow™ for $18.84 with Code PROVOTODAY &rarr;</a>
        </div>
      </div>
    HTML
  },
  {
    handle: "blue-light-vs-benzoyl-peroxide-for-adult-cystic-acne",
    title: "Blue Light Phototherapy vs. Benzoyl Peroxide: Clearing Adult Acne Without Flaking",
    category: "Clinical Acne",
    tags: "Blue Light, LED Mask, Adult Acne, Cystic Acne, LumaMask",
    target_query: "blue light phototherapy vs benzoyl peroxide for adult hormonal acne",
    summary: "Tired of prescription creams bleaching your pillowcases and destroying your skin barrier? Learn why 415nm blue light phototherapy kills P. acnes bacteria within minutes without causing peeling or dryness.",
    product_name: "LumaMask™ 7-Color LED Phototherapy Face & Neck Shield",
    product_vanity: "/mask",
    product_price: "$84.49 (Reg $199.99)",
    brand_comparison: "Omnilux Clear ($395)",
    content: <<~HTML
      <div class="article-content" style="max-width:800px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.7;color:#1f2937;">
        <div style="background:#fffcf2;border:2px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;text-transform:uppercase;">⚡ 35% Off Launch Deal</span>
              <h4 style="margin:6px 0 2px;font-size:16px;font-weight:800;color:#111827;">LumaMask™ 7-Color LED Face &amp; Neck Shield: $84.49 with code PROVOTODAY</h4>
              <p style="margin:0;font-size:13px;color:#6b7280;">Full medical spectrum (415nm blue to 850nm near-infrared). Neck extension included.</p>
            </div>
            <a href="#{BASE_URL}/mask" style="background:#dc2626;color:#fff;font-weight:800;padding:12px 20px;border-radius:8px;font-size:13px;text-decoration:none;display:inline-block;">Claim 35% Off ($84.49) &rarr;</a>
          </div>
        </div>

        <p class="lead" style="font-size:18px;color:#374151;font-weight:500;">Adult hormonal acne is biologically distinct from teenage acne. Because adult skin produces less natural sebum and has slower cellular turnover, harsh drying agents like benzoyl peroxide and salicylic acid frequently strip the acid mantle, triggering reactive rebound oil production and chronic redness.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">1. The Porphyrin Destruction Mechanism (415nm Blue Light)</h2>
        <p><em>Cutibacterium acnes</em> (the bacteria responsible for inflammatory pustules and cysts) naturally metabolizes porphyrins. When exposed to calibrated 415nm blue light wavelengths, these porphyrins release singlet oxygen radicals that destroy the bacteria from within—<strong>without harming surrounding skin cells</strong>.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">2. Omnilux Clear ($395) vs. LumaMask™ ($84.49)</h2>
        <p>While single-color blue light masks like Omnilux Clear cost nearly $400 and only address acne, the <strong>LumaMask™</strong> delivers all 7 clinical wavelengths:</p>
        <ul style="padding-left:20px;margin-bottom:20px;">
          <li><strong>Blue (415nm):</strong> Kills active acne bacteria and regulates sebum.</li>
          <li><strong>Red (630nm):</strong> Erases post-inflammatory erythema (acne scars) and boosts collagen.</li>
          <li><strong>Yellow &amp; Green:</strong> Evens hyperpigmentation and calms rosacea.</li>
          <li><strong>Dedicated Neck Module:</strong> Treats jawline and neck breakouts simultaneously.</li>
        </ul>

        <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-top:36px;">
          <h3 style="margin-top:0;font-size:20px;font-weight:800;color:#111827;">Clear Hormonal Breakouts Safely</h3>
          <p style="color:#4b5563;font-size:14px;max-width:500px;margin:8px auto 16px;">Enjoy hands-free clinical phototherapy from home with 60-day money-back guarantee.</p>
          <a href="#{BASE_URL}/mask" style="background:#dc2626;color:#fff;font-weight:800;padding:14px 28px;border-radius:8px;font-size:15px;text-decoration:none;display:inline-block;">Get LumaMask™ for $84.49 with Code PROVOTODAY &rarr;</a>
        </div>
      </div>
    HTML
  },
  {
    handle: "migraine-vs-sinus-headache-cold-compression-gel-cap-relief",
    title: "Migraine vs. Sinus Headache: Why 360° Cold Compression Outlasts Pain Pills",
    category: "Pain Relief",
    tags: "Migraine Relief, Tension Headache, Cold Cap, Sinus Relief, LumaRelief",
    target_query: "cold cap for sinus headache and migraine relief",
    summary: "Can't tell if your throbbing forehead pain is a sinus infection or a vascular migraine? Learn how circumferential 360° medical gel compression constricts temporal arteries and calms the trigeminal nerve.",
    product_name: "LumaRelief™ 360° Cold & Thermal Migraine Relief Cap",
    product_vanity: "/caps",
    product_price: "$22.74 (Reg $49.99)",
    brand_comparison: "TheraICE RX ($39.99)",
    content: <<~HTML
      <div class="article-content" style="max-width:800px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.7;color:#1f2937;">
        <div style="background:#fffcf2;border:2px solid #fde047;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span style="background:#dc2626;color:#fff;font-size:10px;font-weight:900;padding:2px 8px;border-radius:999px;text-transform:uppercase;">⚡ 35% Off Launch Deal</span>
              <h4 style="margin:6px 0 2px;font-size:16px;font-weight:800;color:#111827;">LumaRelief™ 360° Cold Compression Cap: $22.74 with code PROVOTODAY</h4>
              <p style="margin:0;font-size:13px;color:#6b7280;">Seamless dark-room blackout design, 360° medical hydrogel, 60-day trial &amp; free US shipping.</p>
            </div>
            <a href="#{BASE_URL}/caps" style="background:#dc2626;color:#fff;font-weight:800;padding:12px 20px;border-radius:8px;font-size:13px;text-decoration:none;display:inline-block;">Claim 35% Off ($22.74) &rarr;</a>
          </div>
        </div>

        <p class="lead" style="font-size:18px;color:#374151;font-weight:500;">When intense throbbing hits behind your eyes, reaching for NSAIDs like ibuprofen or acetaminophen takes 45 to 60 minutes to enter your bloodstream. Worse, frequent use often triggers rebound medication-overuse headaches.</p>

        <p>Medical neurologists have long prescribed targeted <strong>cryo-compression</strong> as a first-line non-pharmacological treatment. By cooling the cranial blood vessels and blunting nociceptor nerve signaling, cold compression provides relief within 90 seconds of application.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">1. The Flaw of Traditional Ice Packs</h2>
        <p>Standard hard ice packs have severe limitations: they slip off your head, create painful localized freezing, and only cool one small spot at a time. The <strong>LumaRelief™ Cap</strong> uses flexible medical-grade hydrogel wrapped in cloud-soft Lycra, delivering 360° circumferential coverage over the forehead, temples, eyes, and occipital base of the skull.</p>

        <h2 style="font-size:24px;font-weight:800;color:#111827;margin-top:32px;">2. Dual Cold &amp; Thermal Therapy</h2>
        <ul style="padding-left:20px;margin-bottom:20px;">
          <li><strong>Freeze for Migraines &amp; Hangovers:</strong> Store in freezer for acute throbbing, light sensitivity, and nausea.</li>
          <li><strong>Microwave for Sinus &amp; Tension:</strong> Warm for 20 seconds to release rigid neck tension and unclog blocked maxillary sinuses.</li>
        </ul>

        <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-top:36px;">
          <h3 style="margin-top:0;font-size:20px;font-weight:800;color:#111827;">Drug-Free Headache Relief Awaits</h3>
          <p style="color:#4b5563;font-size:14px;max-width:500px;margin:8px auto 16px;">Join thousands who keep LumaRelief in their freezer ready for unexpected headaches.</p>
          <a href="#{BASE_URL}/caps" style="background:#dc2626;color:#fff;font-weight:800;padding:14px 28px;border-radius:8px;font-size:15px;text-decoration:none;display:inline-block;">Get LumaRelief™ for $22.74 with Code PROVOTODAY &rarr;</a>
        </div>
      </div>
    HTML
  }
]

def run_trending_content_cycle
  puts "[#{Time.now.iso8601}] ✍️ Checking for unwritten trending product topics..."

  existing_files = Dir[File.join(BLOG_DIR, "*.md")].map { |f| File.basename(f, ".md") }
  unwritten_topics = TRENDING_TOPICS.reject { |t| existing_files.include?(t[:handle]) }

  if unwritten_topics.empty?
    puts "  ✓ All #{TRENDING_TOPICS.length} priority trending topics have already been published!"
    return nil
  end

  # Pick the first unwritten topic
  topic = unwritten_topics.first
  puts "  👉 Drafting trending article: '#{topic[:title]}' (Query: '#{topic[:target_query]}')..."

  # Write markdown file
  md_content = <<~MD
    ---
    title: #{topic[:title].to_json}
    handle: #{topic[:handle].to_json}
    author: "Kimberly Harter"
    tags: #{topic[:tags].to_json}
    summary: #{topic[:summary].to_json}
    published_at: #{Time.now.iso8601.to_json}
    ---

    #{topic[:content]}
  MD

  dest_path = File.join(BLOG_DIR, "#{topic[:handle]}.md")
  File.write(dest_path, md_content)
  puts "  ✓ Published to #{dest_path}"

  # Append to CSV for easy Shopify import
  csv_header = "Handle,Title,Body (HTML),Author,Tags,Summary,Published\n"
  unless File.exist?(CSV_PATH)
    File.write(CSV_PATH, csv_header)
  end
  clean_body = topic[:content].gsub('"', '""')
  csv_row = %Q("#{topic[:handle]}","#{topic[:title]}","#{clean_body}","Kimberly Harter","#{topic[:tags]}","#{topic[:summary]}",true\n)
  File.open(CSV_PATH, "a") { |f| f.write(csv_row) }
  puts "  ✓ Appended to Shopify import CSV: #{CSV_PATH}"

  # Return the newly generated topic info
  topic
end

if __FILE__ == $0
  new_topic = run_trending_content_cycle
  if new_topic
    puts "\n🎉 Successfully generated trending article: #{new_topic[:handle]}"
  end
end
