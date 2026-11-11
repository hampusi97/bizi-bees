/**
 * Exploded-view scrollytelling content, per store.
 *
 * Each store's flagship product is described as a stack of layers that separate
 * on scroll and reassemble into a bundle. Copy only — no JS, no markup — so it
 * can be validated by `scripts/check-scrollytelling.mjs` and rendered by
 * `components/ExplodedShowcase.tsx` with a graceful fallback.
 *
 * `spec` lines are the real reason to buy, not decoration: what the part is
 * made of and why it matters. Keep them short enough for a phone.
 */

export interface ExplodedLayer {
  /** 1-based position, shown as "01 / ...". */
  index: number;
  title: string;
  spec: string;
  /** Vertical offset in px at full separation, negative = up. */
  offsetY: number;
  /** Tailwind gradient classes used for the layer plate. */
  plate: string;
}

export interface ExplodedShowcase {
  storeId: string;
  /** Product the showcase describes; must exist in the store's catalog. */
  productId: string;
  backdropHeadline: string;
  productName: string;
  /** Short line under the headline during stage 1. */
  productSpec: string;
  layers: ExplodedLayer[];
  companions: [string, string];
  bundle: {
    title: string;
    tag: string;
    price: number;
    compareAtPrice: number;
    /** SKUs or product ids added to the bag by the bundle CTA. */
    includes: string[];
  };
}

const p = (n: number) => `0${n}`.slice(-2);

function layers(items: Array<[string, string, string]>): ExplodedLayer[] {
  const spacing = 320 / Math.max(items.length - 1, 1);
  return items.map(([title, spec, plate], i) => ({
    index: i + 1,
    title: `${p(i + 1)} / ${title}`,
    spec,
    offsetY: Math.round(-160 + spacing * i),
    plate,
  }));
}

export const EXPLODED_SHOWCASES: ExplodedShowcase[] = [
  {
    storeId: 'ember-oak',
    productId: 'eo-1',
    backdropHeadline: 'BUILT FOR THE RITUAL.',
    productName: 'Spanish Cedar Humidor & Aficionado Torch Kit',
    productSpec: '50-count desktop humidor · kiln-dried Spanish cedar',
    layers: layers([
      ['Kiln-Dried Spanish Cedar Lining', 'Aged cedar releases humidity evenly and keeps the aroma clean', 'from-amber-800 to-amber-950'],
      ['Layered Acrylic Seal', 'Sits flush so the lid closes with a soft, airtight press', 'from-amber-500 to-amber-800'],
      ['Brushed Brass Hinge & Latch', 'Solid brass, so it does not corrode in a humid box', 'from-yellow-400 to-amber-700'],
      ['Charcoal-Felt Base', 'Sits level on a desk and does not scratch the wood', 'from-stone-700 to-stone-900'],
    ]),
    companions: ['Digital Hygrometer', 'Refillable Torch Lighter'],
    bundle: {
      title: 'THE COMPLETE CEDAR RITUAL BOX',
      tag: 'HUMIDOR + HYGROMETER + TORCH',
      price: 68,
      compareAtPrice: 98,
      includes: ['eo-1', 'eo-2'],
    },
  },
  {
    storeId: 'bizi-bees',
    productId: 'bb-2',
    backdropHeadline: 'BUILT FOR STORYTELLERS.',
    productName: 'The Utah Curated Reader\'s Box',
    productSpec: 'Hand-inspected in Utah · 2 wrapped books + candle',
    layers: layers([
      ['Hand-Graded Vintage Hardcover', 'Inspected for spine integrity and clean pages in Utah', 'from-orange-700 to-amber-900'],
      ['Solid Brass Page Anchor', 'Weighted brushed brass that holds your page flat', 'from-yellow-500 to-amber-700'],
      ['Archival Reading Journal', '120gsm acid-free cream paper for book notes', 'from-stone-400 to-stone-600'],
      ['Blind-Date Mystery Classic', 'Wrapped in kraft paper with wax seal and genre clues', 'from-amber-600 to-orange-800'],
    ]),
    companions: ['4oz Soy Candle', 'Raw Honey Sticks'],
    bundle: {
      title: "THE COMPLETE READER'S STACK BOX",
      tag: '2 BOOKS + CANDLE + BRASS MARK',
      price: 48,
      compareAtPrice: 72,
      includes: ['bb-2', 'bb-1'],
    },
  },
  {
    storeId: 'luma-clinical',
    productId: 'lc-1',
    backdropHeadline: 'ENGINEERED AT 630nm.',
    productName: 'LumaGlow™ QuadWave Pro 4-in-1 Wand',
    productSpec: 'Phototherapy · microcurrent · warmth · sonic',
    layers: layers([
      ['Rotating Medical Alloy Head', 'Hypoallergenic surgical-grade contour conductor', 'from-slate-300 to-slate-500'],
      ['630nm Deep Red LED Matrix', 'The clinical wavelength studied for dermal collagen response', 'from-rose-500 to-rose-800'],
      ['Microcurrent Sculptor', 'Gentle bio-electric toning for the jawline and cheeks', 'from-sky-400 to-sky-700'],
      ['Therapeutic Warmth + Sonic Core', 'Warmth and micro-vibration for product absorption', 'from-orange-400 to-orange-700'],
    ]),
    companions: ['Conductive Gel', 'Cooling Recovery Cap'],
    bundle: {
      title: 'THE CLINICAL RECOVERY SYSTEM BOX',
      tag: 'WAND + GEL + RECOVERY CAP',
      price: 89,
      compareAtPrice: 135,
      includes: ['lc-1', 'lc-2'],
    },
  },
  {
    storeId: 'luma-relief',
    productId: 'lr-1',
    backdropHeadline: 'COLD, ON DEMAND.',
    productName: 'LumaRelief™ 360° Cold Compression Cap',
    productSpec: '360° targeted cold · no ice, no wet towels',
    layers: layers([
      ['360° Cooling Wrap', 'Covers the full ring around the head, not just the forehead', 'from-sky-400 to-sky-800'],
      ['Phase-Change Cold Gel', 'Stays cold far longer than ice and never drips', 'from-cyan-300 to-sky-600'],
      ['Adjustable Compression Band', 'Keeps steady pressure on the temples without pinching', 'from-slate-500 to-slate-800'],
    ]),
    companions: ['Freezer Pouch', 'Travel Case'],
    bundle: {
      title: 'THE COMPLETE RELIEF KIT',
      tag: 'CAP + POUCH + CASE',
      price: 44,
      compareAtPrice: 62,
      includes: ['lr-1'],
    },
  },
  {
    storeId: 'fizz-lab',
    productId: 'fl-1',
    backdropHeadline: 'MIX YOUR OWN.',
    productName: 'Provo Classic Dirty Soda Starter Kit',
    productSpec: '4 syrups · cream · the Provo method',
    layers: layers([
      ['Cream Base', 'The half-and-half backbone of a true dirty soda', 'from-amber-200 to-amber-500'],
      ['Coconut & Lime Syrup', 'The citrus cut that stops it being too sweet', 'from-lime-300 to-green-600'],
      ['Flavored Syrup Set', 'Four syrups so one box makes a dozen different drinks', 'from-fuchsia-400 to-purple-700'],
      ['Recipe Card Set', 'Exact ratios, so it tastes the same every time', 'from-stone-300 to-stone-600'],
    ]),
    companions: ['Insulated Tumbler', 'Crushed Ice Tray'],
    bundle: {
      title: 'THE COMPLETE SODA BAR BOX',
      tag: 'SYRUPS + CREAM + TUMBLER',
      price: 52,
      compareAtPrice: 74,
      includes: ['fl-1'],
    },
  },
  {
    storeId: 'crave-lab',
    productId: 'cl-1',
    backdropHeadline: 'FOUR BARS. ONE FLIGHT.',
    productName: '4-Bar Sommelier Chocolate Bento Box',
    productSpec: 'Single-origin · tasting notes · bento tray',
    layers: layers([
      ['Single-Origin Dark 72%', 'One farm, one harvest, so the tasting notes are real', 'from-amber-900 to-stone-900'],
      ['Milk & Caramel Layer', 'Softer contrast bar to reset the palate between darks', 'from-amber-500 to-amber-800'],
      ['Inclusion Bar', 'Nibs and sea salt for texture, not sugar', 'from-stone-500 to-stone-800'],
      ['Cedar Bento Tray', 'Keeps the four bars separated and unbruised in transit', 'from-amber-700 to-amber-950'],
    ]),
    companions: ['Tasting Note Cards', 'Gift Sleeve'],
    bundle: {
      title: 'THE COMPLETE TASTING FLIGHT',
      tag: '4 BARS + NOTES + SLEEVE',
      price: 38,
      compareAtPrice: 54,
      includes: ['cl-1'],
    },
  },
  {
    storeId: 'aura-sculpt',
    productId: 'as-1',
    backdropHeadline: 'SCULPT, THEN GO.',
    productName: 'CloudSoft™ Seamless Sculpt Leggings',
    productSpec: 'Seamless knit · squat-proof · no front seam',
    layers: layers([
      ['Seamless Compression Knit', 'No side seam, so nothing digs in when you sit', 'from-purple-400 to-purple-800'],
      ['Sculpt Contour Panels', 'Thicker knit through the seat and waist, thinner at the knee', 'from-violet-500 to-indigo-800'],
      ['Four-Way Stretch Core', 'Returns to shape after wear instead of bagging out', 'from-slate-400 to-slate-700'],
      ['Flatlock Waistband', 'Stays put without a roll-down or a visible line', 'from-purple-700 to-slate-900'],
    ]),
    companions: ['Matching Sports Bra', 'Mesh Carry Pouch'],
    bundle: {
      title: 'THE COMPLETE SCULPT SET',
      tag: 'LEGGINGS + BRA + POUCH',
      price: 62,
      compareAtPrice: 89,
      includes: ['as-1'],
    },
  },
  {
    storeId: 'pawglow',
    productId: 'pg-1',
    backdropHeadline: 'LESS FUR. LESS STRESS.',
    productName: 'PawGlow™ Ultrasonic Cool-Mist Deshedding Brush',
    productSpec: 'Ultrasonic lift · cool mist · quiet motor',
    layers: layers([
      ['Ultrasonic Lift Plate', 'Loosens the undercoat instead of yanking the top coat', 'from-emerald-400 to-emerald-800'],
      ['Cool-Mist Reservoir', 'Damps the fur so it clumps instead of flying', 'from-sky-300 to-cyan-600'],
      ['Quiet Low-Vibration Motor', 'Quiet enough that nervous dogs do not bolt', 'from-slate-500 to-slate-800'],
      ['Self-Cleaning Comb Base', 'Fur releases in one pad instead of picking it out', 'from-emerald-700 to-slate-900'],
    ]),
    companions: ['Refill Mist Bottle', 'Grooming Glove'],
    bundle: {
      title: 'THE COMPLETE GROOMING BOX',
      tag: 'BRUSH + REFILL + GLOVE',
      price: 42,
      compareAtPrice: 60,
      includes: ['pg-1'],
    },
  },
  {
    storeId: 'zenith-sleep',
    productId: 'zs-1',
    backdropHeadline: 'TOTAL DARK. ZERO PRESSURE.',
    productName: 'Zenith™ 3D Zero-Pressure Bluetooth Sleep Mask',
    productSpec: '3D eye cups · Bluetooth audio · 100% blackout',
    layers: layers([
      ['3D Contour Eye Cups', 'No contact with the lashes or the eye itself', 'from-indigo-500 to-indigo-900'],
      ['Total-Blackout Shell', 'Blocks light from the sides, not just straight ahead', 'from-slate-700 to-slate-950'],
      ['Thin Flat Speakers', 'Audio sits on the ear area, not pressing on it', 'from-sky-400 to-sky-800'],
      ['Memory-Foam Nose Bridge', 'Seals the light gap under the eyes without squeezing', 'from-indigo-300 to-slate-700'],
    ]),
    companions: ['Travel Case', 'USB-C Charge Cable'],
    bundle: {
      title: 'THE COMPLETE SLEEP KIT',
      tag: 'MASK + CASE + CABLE',
      price: 54,
      compareAtPrice: 76,
      includes: ['zs-1'],
    },
  },
  {
    storeId: 'aura-posture',
    productId: 'ap-1',
    backdropHeadline: 'SIT UP, QUIETLY.',
    productName: 'AuraAlign™ Smart Haptic Posture Sensor',
    productSpec: 'Haptic nudge · 14-day charge · no subscription',
    layers: layers([
      ['Haptic Feedback Motor', 'A private nudge instead of a beep everyone hears', 'from-teal-400 to-teal-800'],
      ['Six-Axis Tilt Sensor', 'Knows a slouch from a stretch, so it stops nagging', 'from-slate-400 to-slate-700'],
      ['Medical Adhesive Mount', 'Holds on through a shirt change, no clip to lose', 'from-teal-600 to-slate-900'],
      ['14-Day Cell', 'Two weeks per charge, so it is not another daily cable', 'from-slate-600 to-slate-950'],
    ]),
    companions: ['Spare Adhesive Pack', 'Charging Dock'],
    bundle: {
      title: 'THE COMPLETE POSTURE KIT',
      tag: 'SENSOR + ADHESIVES + DOCK',
      price: 58,
      compareAtPrice: 82,
      includes: ['ap-1'],
    },
  },
  {
    storeId: 'lumicarve',
    productId: 'lm-1',
    backdropHeadline: 'CUT, DON’T GRIND.',
    productName: 'LumiCarve™ Pro Cordless Micro Engraving Pen',
    productSpec: '35,000 RPM · cordless · 0.3mm precision',
    layers: layers([
      ['35,000 RPM Brushless Motor', 'High speed with low runout, so lines stay clean', 'from-orange-500 to-orange-900'],
      ['Precision Collet', 'Holds a 0.3mm bit without wobble', 'from-zinc-400 to-zinc-700'],
      ['Lithium Cell + USB-C', 'Cordless for the whole job, recharges from a laptop', 'from-zinc-600 to-zinc-900'],
      ['Knurled Grip Body', 'Control at 35,000 RPM comes from the grip, not the motor', 'from-orange-700 to-zinc-900'],
    ]),
    companions: ['Bit Set (10pc)', 'Practice Tile'],
    bundle: {
      title: 'THE COMPLETE ENGRAVER BOX',
      tag: 'PEN + 10 BITS + TILE',
      price: 64,
      compareAtPrice: 92,
      includes: ['lm-1'],
    },
  },
  {
    storeId: 'dermasonic',
    productId: 'ds-1',
    backdropHeadline: '28kHz, GENTLY.',
    productName: 'Dermasonic™ 28kHz Ultrasonic Water-Ion Scrubber',
    productSpec: '28kHz ultrasonic · water-ion · spatula tip',
    layers: layers([
      ['28kHz Ultrasonic Plate', 'The frequency that lifts sebum without scraping', 'from-cyan-400 to-cyan-800'],
      ['Water-Ion Tip', 'A wet edge that glides instead of dragging', 'from-sky-300 to-blue-700'],
      ['Silicone Spatula Head', 'Soft enough for the nose, firm enough to finish', 'from-slate-300 to-slate-600'],
      ['USB-C Body', 'Pocketable, and recharges off the same cable as your phone', 'from-slate-600 to-slate-900'],
    ]),
    companions: ['Extraction Tips', 'Travel Pouch'],
    bundle: {
      title: 'THE COMPLETE SKIN TOOL KIT',
      tag: 'DEVICE + TIPS + POUCH',
      price: 44,
      compareAtPrice: 64,
      includes: ['ds-1'],
    },
  },
  {
    storeId: 'calmcore',
    productId: 'cc-1',
    backdropHeadline: 'WEIGHT, WARMTH, QUIET.',
    productName: 'CalmCore™ Weighted Herbal Clay Neck Wrap',
    productSpec: '3.5lb · microwavable · herbal clay fill',
    layers: layers([
      ['3.5lb Clay Bead Fill', 'Weight that stays where you put it, unlike loose grain', 'from-stone-400 to-stone-700'],
      ['Herbal Clay Core', 'Holds heat for 20 minutes and cools slowly', 'from-amber-600 to-stone-800'],
      ['Chamomile & Lavender Sleeve', 'Scent you can remove and wash separately', 'from-lime-300 to-emerald-700'],
      ['Brushed Cotton Outer', 'Soft against the neck, removable for washing', 'from-stone-200 to-stone-500'],
    ]),
    companions: ['Washable Cover', 'Aromatherapy Spray'],
    bundle: {
      title: 'THE COMPLETE CALM KIT',
      tag: 'WRAP + COVER + SPRAY',
      price: 62,
      compareAtPrice: 86,
      includes: ['cc-1'],
    },
  },
  {
    storeId: 'floraspring',
    productId: 'fs-1',
    backdropHeadline: 'WATER ITSELF.',
    productName: 'FloraSpring™ Artisan Olla Terracotta Watering Spikes',
    productSpec: 'Set of 4 · unglazed terracotta · 7-day reservoir',
    layers: layers([
      ['Unglazed Terracotta Body', 'Porous clay releases water only as the soil dries', 'from-orange-400 to-orange-800'],
      ['7-Day Reservoir Stem', 'A week of water for a plant that hates being fussed over', 'from-sky-300 to-cyan-700'],
      ['Narrow Neck & Cap', 'Stops soil and gnats getting in, and evaporation out', 'from-amber-600 to-stone-800'],
      ['Weighted Base', 'Sits steady in a pot without tipping when full', 'from-stone-400 to-stone-700'],
    ]),
    companions: ['Terracotta Saucer Set', 'Soil Moisture Meter'],
    bundle: {
      title: 'THE COMPLETE PLANT CARE SET',
      tag: '4 SPIKES + SAUCERS + METER',
      price: 36,
      compareAtPrice: 52,
      includes: ['fs-1'],
    },
  },
  {
    storeId: 'velobrew',
    productId: 'vb-1',
    backdropHeadline: '20 BARS, NO WALL.',
    productName: 'VeloBrew™ Pro 20-Bar Self-Heating Espresso',
    productSpec: '20-bar pressure · self-heating · cordless',
    layers: layers([
      ['20-Bar Pressure Head', 'Café-level pressure from a handheld unit', 'from-zinc-400 to-zinc-700'],
      ['Self-Heating Chamber', 'Heats its own water, so you never need a kettle', 'from-orange-500 to-red-800'],
      ['Rechargeable Pump Core', 'Cordless, and good for a full trip on one charge', 'from-slate-500 to-slate-900'],
      ['Portafilter Basket', 'A real basket, so the puck behaves like a machine', 'from-stone-500 to-zinc-800'],
    ]),
    companions: ['Travel Case', 'Ground Coffee Sampler'],
    bundle: {
      title: 'THE COMPLETE TRAVEL BARISTA KIT',
      tag: 'ESPRESSO + CASE + COFFEE',
      price: 74,
      compareAtPrice: 104,
      includes: ['vb-1'],
    },
  },
];

const byStoreId = new Map(EXPLODED_SHOWCASES.map((s) => [s.storeId, s]));

export function getExplodedShowcase(storeId: string): ExplodedShowcase | undefined {
  return byStoreId.get(storeId);
}
