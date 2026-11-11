export interface StoreProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  compareAtPrice: number;
  tag: string;
  description: string;
  specs: string;
}

export interface StoreTestimonial {
  quote: string;
  author: string;
  role: string;
  location: string;
  verifiedProduct: string;
}

export interface StoreDefinition {
  id: string;
  name: string;
  tagline: string;
  niche: string;
  domain: string;
  adminUrl: string;
  accentColor: string;
  secondaryColor: string;
  themeStyle: "warm-editorial" | "clinical-precision" | "obsidian-luxury" | "botanical-craft" | "athletic-minimal";
  shippingHub: string;
  hero: string;
  soloPrice: number;
  bundlePrice: number;
  compareAtPrice: number;
  freeGift: string;
  freeGiftValue: number;
  margin: string;
  revenue24h: number;
  orders24h: number;
  aov: number;
  conversionRate: number;
  seoArticlesCount: number;
  heroSpecs: string[];
  products: StoreProduct[];
  testimonial: StoreTestimonial;
}

export interface CartItem {
  productId: string;
  storeId: string;
  title: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  isVipBundle?: boolean;
}

export interface CartSummary {
  subtotal: number;
  shippingCost: number;
  freeShippingUnlocked: boolean;
  amountToFreeShipping: number;
  vipGiftUnlocked: boolean;
  unlockedGiftTitle: string | null;
  total: number;
  itemCount: number;
}

export const FREE_SHIPPING_THRESHOLD = 35;

export function calculateBundleSavings(soloPrice: number, bundlePrice: number, freeGiftValue: number): {
  totalValue: number;
  savingsAmount: number;
  savingsPercent: number;
} {
  const totalValue = Number((soloPrice * 2 + freeGiftValue).toFixed(2));
  const savingsAmount = Math.max(0, Number((totalValue - bundlePrice).toFixed(2)));
  const savingsPercent = totalValue > 0 ? Math.round((savingsAmount / totalValue) * 100) : 0;
  return { totalValue, savingsAmount, savingsPercent };
}

export function calculateCartSummary(items: CartItem[], store: StoreDefinition): CartSummary {
  const subtotal = Number(
    items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0).toFixed(2)
  );
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const hasVipBundle = items.some((i) => i.isVipBundle);
  const vipGiftUnlocked = hasVipBundle || subtotal >= store.bundlePrice;
  const freeShippingUnlocked = subtotal >= FREE_SHIPPING_THRESHOLD || hasVipBundle;
  const amountToFreeShipping = Math.max(0, Number((FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)));
  const shippingCost = itemCount === 0 || freeShippingUnlocked ? 0 : 5.99;
  const total = Number((subtotal + shippingCost).toFixed(2));

  return {
    subtotal,
    shippingCost,
    freeShippingUnlocked,
    amountToFreeShipping,
    vipGiftUnlocked,
    unlockedGiftTitle: vipGiftUnlocked ? store.freeGift : null,
    total,
    itemCount,
  };
}

export const INITIAL_STORES: StoreDefinition[] = [
  {
    id: "bizi-bees",
    name: "Bizi Bees Boutique",
    tagline: "Hand-Wrapped Blind Date Books & Tactile Reading Rituals",
    niche: "Curated Vintage Books & Cozy Gifts",
    domain: "bizibees-store.myshopify.com",
    adminUrl: "/stores/bizi-bees",
    accentColor: "#D97706",
    secondaryColor: "#FDE68A",
    themeStyle: "warm-editorial",
    shippingHub: "Salt Lake City, UT Artisanal Dispatch",
    hero: "Blind Date with a Book & Cozy Evening Crate",
    soloPrice: 14.99,
    bundlePrice: 38.00,
    compareAtPrice: 64.00,
    freeGift: "Solid Brass Honeybee Bookmark ($12 Value)",
    freeGiftValue: 12,
    margin: "84.0%",
    revenue24h: 2140.30,
    orders24h: 46,
    aov: 46.53,
    conversionRate: 3.85,
    seoArticlesCount: 26,
    heroSpecs: [
      "Hand-wrapped in heavyweight 80lb archival kraft paper with pressed dried botanicals",
      "Stamped with a genuine gold beeswax seal and 4 handwritten genre clue annotations",
      "Includes organic chamomile honey tea sachet, wooden honey dipper, and annotation tabs"
    ],
    products: [
      {
        id: "bb-1",
        title: "Blind Date with a Book — Cozy Mystery Edition",
        category: "Mystery Crate",
        price: 14.99,
        compareAtPrice: 24.00,
        tag: "Bestseller",
        description: "Wrapped in vintage kraft paper with wax seal, dried lavender sprig, and 4 genre clues.",
        specs: "320–400 pages · Archival Kraft Wrap · Wax Sealed"
      },
      {
        id: "bb-2",
        title: "Rainy Sunday VIP Reading Crate (2 Books + Tea + Candle)",
        category: "Curated Crate",
        price: 38.00,
        compareAtPrice: 64.00,
        tag: "VIP Bundle",
        description: "Two hand-selected blind date novels paired with a 4oz amber glass soy candle and raw honey sticks.",
        specs: "2 Wrapped Books · 4oz Soy Candle · Brass Bookmark Included"
      },
      {
        id: "bb-3",
        title: "Victorian Gothic & Dark Academia Collector Box",
        category: "Genre Box",
        price: 29.00,
        compareAtPrice: 42.00,
        tag: "Limited Run",
        description: "Atmospheric literary fiction paired with black Assam tea leaves and translucent vellum page flags.",
        specs: "Hardcover Edition · Vellum Tabs · Black Wax Seal"
      },
      {
        id: "bb-4",
        title: "Heirloom Solid Brass Honeybee Page Clip & Journal Set",
        category: "Reading Hardware",
        price: 22.00,
        compareAtPrice: 32.00,
        tag: "In Stock",
        description: "Precision-cast solid brass honeybee clip paired with a linen-bound reading log for 50 book reviews.",
        specs: "100% Solid Brass · 160gsm Acid-Free Linen Paper"
      }
    ],
    testimonial: {
      quote: "Unwrapping the wax seal with a cup of tea turned my Sunday evening into a ritual. Both mystery picks were 5-star reads I never would have found on an algorithm.",
      author: "Clara Vance",
      role: "Literary Archivist",
      location: "Portland, OR",
      verifiedProduct: "Rainy Sunday VIP Reading Crate"
    }
  },
  {
    id: "ember-oak",
    name: "Ember & Oak™ Reserve",
    tagline: "Kiln-Seasoned Spanish Cedar Humidors & Aficionado Hardware",
    niche: "Luxury Cigars, Briar Pipes & Humidors",
    domain: "ember-oak.myshopify.com",
    adminUrl: "/stores/ember-oak",
    accentColor: "#B45309",
    secondaryColor: "#FCD34D",
    themeStyle: "obsidian-luxury",
    shippingHub: "Provo, UT Bonded Hardware Vault",
    hero: "Spanish Cedar Humidor & Aficionado Torch Kit",
    soloPrice: 48.00,
    bundlePrice: 78.00,
    compareAtPrice: 128.00,
    freeGift: "Cut-Crystal Cigar & Pipe Rest ($24 Value)",
    freeGiftValue: 24,
    margin: "82.5%",
    revenue24h: 2496.00,
    orders24h: 34,
    aov: 73.41,
    conversionRate: 3.18,
    seoArticlesCount: 15,
    heroSpecs: [
      "Lined with 5mm kiln-dried authentic Spanish cedar for optimal 68–72% relative humidity retention",
      "Flush-mounted brass analog hygrometer and magnetic hydro-gel humidifier bar included",
      "Triple-jet windproof butane torch lighter and surgical-grade stainless steel V-cutter"
    ],
    products: [
      {
        id: "eo-1",
        title: "50-Count Heritage Spanish Cedar Desktop Humidor",
        category: "Humidors",
        price: 48.00,
        compareAtPrice: 79.00,
        tag: "Flagship",
        description: "Hand-rubbed walnut Burl veneer exterior with airtight quadrant brass hinges and cedar divider.",
        specs: "50-Capacity · Spanish Cedar Lining · Analog Hygrometer"
      },
      {
        id: "eo-2",
        title: "Aficionado Reserve Lounge Suite (Humidor + Torch + Cutter)",
        category: "Reserve Bundle",
        price: 78.00,
        compareAtPrice: 128.00,
        tag: "VIP Bundle",
        description: "Complete desktop humidor paired with triple-jet torch, guillotine cutter, and crystal ash cradle.",
        specs: "Full 4-Piece Kit · Cut-Crystal Rest Unlocked"
      },
      {
        id: "eo-3",
        title: "Grecian Briarwood Bent Billiard Pipe & Tamper Kit",
        category: "Briar Pipes",
        price: 42.00,
        compareAtPrice: 65.00,
        tag: "Hand-Carved",
        description: "Carved from aged Mediterranean plateaux briar with vulcanite stem and leather pipe pouch.",
        specs: "Aged Grecian Briar · 9mm Filter Ready · Czech Tool"
      },
      {
        id: "eo-4",
        title: "Waterproof 15-Count Carbon Travel Humidor Case",
        category: "Travel Gear",
        price: 34.00,
        compareAtPrice: 52.00,
        tag: "In Stock",
        description: "Crushproof ABS shell with custom-moldedウレタン foam cradles and built-in purge valve.",
        specs: "IP67 Watertight · 15-Count Foam Trays"
      }
    ],
    testimonial: {
      quote: "Held a rock-steady 70% RH within 24 hours of seasoning. The cedar aroma and quadrant hinge seal rival humidors I have paid $300+ for.",
      author: "Marcus Sterling",
      role: "Private Club Sommelier",
      location: "Chicago, IL",
      verifiedProduct: "Aficionado Reserve Lounge Suite"
    }
  },
  {
    id: "luma-clinical",
    name: "Luma Clinical™",
    tagline: "630nm Red Light Phototherapy & Microcurrent Derm-Tech",
    niche: "Clinical Derm-Tech & Phototherapy",
    domain: "luma-clinical.myshopify.com",
    adminUrl: "/stores/luma-clinical",
    accentColor: "#0EA5E9",
    secondaryColor: "#7DD3FC",
    themeStyle: "clinical-precision",
    shippingHub: "Provo, UT Clinical Logistics Hub",
    hero: "LumaGlow™ QuadWave Pro 4-in-1 Wand",
    soloPrice: 38.99,
    bundlePrice: 59.99,
    compareAtPrice: 112.00,
    freeGift: "Full-Size Activating Peptide Serum ($24 Value)",
    freeGiftValue: 24,
    margin: "78.7%",
    revenue24h: 3842.50,
    orders24h: 62,
    aov: 61.98,
    conversionRate: 3.42,
    seoArticlesCount: 18,
    heroSpecs: [
      "Clinical 630nm Red Light + 850nm Near-Infrared LED array for dermal collagen stimulation",
      "300µA gentle galvanic microcurrent sculpts jawline and cheekbones in 5 minutes daily",
      "42°C therapeutic thermal massage head rotates 90° for lymphatic under-eye drainage"
    ],
    products: [
      {
        id: "lc-1",
        title: "LumaGlow™ QuadWave Pro 4-in-1 Phototherapy Wand",
        category: "LED Devices",
        price: 38.99,
        compareAtPrice: 74.00,
        tag: "Clinical Hero",
        description: "Combines 630nm red light, microcurrent toning, sonic vibration, and 42°C therapeutic warmth.",
        specs: "630nm + 415nm LED · 300µA Microcurrent · USB-C"
      },
      {
        id: "lc-2",
        title: "Complete Sculpt & Glow Clinical System (Wand + 2x Serums)",
        category: "Clinical System",
        price: 59.99,
        compareAtPrice: 112.00,
        tag: "VIP Bundle",
        description: "QuadWave Pro Wand paired with our conductive copper-peptide serum for 3.2x deeper current conductivity.",
        specs: "Wand + 50ml Peptide Serum + Travel Charging Dock"
      },
      {
        id: "lc-3",
        title: "LumaNeck™ Triple-Action LED Cervical Sculptor",
        category: "Neck & Décolleté",
        price: 44.00,
        compareAtPrice: 79.00,
        tag: "In Stock",
        description: "Ergonomic dolphin-tail contour engineered to target horizontal tech-neck lines and jawline laxity.",
        specs: "3 Wavelength Modes · 45°C Thermal Lift"
      },
      {
        id: "lc-4",
        title: "CryoContour™ Surgical Stainless Facial Sculpting Spoons",
        category: "Cryo Recovery",
        price: 24.00,
        compareAtPrice: 38.00,
        tag: "In Stock",
        description: "Medical-grade 316L cryo-fluid globes that constrict puffiness and calm post-LED redness in 90 seconds.",
        specs: "316L Surgical Steel · Non-Freezing Cryo Gel Core"
      }
    ],
    testimonial: {
      quote: "After 3 weeks of using the QuadWave Wand with the conductive peptide serum for 5 minutes every morning, my under-eye puffiness and nasolabial folds are visibly firmer.",
      author: "Dr. Elena Rostova",
      role: "Aesthetic Nurse Practitioner",
      location: "Scottsdale, AZ",
      verifiedProduct: "Complete Sculpt & Glow Clinical System"
    }
  },
  {
    id: "luma-relief",
    name: "Luma Relief™",
    tagline: "360° Medical-Grade Hydrogel Cold Compression & Sinus Recovery",
    niche: "Migraine & Tension Recovery",
    domain: "luma-relief.myshopify.com",
    adminUrl: "/stores/luma-relief",
    accentColor: "#8B5CF6",
    secondaryColor: "#C4B5FD",
    themeStyle: "clinical-precision",
    shippingHub: "Salt Lake City, UT Cold-Chain Hub",
    hero: "LumaRelief™ 360° Cold Compression Cap",
    soloPrice: 22.74,
    bundlePrice: 32.49,
    compareAtPrice: 58.00,
    freeGift: "Herbal Sinus Acupressure Roller ($18 Value)",
    freeGiftValue: 18,
    margin: "79.2%",
    revenue24h: 2914.20,
    orders24h: 76,
    aov: 38.34,
    conversionRate: 4.10,
    seoArticlesCount: 14,
    heroSpecs: [
      "Solid-state medical hydrogel stays flexible at -18°C to contour temples, occiput, and sinuses",
      "100% light-blocking V-nose cutout eliminates photophobia without pressing on eyelids",
      "Dual-therapy capability: chill 45 minutes for vascular constriction or microwave 20s for tension"
    ],
    products: [
      {
        id: "lr-1",
        title: "LumaRelief™ 360° Deep-Cold Migraine Compression Cap",
        category: "Cold Therapy",
        price: 22.74,
        compareAtPrice: 39.00,
        tag: "Bestseller",
        description: "Slip-on 360° cranial hydrogel sleeve delivering targeted occipital and temple cold compression.",
        specs: "900g Solid Hydrogel · 100% Blackout Fit"
      },
      {
        id: "lr-2",
        title: "2-Cap Continuous Rotation Recovery Bundle",
        category: "Recovery System",
        price: 32.49,
        compareAtPrice: 58.00,
        tag: "VIP Bundle",
        description: "Keep one cap chilled in the freezer while wearing the second for uninterrupted relief during severe episodes.",
        specs: "2x 360° Caps + Free Herbal Sinus Roller"
      },
      {
        id: "lr-3",
        title: "LumaPulse™ Infrared Cervical Neck Traction Stretcher",
        category: "Cervical Care",
        price: 34.00,
        compareAtPrice: 54.00,
        tag: "In Stock",
        description: "26° cervical curve cradle with gentle suboccipital trigger-point nodes to release base-of-skull tension.",
        specs: "High-Density EVA · Suboccipital Acupressure Nodes"
      },
      {
        id: "lr-4",
        title: "Peppermint & Feverfew Temple Acupressure Roll-On Duo",
        category: "Topical Botanicals",
        price: 18.00,
        compareAtPrice: 28.00,
        tag: "In Stock",
        description: "Cooling stainless steel rollerball infused with clinical-grade menthol, peppermint, and Roman chamomile.",
        specs: "2x 15ml Steel Rollerballs · Cold-Pressed Oils"
      }
    ],
    testimonial: {
      quote: "Having the two-cap rotation bundle means I never run out of cold compression mid-migraine. The blackout fit blocks 100% of screen glare.",
      author: "Hannah Lindqvist",
      role: "Senior Software Architect",
      location: "Seattle, WA",
      verifiedProduct: "2-Cap Continuous Rotation Recovery Bundle"
    }
  },
  {
    id: "fizz-lab",
    name: "Fizz Lab™ Soda",
    tagline: "Utah Dirty Soda Craft Syrups, Coconut Creams & Cold Foam Kits",
    niche: "Utah Dirty Soda Bar Kits",
    domain: "fizz-lab.myshopify.com",
    adminUrl: "/stores/fizz-lab",
    accentColor: "#F43F5E",
    secondaryColor: "#FDA4AF",
    themeStyle: "warm-editorial",
    shippingHub: "Provo, UT Beverage Co-Packer",
    hero: "Custom At-Home Dirty Soda Bar Kit",
    soloPrice: 32.00,
    bundlePrice: 48.00,
    compareAtPrice: 78.00,
    freeGift: "High-Speed Electric Cream Frother ($16 Value)",
    freeGiftValue: 16,
    margin: "76.0%",
    revenue24h: 1845.00,
    orders24h: 41,
    aov: 45.00,
    conversionRate: 2.85,
    seoArticlesCount: 9,
    heroSpecs: [
      "Includes 3 full-size 375ml glass syrup bottles with precision gold bar pumps (0.25oz per pump)",
      "Shelf-stable Utah Sweetened Coconut Cream + Dehydrated Persian Lime Wheels",
      "Makes 45+ drive-thru style dirty sodas at home for under $0.75 per 32oz pebble-ice cup"
    ],
    products: [
      {
        id: "fl-1",
        title: "Provo Classic Dirty Soda Starter Kit (Coconut + Lime + Vanilla)",
        category: "Soda Kits",
        price: 32.00,
        compareAtPrice: 46.00,
        tag: "Utah Favorite",
        description: "Everything required to turn Dr Pepper or Cola into the signature Utah Coconut-Lime-Cream dirty soda.",
        specs: "3x 375ml Syrups · 3 Gold Pumps · Recipe Deck"
      },
      {
        id: "fl-2",
        title: "Ultimate Party Soda Bar VIP Bundle (6 Syrups + Frother)",
        category: "Party Bundle",
        price: 48.00,
        compareAtPrice: 78.00,
        tag: "VIP Bundle",
        description: "Six signature syrups (Coconut, Mango, Raspberry Puree, Peach, Vanilla Bean, Blue Curacao) + Electric Frother.",
        specs: "6x Bottles · 6 Pumps · Free High-Speed Frother"
      },
      {
        id: "fl-3",
        title: "Countertop Silicone Mini Pebble Ice Cube Tray (Set of 3)",
        category: "Barware",
        price: 19.00,
        compareAtPrice: 28.00,
        tag: "In Stock",
        description: "Produces 480 chewable sonic-style micro-nugget ice pellets per batch for authentic soda shop texture.",
        specs: "BPA-Free Platinum Silicone · Stackable Lid"
      },
      {
        id: "fl-4",
        title: "Double-Wall 32oz Insulated Tumbler with Wide Boba/Fizz Straw",
        category: "Drinkware",
        price: 24.00,
        compareAtPrice: 35.00,
        tag: "In Stock",
        description: "Keeps pebble ice intact for 18 hours with cup-holder friendly tapered base.",
        specs: "32oz 18/8 Stainless · Leakproof Flip Straw"
      }
    ],
    testimonial: {
      quote: "Saved our family $60 a week on soda drive-thru runs. Two pumps of coconut, one pump vanilla, a squeeze of lime, and the cold foam frother makes it identical to Provo shops.",
      author: "Brianna Callister",
      role: "Event & Hospitality Host",
      location: "Draper, UT",
      verifiedProduct: "Ultimate Party Soda Bar VIP Bundle"
    }
  },
  {
    id: "crave-lab",
    name: "Crave Lab™ Chocolates",
    tagline: "Single-Origin Belgian Couverture & Artisanal Tasting Bento Boxes",
    niche: "Artisanal Belgian Confections",
    domain: "crave-lab.myshopify.com",
    adminUrl: "/stores/crave-lab",
    accentColor: "#D97706",
    secondaryColor: "#FDE68A",
    themeStyle: "obsidian-luxury",
    shippingHub: "Salt Lake City, UT Climate-Controlled Vault",
    hero: "Custom 4-Bar Chocolate Bento Box",
    soloPrice: 24.00,
    bundlePrice: 38.00,
    compareAtPrice: 62.00,
    freeGift: "Smoked Sea Salt Dark Tasting Bar ($9 Value)",
    freeGiftValue: 9,
    margin: "83.6%",
    revenue24h: 1490.75,
    orders24h: 33,
    aov: 45.17,
    conversionRate: 3.12,
    seoArticlesCount: 8,
    heroSpecs: [
      "Tempered from sustainable Antwerp 70% dark and 42% caramelized milk Belgian couverture",
      "Packaged in a magnetic-clasp Japanese-style linen bento box with gold foil tasting notes",
      "Ships with insulated thermal cold-packs guaranteed against melting to all 50 states"
    ],
    products: [
      {
        id: "cl-1",
        title: "4-Bar Sommelier Chocolate Bento Box",
        category: "Tasting Boxes",
        price: 24.00,
        compareAtPrice: 36.00,
        tag: "Signature",
        description: "Includes Pistachio Kataifi Crunch, Burnt Honey Hazelnut, Espresso Nibs, and Raspberry Rose Dark.",
        specs: "4x 85g Bars · Magnetic Bento Presentation Box"
      },
      {
        id: "cl-2",
        title: "8-Bar Grand Connoisseur Tasting Flight + Free Sea Salt Bar",
        category: "Gift Flights",
        price: 38.00,
        compareAtPrice: 62.00,
        tag: "VIP Bundle",
        description: "Double tasting flight across dark, milk, and ruby couverture plus our Smoked Maldon Sea Salt Bar.",
        specs: "9 Total Bars · Gold Tasting Menu · Thermal Ship"
      },
      {
        id: "cl-3",
        title: "Dubai-Style Roasted Pistachio & Crispy Kataifi Bar (2-Pack)",
        category: "Limited Release",
        price: 22.00,
        compareAtPrice: 30.00,
        tag: "Trending",
        description: "Thick Belgian milk chocolate shell filled with stone-ground Bronte pistachio cream and toasted kataifi pastry.",
        specs: "2x 110g Thick-Mold Bars · Small-Batch Tempered"
      },
      {
        id: "cl-4",
        title: "72% Ceremonial Drinking Hot Chocolate Shavings Tin",
        category: "Drinking Cacao",
        price: 21.00,
        compareAtPrice: 29.00,
        tag: "In Stock",
        description: "Micro-shaved single-origin Ecuadorian dark chocolate flakes that whisk into velvety Parisian chocolat chaud.",
        specs: "250g Airtight Gold Tin · 12 Rich Servings"
      }
    ],
    testimonial: {
      quote: "Ordered the 8-Bar Connoisseur Flight as an anniversary gift. The snap on the tempered dark chocolate and the roasted pistachio kataifi center are genuinely patisserie grade.",
      author: "julien Moreau",
      role: "Executive Pastry Consultant",
      location: "Austin, TX",
      verifiedProduct: "8-Bar Grand Connoisseur Tasting Flight"
    }
  },
  {
    id: "aura-sculpt",
    name: "Aura Sculpt™",
    tagline: "CloudSoft™ 4-Way Stretch Seamless Pilates & Contour Activewear",
    niche: "CloudSoft™ Seamless Activewear",
    domain: "aura-sculpt.myshopify.com",
    adminUrl: "/stores/aura-sculpt",
    accentColor: "#10B981",
    secondaryColor: "#6EE7B7",
    themeStyle: "athletic-minimal",
    shippingHub: "Salt Lake City, UT Apparel Fulfillment",
    hero: "2-Piece Mix & Match Sculpt Set",
    soloPrice: 38.00,
    bundlePrice: 54.00,
    compareAtPrice: 92.00,
    freeGift: "Non-Slip Pilates Grip Socks ($16 Value)",
    freeGiftValue: 16,
    margin: "85.5%",
    revenue24h: 2180.00,
    orders24h: 38,
    aov: 57.37,
    conversionRate: 2.64,
    seoArticlesCount: 12,
    heroSpecs: [
      "Knitted on circular Santoni seamless machines with 320gsm squat-proof brushed nylon-elastane",
      "Graduated V-waistband compression supports core alignment during reformer Pilates and barre",
      "Zero front-seam construction eliminates camel-toe friction with moisture-wicking silver-ion finish"
    ],
    products: [
      {
        id: "as-1",
        title: "CloudSoft™ High-Waist Seamless Sculpt Legging",
        category: "Bottoms",
        price: 38.00,
        compareAtPrice: 58.00,
        tag: "Squat-Proof",
        description: "Buttery-matte 25\" seamless legging with contoured glute ribbing and zero front seam.",
        specs: "78% Micro-Nylon / 22% Lycra · 320gsm Opaque"
      },
      {
        id: "as-2",
        title: "2-Piece Reformer Studio Set (Legging + Longline Bra + Grip Socks)",
        category: "Studio Sets",
        price: 54.00,
        compareAtPrice: 92.00,
        tag: "VIP Bundle",
        description: "Matched seamless legging and square-neck longline sports bra plus complimentary silicone-grip crew socks.",
        specs: "Full 3-Piece Reformer Kit · Sizes XS–XXL"
      },
      {
        id: "as-3",
        title: "SculptKnit™ Zip-Front Cropped Studio Define Jacket",
        category: "Outerwear",
        price: 44.00,
        compareAtPrice: 68.00,
        tag: "In Stock",
        description: "Second-skin contoured warmup jacket with thumbholes and hidden locker-key zip pocket.",
        specs: "4-Way Stretch · Breathable Back Mesh Vent"
      },
      {
        id: "as-4",
        title: "3-Pack Organic Cotton Reformer Pilates Grip Crew Socks",
        category: "Accessories",
        price: 22.00,
        compareAtPrice: 36.00,
        tag: "In Stock",
        description: "Arch-compression studio socks with full-sole hexagonal natural rubber grip dots.",
        specs: "3 Pairs (Oat, Espresso, Onyx) · Combed Cotton"
      }
    ],
    testimonial: {
      quote: "I teach six reformer classes a day and the Aura Sculpt 2-piece set never rolls down at the waist. Zero front seam and the included grip socks have incredible carriage traction.",
      author: "Sienna Vance",
      role: "Lead Reformer Pilates Instructor",
      location: "San Diego, CA",
      verifiedProduct: "2-Piece Reformer Studio Set"
    }
  },
  {
    id: "pawglow",
    name: "PawGlow Co™",
    tagline: "Ultrasonic Cool-Mist Pet Deshedding & Botanical Coat Wellness",
    niche: "Pet Grooming Tech",
    domain: "pawglow.myshopify.com",
    adminUrl: "/stores/pawglow",
    accentColor: "#A855F7",
    secondaryColor: "#D8B4FE",
    themeStyle: "clinical-precision",
    shippingHub: "Provo, UT Pet Care Hub",
    hero: "Ultrasonic Steam Deshedding Pet Brush",
    soloPrice: 22.99,
    bundlePrice: 34.99,
    compareAtPrice: 64.00,
    freeGift: "Organic Lavender Coat Mist ($15 Value)",
    freeGiftValue: 15,
    margin: "83.4%",
    revenue24h: 1320.00,
    orders24h: 26,
    aov: 50.77,
    conversionRate: 2.48,
    seoArticlesCount: 7,
    heroSpecs: [
      "Micronized room-temperature ultrasonic mist neutralizes static electricity so loose fur lifts in one sheet",
      "140° curved stainless steel bristles tipped with soft resin massage beads protect sensitive skin",
      "1-click shutter release ejects the collected fur pad directly into the bin in 1 second"
    ],
    products: [
      {
        id: "pg-1",
        title: "PawGlow™ Ultrasonic Cool-Mist Deshedding Brush",
        category: "Grooming Tech",
        price: 22.99,
        compareAtPrice: 39.00,
        tag: "Bestseller",
        description: "Whisper-quiet ultrasonic mist brush that eliminates flying dander for dogs and long-haired cats.",
        specs: "28dB Whisper Motor · USB-C · 35ml Mist Tank"
      },
      {
        id: "pg-2",
        title: "Complete Salon-at-Home Kit (Mist Brush + 2x Botanical Refills)",
        category: "Grooming Bundles",
        price: 34.99,
        compareAtPrice: 64.00,
        tag: "VIP Bundle",
        description: "Ultrasonic Mist Brush paired with chamomile-oatmeal detangling essence and complimentary Lavender Coat Mist.",
        specs: "Brush + 2x 100ml Coat Essences"
      },
      {
        id: "pg-3",
        title: "LED Precision Safety Nail Grinder with Diamond Drum",
        category: "Paw Care",
        price: 26.00,
        compareAtPrice: 42.00,
        tag: "In Stock",
        description: "Dual-LED quick-spotter light illuminates the nail blood vessel for stress-free, splinter-free trimming.",
        specs: "Dual LED Spotlight · 3-Speed Low-Vibration"
      },
      {
        id: "pg-4",
        title: "Organic Shea & Beeswax Nose & Paw Pad Barrier Balm",
        category: "Skin & Coat",
        price: 16.00,
        compareAtPrice: 24.00,
        tag: "In Stock",
        description: "Lick-safe human-grade balm that repairs cracked winter or hot-pavement paw pads overnight.",
        specs: "2oz Twist Stick · 100% Lick-Safe Botanicals"
      }
    ],
    testimonial: {
      quote: "My Golden Retriever usually bolts when he sees a slicker brush. The cool mist stops static shock completely and pulls out a full cushion of undercoat in five minutes.",
      author: "Devon Mercer",
      role: "Certified Canine Behaviorist",
      location: "Denver, CO",
      verifiedProduct: "Complete Salon-at-Home Kit"
    }
  },
  {
    id: "zenith-sleep",
    name: "Zenith Sleep™",
    tagline: "Zero-Eye-Pressure 3D Blackout Acoustics & REM Chronobiology",
    niche: "Deep Sleep Biohacking",
    domain: "zenith-sleep.myshopify.com",
    adminUrl: "/stores/zenith-sleep",
    accentColor: "#6366F1",
    secondaryColor: "#A5B4FC",
    themeStyle: "obsidian-luxury",
    shippingHub: "Salt Lake City, UT Biohack Hub",
    hero: "Bluetooth 3D Zero-Pressure Blackout Mask",
    soloPrice: 34.99,
    bundlePrice: 49.99,
    compareAtPrice: 88.00,
    freeGift: "Satin Travel Case + Earplugs ($14 Value)",
    freeGiftValue: 14,
    margin: "81.7%",
    revenue24h: 1750.40,
    orders24h: 22,
    aov: 79.56,
    conversionRate: 2.18,
    seoArticlesCount: 11,
    heroSpecs: [
      "12mm deep-molded memory foam eye cups allow full REM blink movement with zero eyelash friction",
      "4mm wafer-thin Bluetooth 5.4 bone-conduction acoustic drivers comfortable for side sleepers",
      "Mulberry silk cooling inner liner with adjustable stealth nose baffle blocks 100% of lux light"
    ],
    products: [
      {
        id: "zs-1",
        title: "Zenith™ 3D Zero-Pressure Bluetooth 5.4 Blackout Sleep Mask",
        category: "Sleep Masks",
        price: 34.99,
        compareAtPrice: 59.00,
        tag: "REM Engineered",
        description: "Total darkness and ultra-thin side-sleeper audio for binaural delta waves, white noise, or audiobooks.",
        specs: "14-Hour Battery · 4mm Speakers · Washable Liner"
      },
      {
        id: "zs-2",
        title: "Deep REM Partner Suite (2x Bluetooth Masks + Satin Travel Kit)",
        category: "Couples Bundle",
        price: 49.99,
        compareAtPrice: 88.00,
        tag: "VIP Bundle",
        description: "Two Zenith 3D Bluetooth Masks plus complimentary satin travel case and -32dB silicone sleep earplugs.",
        specs: "2x Masks + Satin Case + Acoustic Earplugs"
      },
      {
        id: "zs-3",
        title: "Amber 590nm Melatonin-Preserving Clip-On Reading Light",
        category: "Circadian Lighting",
        price: 21.00,
        compareAtPrice: 32.00,
        tag: "In Stock",
        description: "100% blue-spectrum-free 1800K warm amber book light that protects evening melatonin onset.",
        specs: "Zero Blue Light (590nm) · 60-Hour Rechargeable"
      },
      {
        id: "zs-4",
        title: "Magnesium Glycinate & Tart Cherry Deep Sleep Pillow Mist",
        category: "Sleep Aromatics",
        price: 19.00,
        compareAtPrice: 28.00,
        tag: "In Stock",
        description: "Fine linen spray blended with French highland lavender, vetiver root, and Roman chamomile.",
        specs: "100ml Amber Glass Atomizer · Non-Staining"
      }
    ],
    testimonial: {
      quote: "As a strict side-sleeper who works night shifts, regular headphones hurt my ears and flat masks crush my eyelashes. My Oura ring shows +42 minutes of deep sleep per night.",
      author: "Marcus Chen",
      role: "ER Physician Assistant",
      location: "Boston, MA",
      verifiedProduct: "Deep REM Partner Suite"
    }
  },
  {
    id: "aura-posture",
    name: "Aura Posture™",
    tagline: "Smart Gyroscopic Spine Alignment & Ergonomic Desk Recovery",
    niche: "Smart Spine Ergonomics",
    domain: "aura-posture.myshopify.com",
    adminUrl: "/stores/aura-posture",
    accentColor: "#14B8A6",
    secondaryColor: "#5EEAD4",
    themeStyle: "clinical-precision",
    shippingHub: "Provo, UT Ergonomics Hub",
    hero: "Smart Haptic Posture Alignment Sensor",
    soloPrice: 38.00,
    bundlePrice: 54.00,
    compareAtPrice: 94.00,
    freeGift: "Ergonomic Gel Wrist Rest ($18 Value)",
    freeGiftValue: 18,
    margin: "81.3%",
    revenue24h: 1120.50,
    orders24h: 20,
    aov: 56.03,
    conversionRate: 2.30,
    seoArticlesCount: 6,
    heroSpecs: [
      "Internal MEMS gyroscope detects forward slouching beyond 15° and delivers a silent haptic nudge",
      "Trains your own paraspinal postural muscles through biofeedback rather than rigid brace dependency",
      "Breathable figure-8 woven nylon straps sit invisibly under shirts with 14-day USB-C battery life"
    ],
    products: [
      {
        id: "ap-1",
        title: "AuraAlign™ Smart Haptic Posture Biofeedback Trainer",
        category: "Posture Tech",
        price: 38.00,
        compareAtPrice: 64.00,
        tag: "Flagship",
        description: "Intelligent angle-sensing posture trainer with LED correction counter and silent vibration feedback.",
        specs: "5°–25° Custom Threshold · 14-Day Battery"
      },
      {
        id: "ap-2",
        title: "8-Hour Executive Desk Ergonomics Suite (Sensor + Lumbar + Wrist)",
        category: "Desk Suite",
        price: 54.00,
        compareAtPrice: 94.00,
        tag: "VIP Bundle",
        description: "Smart Haptic Posture Sensor paired with memory-foam lumbar support and free Cooling Gel Wrist Rest.",
        specs: "Sensor + Lumbar Cushion + Free Gel Wrist Rest"
      },
      {
        id: "ap-3",
        title: "Orthopedic Coccyx Cutout High-Density Memory Foam Seat Cushion",
        category: "Seating",
        price: 34.00,
        compareAtPrice: 52.00,
        tag: "In Stock",
        description: "Suspends the tailbone above hard chair surfaces to relieve sciatic nerve and lower lumbar compression.",
        specs: "60D Charcoal Memory Foam · Non-Slip Base"
      },
      {
        id: "ap-4",
        title: "Anodized Aluminum 7-Angle Foldable Laptop Eye-Level Stand",
        category: "Desk Hardware",
        price: 28.00,
        compareAtPrice: 44.00,
        tag: "In Stock",
        description: "Raises laptop screens 6 inches to natural eye level, eliminating cervical forward-head tilt.",
        specs: "CNC 6061 Aluminum · Supports 10\"–17\" Laptops"
      }
    ],
    testimonial: {
      quote: "Unlike rigid straps that just pull your shoulders back until they ache, the subtle haptic vibration reminds me to engage my core whenever I lean into my monitor.",
      author: "David K. Thorne",
      role: "Principal Product Designer",
      location: "San Francisco, CA",
      verifiedProduct: "8-Hour Executive Desk Ergonomics Suite"
    }
  },
  {
    id: "lumicarve",
    name: "LumiCarve™",
    tagline: "35,000 RPM Brushless Micro-Engraving & Precision Workshop Tools",
    niche: "Precision DIY & Crafting",
    domain: "lumicarve.myshopify.com",
    adminUrl: "/stores/lumicarve",
    accentColor: "#EAB308",
    secondaryColor: "#FDE047",
    themeStyle: "obsidian-luxury",
    shippingHub: "Salt Lake City, UT Tool & Hardware Hub",
    hero: "Cordless High-Speed Micro Engraving Pen",
    soloPrice: 42.00,
    bundlePrice: 58.00,
    compareAtPrice: 98.00,
    freeGift: "30-Piece Diamond Burr Bit Kit ($22 Value)",
    freeGiftValue: 22,
    margin: "80.5%",
    revenue24h: 1680.00,
    orders24h: 18,
    aov: 93.33,
    conversionRate: 1.95,
    seoArticlesCount: 10,
    heroSpecs: [
      "Zero-runout Japanese dual-bearing spindle spins at 15,000 / 25,000 / 35,000 RPM with fountain-pen balance",
      "Etches hardened steel, borosilicate glass, silver, stone, ceramic, and walnut with zero hand chatter",
      "CNC-machined knurled aluminum body with OLED speed display and automatic overload stall protection"
    ],
    products: [
      {
        id: "lm-1",
        title: "LumiCarve™ Pro 35,000 RPM Cordless Micro-Engraving Pen",
        category: "Rotary Tools",
        price: 42.00,
        compareAtPrice: 69.00,
        tag: "Pro Workshop",
        description: "Pen-sized cordless rotary engraver with 3-speed torque control and shadow-free LED work ring.",
        specs: "35,000 RPM · 2.35mm Universal Collet · USB-C"
      },
      {
        id: "lm-2",
        title: "Master Maker Workshop Kit (Engraver + 60 Bits + Stencil Book)",
        category: "Workshop Bundles",
        price: 58.00,
        compareAtPrice: 98.00,
        tag: "VIP Bundle",
        description: "LumiCarve Pro Pen plus tungsten carbide burrs, polishing felts, and unlocked 30-pc Diamond Bit Kit.",
        specs: "Pen + 60 Total Bits + Aluminum Storage Case"
      },
      {
        id: "lm-3",
        title: "10-Piece Tungsten Carbide Double-Cut Rotary Burr Set",
        category: "Bit Sets",
        price: 24.00,
        compareAtPrice: 38.00,
        tag: "In Stock",
        description: "HRA90 solid carbide bits engineered for rapid stock removal on hardwood, brass, and titanium.",
        specs: "2.35mm Shanks · 10 Profiles · Indexed Case"
      },
      {
        id: "lm-4",
        title: "Self-Healing A3 Precision Matte Cutting & Etching Desk Mat",
        category: "Bench Gear",
        price: 22.00,
        compareAtPrice: 34.00,
        tag: "In Stock",
        description: "5-ply non-glare workshop mat with metric/imperial grids and protractor angles.",
        specs: "450mm x 300mm · 3mm Heavy-Duty 5-Ply PVC"
      }
    ],
    testimonial: {
      quote: "Zero collet wobble even at 35,000 RPM. I use it daily for hallmarking sterling silver rings and custom-etching bourbon bottles in my studio.",
      author: "Gideon Vance",
      role: "Bespoke Silversmith",
      location: "Asheville, NC",
      verifiedProduct: "Master Maker Workshop Kit"
    }
  },
  {
    id: "dermasonic",
    name: "Dermasonic™",
    tagline: "28kHz Ultrasonic Water-Ion Pore Extraction & Sebum Clearing",
    niche: "Ultrasonic Pore Care",
    domain: "dermasonic.myshopify.com",
    adminUrl: "/stores/dermasonic",
    accentColor: "#EC4899",
    secondaryColor: "#F9A8D4",
    themeStyle: "clinical-precision",
    shippingHub: "Provo, UT Derm Logistics Hub",
    hero: "Ultrasonic Water-Ion Blackhead Scrubber",
    soloPrice: 29.99,
    bundlePrice: 44.99,
    compareAtPrice: 82.00,
    freeGift: "Pore-Melting Botanical Toner ($19 Value)",
    freeGiftValue: 19,
    margin: "83.6%",
    revenue24h: 980.20,
    orders24h: 19,
    aov: 51.59,
    conversionRate: 2.22,
    seoArticlesCount: 8,
    heroSpecs: [
      "28,000 Hz high-frequency ultrasonic oscillations atomize water on contact to flush oxidized sebum",
      "Curved 304 medical stainless spatula extracts congested nose and chin pores without bruising capillaries",
      "Switch to Negative-Ion Infusion mode to drive hyaluronic and niacinamide serums into the epidermis"
    ],
    products: [
      {
        id: "ds-1",
        title: "Dermasonic™ 28kHz Ultrasonic Water-Ion Pore Extractor",
        category: "Pore Devices",
        price: 29.99,
        compareAtPrice: 54.00,
        tag: "Esthetician Pick",
        description: "4-mode ultrasonic skin scrubber (Peeling, Ion+ Extraction, Ion- Infusion, EMS Micro-Pulse).",
        specs: "28,000 Hz · Surgical Steel Spatula · IPX5"
      },
      {
        id: "ds-2",
        title: "Glass-Skin Extraction Protocol (Scrubber + Sebum Softener + Mist)",
        category: "Pore Protocol",
        price: 44.99,
        compareAtPrice: 82.00,
        tag: "VIP Bundle",
        description: "Dermasonic 28kHz Scrubber paired with continuous thermal facial mister and free Pore-Melting Botanical Toner.",
        specs: "Scrubber + Nano Mister + Free 120ml BHA/PHA Toner"
      },
      {
        id: "ds-3",
        title: "LumaSteam™ Nano-Ionic Warm Facial Steamer & Humidifier",
        category: "Prep Devices",
        price: 36.00,
        compareAtPrice: 58.00,
        tag: "In Stock",
        description: "Generates 40°C negatively charged nano-steam particles to dilate pores in 90 seconds prior to extraction.",
        specs: "4000x Finer Nano-Steam · 10-Min Auto Cycle"
      },
      {
        id: "ds-4",
        title: "Hydrocolloid Invisible Salicylic Spot Patch Vault (144 Patches)",
        category: "Blemish Care",
        price: 16.00,
        compareAtPrice: 24.00,
        tag: "In Stock",
        description: "Beveled 0.1mm medical hydrocolloid dots with 0.5% salicylic acid and cica extract.",
        specs: "144 Patches (10mm & 12mm) · Matte Invisible Finish"
      }
    ],
    testimonial: {
      quote: "Replaced harsh pore strips completely. Spraying warm water and gliding the ultrasonic spatula at 45 degrees clears sebaceous filaments on my nose with zero redness.",
      author: "Camille Laurent",
      role: "Licensed Medical Esthetician",
      location: "Miami, FL",
      verifiedProduct: "Glass-Skin Extraction Protocol"
    }
  },
  {
    id: "calmcore",
    name: "CalmCore™",
    tagline: "Weighted French Clay & Organic Lavender Thermal Neck Therapy",
    niche: "Weighted Thermal Therapy",
    domain: "calmcore.myshopify.com",
    adminUrl: "/stores/calmcore",
    accentColor: "#06B6D4",
    secondaryColor: "#67E8F9",
    themeStyle: "botanical-craft",
    shippingHub: "Salt Lake City, UT Wellness Hub",
    hero: "Weighted Clay Herbal Neck & Shoulder Wrap",
    soloPrice: 44.00,
    bundlePrice: 64.00,
    compareAtPrice: 108.00,
    freeGift: "Aromatherapy Essential Oil Roll-On ($16 Value)",
    freeGiftValue: 16,
    margin: "81.8%",
    revenue24h: 1410.90,
    orders24h: 29,
    aov: 48.65,
    conversionRate: 3.05,
    seoArticlesCount: 13,
    heroSpecs: [
      "3.5 lbs of natural bioceramic clay beads, flaxseed, and French lavender buds distributed across 12 quilted channels",
      "High-collar anatomical drape hugs C1–C7 vertebrae and upper trapezius muscles simultaneously",
      "Retains deep moist heat for 45 minutes after a 90-second microwave warm-up"
    ],
    products: [
      {
        id: "cc-1",
        title: "CalmCore™ 3.5lb Weighted Herbal Clay Neck & Shoulder Wrap",
        category: "Thermal Wraps",
        price: 44.00,
        compareAtPrice: 68.00,
        tag: "Spa Essential",
        description: "Deep-pressure weighted shoulder mantel filled with ceramic clay pearls, flaxseed, and chamomile.",
        specs: "3.5 lbs · 12-Channel Baffle · Ultra-Plush Minky"
      },
      {
        id: "cc-2",
        title: "Full-Body Decompression Sanctuary (Neck Wrap + Lumbar Pad + Oil)",
        category: "Sanctuary Bundle",
        price: 64.00,
        compareAtPrice: 108.00,
        tag: "VIP Bundle",
        description: "Weighted Neck & Shoulder Wrap plus weighted abdominal/lumbar pad and free Lavender Aromatherapy Roll-On.",
        specs: "Neck Wrap + Lumbar Wrap + Free 15ml Roll-On"
      },
      {
        id: "cc-3",
        title: "Weighted Lavender & Flaxseed Silk Acupressure Eye Pillow",
        category: "Rest Therapy",
        price: 22.00,
        compareAtPrice: 34.00,
        tag: "In Stock",
        description: "9oz gentle vagus-nerve ocular pressure pillow with removable washable mulberry silk cover.",
        specs: "100% Mulberry Silk · Organic Oregon Lavender"
      },
      {
        id: "cc-4",
        title: "Heated Tourmaline Carpal-Tunnel & Thumb Compression Massager",
        category: "Hand Recovery",
        price: 36.00,
        compareAtPrice: 54.00,
        tag: "In Stock",
        description: "Rhythmic air-bag palm compression with 42°C far-infrared warmth for sore hands and wrists.",
        specs: "3 Pressure Modes · Cordless Rechargeable"
      }
    ],
    testimonial: {
      quote: "The 3.5-pound weight immediately drops my shoulders two inches away from my ears. It holds moist heat twice as long as rice bags without any burnt smell.",
      author: "Nadia Lindstrom",
      role: "Doctor of Physical Therapy",
      location: "Minneapolis, MN",
      verifiedProduct: "Full-Body Decompression Sanctuary"
    }
  },
  {
    id: "floraspring",
    name: "FloraSpring™",
    tagline: "Porous Olla Terracotta Self-Watering & Botanical Plant Care",
    niche: "Cottagecore Plant Tech",
    domain: "floraspring.myshopify.com",
    adminUrl: "/stores/floraspring",
    accentColor: "#22C55E",
    secondaryColor: "#86EFAC",
    themeStyle: "botanical-craft",
    shippingHub: "Provo, UT Greenhouse Logistics Hub",
    hero: "Terracotta Self-Watering Spikes (Set of 4)",
    soloPrice: 21.99,
    bundlePrice: 34.99,
    compareAtPrice: 64.00,
    freeGift: "Organic Liquid Plant Food Drops ($14 Value)",
    freeGiftValue: 14,
    margin: "85.4%",
    revenue24h: 890.00,
    orders24h: 14,
    aov: 63.57,
    conversionRate: 1.88,
    seoArticlesCount: 5,
    heroSpecs: [
      "Kiln-fired at 1,080°C for calibrated microporosity that releases moisture only as surrounding soil dries",
      "Universal collar fits any recycled wine bottle or long-neck glass vessel for 14 days of vacation hydration",
      "Prevents fungus gnats and root rot by delivering capillary moisture directly to the root zone"
    ],
    products: [
      {
        id: "fs-1",
        title: "FloraSpring™ Artisan Olla Terracotta Watering Spikes (Set of 4)",
        category: "Self-Watering",
        price: 21.99,
        compareAtPrice: 34.00,
        tag: "Plant Lover Pick",
        description: "Set of 4 slow-release terracotta root irrigators for Monsteras, Fiddle Leaf Figs, and herb pots.",
        specs: "Set of 4 Spikes · 14-Day Autonomous Hydration"
      },
      {
        id: "fs-2",
        title: "Indoor Jungle 8-Spike Greenhouse Bundle + Free Plant Food Drops",
        category: "Greenhouse Kit",
        price: 34.99,
        compareAtPrice: 64.00,
        tag: "VIP Bundle",
        description: "8 Olla Terracotta Spikes plus 2 hand-blown amber glass reservoir globes and free Organic Plant Food Drops.",
        specs: "8x Spikes + 2x Amber Globes + Free NPK Drops"
      },
      {
        id: "fs-3",
        title: "Full-Spectrum 4000K Halo Brass Telescoping Plant Grow Light",
        category: "Grow Lighting",
        price: 32.00,
        compareAtPrice: 48.00,
        tag: "In Stock",
        description: "Warm museum-grade CRI 95+ LED halo with built-in 8/12/16-hour automatic circadian timer.",
        specs: "Brushed Brass Rod · 18\"–48\" Height · Auto-Timer"
      },
      {
        id: "fs-4",
        title: "Forged Japanese Carbon-Steel Bonsai & Foliage Micro-Shears",
        category: "Pruning Tools",
        price: 24.00,
        compareAtPrice: 36.00,
        tag: "In Stock",
        description: "Needle-nose surgical pruning snips with oiled canvas roll for clean node propagation cuts.",
        specs: "SK5 High-Carbon Steel · 185mm Overall Length"
      }
    ],
    testimonial: {
      quote: "Left for a 12-day trip to Europe and came home to perkier Calatheas and Monsteras than when I water them by hand. Zero dry crispy edges.",
      author: "Rowan Alistair",
      role: "Botanical Interior Stylist",
      location: "Savannah, GA",
      verifiedProduct: "Indoor Jungle 8-Spike Greenhouse Bundle"
    }
  },
  {
    id: "velobrew",
    name: "VeloBrew™",
    tagline: "Cordless 20-Bar Self-Heating Trail Espresso & Precision Extraction",
    niche: "Portable Barista Tech",
    domain: "velobrew.myshopify.com",
    adminUrl: "/stores/velobrew",
    accentColor: "#F97316",
    secondaryColor: "#FDBA74",
    themeStyle: "obsidian-luxury",
    shippingHub: "Salt Lake City, UT Barista & Outdoor Hub",
    hero: "Cordless 20-Bar Thermal Portable Espresso Maker",
    soloPrice: 54.00,
    bundlePrice: 74.00,
    compareAtPrice: 129.00,
    freeGift: "Stainless Steel Dosing Ring & Tamper ($20 Value)",
    freeGiftValue: 20,
    margin: "79.5%",
    revenue24h: 1728.00,
    orders24h: 32,
    aov: 54.00,
    conversionRate: 2.94,
    seoArticlesCount: 9,
    heroSpecs: [
      "Internal ceramic PID heating block brings cold mountain spring water to 93°C (200°F) in 180 seconds",
      "True 20-bar Italian electromagnetic pump extracts tiger-striped golden crema from fine ground coffee or NS capsules",
      "7,800mAh aerospace lithium battery pulls 5 hot shots from cold water or 150+ shots with pre-boiled water"
    ],
    products: [
      {
        id: "vb-1",
        title: "VeloBrew™ Pro 20-Bar Self-Heating Cordless Espresso Machine",
        category: "Espresso Makers",
        price: 54.00,
        compareAtPrice: 89.00,
        tag: "Trail Barista",
        description: "Dual-compatible (fresh ground 18g basket + original capsules) cordless espresso maker with 93°C PID heater.",
        specs: "20-Bar Pump · 93°C PID Heater · 7800mAh USB-C"
      },
      {
        id: "vb-2",
        title: "Overland Barista Expedition Kit (VeloBrew + Hard Case + Tamper)",
        category: "Expedition Kit",
        price: 74.00,
        compareAtPrice: 129.00,
        tag: "VIP Bundle",
        description: "VeloBrew Pro Machine + EVA weatherproof travel case + free calibrated Stainless Dosing Ring & Tamper.",
        specs: "Machine + EVA Case + Free Steel Tamper & Ring"
      },
      {
        id: "vb-3",
        title: "CNC 38mm Conical Stainless Burr Manual Travel Coffee Grinder",
        category: "Grinders",
        price: 42.00,
        compareAtPrice: 68.00,
        tag: "In Stock",
        description: "24-click stepped micrometer adjustment dials in Turkish, Espresso, Pour-Over, and French Press grinds.",
        specs: "420 Stainless CNC Burrs · Dual Bearing Shaft"
      },
      {
        id: "vb-4",
        title: " Vacuum-Insulated 6oz Ceramic-Lined Cortado Tasting Cup (Set of 2)",
        category: "Drinkware",
        price: 24.00,
        compareAtPrice: 36.00,
        tag: "In Stock",
        description: "Pure porcelain interior coating eliminates metallic aftertaste to preserve delicate espresso aromatics.",
        specs: "2x 6oz Cups · True Ceramic Inner Glaze"
      }
    ],
    testimonial: {
      quote: "Pulled a double shot of Ethiopian single-origin at 9,800 feet in the Wasatch backcountry. Thick hazelnut crema and piping hot 93°C extraction without needing a camp stove.",
      author: "Caleb Vance",
      role: "Specialty Coffee Roaster & Alpinist",
      location: "Park City, UT",
      verifiedProduct: "Overland Barista Expedition Kit"
    }
  }
];

export function getStoreById(storeId: string): StoreDefinition | undefined {
  const normalized = storeId.toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    "paw-glow": "pawglow",
    "lumi-carve": "lumicarve",
    "calm-core": "calmcore",
    "flora-spring": "floraspring",
    "bizi-bees-boutique": "bizi-bees",
  };
  const resolvedId = aliasMap[normalized] || normalized;
  return INITIAL_STORES.find((s) => s.id === resolvedId);
}
