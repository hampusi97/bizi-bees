"use client";

import React, { useState } from "react";

export type StudioViewMode = "studio" | "anatomy" | "unboxing" | "ritual";

interface StoreProductVisualProps {
  storeId: string;
  productIndex?: number;
  accentColor: string;
  secondaryColor?: string;
  title: string;
  category?: string;
  aspectRatio?: "16:9" | "4:3";
  interactive?: boolean;
  freeGift?: string;
  heroSpecs?: string[];
  activeEdition?: string;
}

const STORE_HOTSPOTS: Record<
  string,
  Array<{ x: number; y: number; label: string; detail: string }>
> = {
  "bizi-bees": [
    {
      x: 34,
      y: 36,
      label: "80lb Archival Kraft Wrap",
      detail: "Hand-pleated vintage kraft jacket with pressed wild lavender & eucalyptus stems.",
    },
    {
      x: 50,
      y: 50,
      label: "24k Gold-Toned Beeswax Seal",
      detail: "Stamped in small batches at our Salt Lake City studio with 4 handwritten genre clues.",
    },
    {
      x: 68,
      y: 66,
      label: "Solid Brass Honeybee Bookmark",
      detail: "Precision-cast heirloom brass page clip unlocked free on all VIP & Master bundles.",
    },
  ],
  "ember-oak": [
    {
      x: 32,
      y: 42,
      label: "Kiln-Dried Spanish Cedar",
      detail: "100% aromatic Spanish cedar interior lining engineered to lock in 68%–72% RH.",
    },
    {
      x: 50,
      y: 62,
      label: " Brass Analog Hair Hygrometer",
      detail: "Flush-mounted precision calibration dial with magnetic humidifier bar.",
    },
    {
      x: 70,
      y: 38,
      label: "Quad-Jet Windproof Butane Torch",
      detail: "Machined gunmetal body with fold-out stainless V-cutter & crystal cigar rest.",
    },
  ],
  "luma-clinical": [
    {
      x: 50,
      y: 32,
      label: "660nm Red + 415nm Blue Array",
      detail: "18 medical-grade LEDs delivering 45mW/cm² irradiance for dermal collagen synthesis.",
    },
    {
      x: 50,
      y: 55,
      label: "300uA Microcurrent Sculpting Head",
      detail: "90° rotating titanium head contours cheekbones, jawline, and orbital skin.",
    },
    {
      x: 68,
      y: 72,
      label: "42°C Thermal & Sonic Infusion",
      detail: "Multiplies absorption of the included Hyaluronic + Tri-Peptide Conductive Serum.",
    },
  ],
};

const getHotspotsForStore = (
  storeId: string,
  title: string,
  freeGift?: string,
  heroSpecs?: string[]
) => {
  if (STORE_HOTSPOTS[storeId]) return STORE_HOTSPOTS[storeId];
  return [
    {
      x: 34,
      y: 38,
      label: "Core Studio Architecture",
      detail: heroSpecs?.[0] || `Precision-engineered ${title} primary chassis.`,
    },
    {
      x: 52,
      y: 54,
      label: "Calibrated Performance Spec",
      detail: heroSpecs?.[1] || "Tested for daily high-output durability and tactile comfort.",
    },
    {
      x: 68,
      y: 66,
      label: "Unlocked VIP Gift Suite",
      detail: freeGift
        ? `Includes complimentary ${freeGift} on VIP & Master tiers.`
        : heroSpecs?.[2] || "Dispatched within 24 hours from our Salt Lake City, UT hub.",
    },
  ];
};

export default function StoreProductVisual({
  storeId,
  productIndex = 0,
  accentColor,
  secondaryColor = "#F8FAFC",
  title,
  category = "Flagship Edition",
  aspectRatio = "4:3",
  interactive = false,
  freeGift,
  heroSpecs,
  activeEdition,
}: StoreProductVisualProps) {
  const [viewMode, setViewMode] = useState<StudioViewMode>("studio");
  const [activeHotspot, setActiveHotspot] = useState<number | null>(interactive ? 1 : null);

  const hotspots = getHotspotsForStore(storeId, title, freeGift, heroSpecs);

  const renderDomainIllustration = () => {
    const uid = `${storeId}-${productIndex}-${viewMode}`;

    switch (storeId) {
      case "bizi-bees":
        return (
          <svg viewBox="0 0 360 230" className="w-full h-full" aria-hidden="true">
            <defs>
              <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
                <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`kraft-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E5C69B" />
                <stop offset="55%" stopColor="#C89E68" />
                <stop offset="100%" stopColor="#9B7240" />
              </linearGradient>
              <linearGradient id={`gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>

            {/* Studio Spotlight & Pedestal Shadow */}
            <circle cx="180" cy="112" r="98" fill={`url(#glow-${uid})`} />
            <ellipse cx="180" cy="198" rx="96" ry="12" fill="#020617" opacity="0.7" />

            {/* Secondary Stacked Book in VIP/Unboxing Mode */}
            <rect
              x="92"
              y="30"
              width="172"
              height="156"
              rx="6"
              fill="#78552B"
              opacity="0.55"
              transform="rotate(-5 180 110)"
            />

            {/* Main Hand-Wrapped Archival Book Parcel */}
            <rect
              x="100"
              y="26"
              width="160"
              height="160"
              rx="6"
              fill={`url(#kraft-${uid})`}
              stroke="#5C4022"
              strokeWidth="1.5"
            />
            {/* Paper Fold Crease Lines */}
            <line x1="100" y1="26" x2="128" y2="54" stroke="#8C673E" strokeWidth="1" opacity="0.6" />
            <line x1="260" y1="26" x2="232" y2="54" stroke="#8C673E" strokeWidth="1" opacity="0.6" />

            {/* Braided Jute Twine Cross */}
            <line x1="100" y1="106" x2="260" y2="106" stroke="#4A3219" strokeWidth="4" strokeDasharray="7 2" />
            <line x1="180" y1="26" x2="180" y2="186" stroke="#4A3219" strokeWidth="4" strokeDasharray="7 2" />

            {/* Pressed Botanical Sprig */}
            <path d="M150 62 Q174 86 196 140" stroke="#365314" strokeWidth="2.2" fill="none" />
            <ellipse cx="158" cy="70" rx="7" ry="3.2" transform="rotate(-32 158 70)" fill="#65A30D" />
            <ellipse cx="166" cy="82" rx="7" ry="3.2" transform="rotate(24 166 82)" fill="#65A30D" />
            <ellipse cx="171" cy="92" rx="7" ry="3.2" transform="rotate(-24 171 92)" fill="#84CC16" />

            {/* 24k Gold Beeswax Seal */}
            <circle cx="180" cy="106" r="24" fill={`url(#gold-${uid})`} stroke="#FEF3C7" strokeWidth="1.5" />
            <circle cx="180" cy="106" r="17" fill="#92400E" stroke="#FDE68A" strokeWidth="1" />
            <ellipse cx="180" cy="107" rx="5.5" ry="7.5" fill="#FDE68A" />
            <ellipse cx="171" cy="104" rx="6.5" ry="3.5" transform="rotate(-22 171 104)" fill="#FFFBEB" opacity="0.9" />
            <ellipse cx="189" cy="104" rx="6.5" ry="3.5" transform="rotate(22 189 104)" fill="#FFFBEB" opacity="0.9" />

            {/* Deckle-Edge Typewriter Clue Card */}
            <rect x="120" y="140" width="120" height="34" rx="3" fill="#FAF7F2" stroke="#D6B588" strokeWidth="1" />
            <line x1="132" y1="152" x2="228" y2="152" stroke="#5C4022" strokeWidth="1.8" />
            <line x1="142" y1="162" x2="218" y2="162" stroke="#A1805B" strokeWidth="1.4" />

            {/* View-Specific Overlays */}
            {viewMode === "unboxing" && (
              <g>
                <rect x="268" y="64" width="66" height="114" rx="8" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
                <circle cx="301" cy="104" r="14" fill={`url(#gold-${uid})`} />
                <text x="301" y="144" textAnchor="middle" fill="#FDE68A" fontSize="8" fontFamily="monospace">
                  FREE VIP GIFT
                </text>
                <text x="301" y="156" textAnchor="middle" fill="#F8FAFC" fontSize="7" fontFamily="sans-serif">
                  Brass Clip
                </text>
              </g>
            )}
            {viewMode === "anatomy" && (
              <g stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 3">
                <line x1="56" y1="56" x2="108" y2="56" />
                <text x="52" y="53" textAnchor="end" fill="#FDE68A" fontSize="8" fontFamily="monospace">
                  80LB KRAFT
                </text>
                <line x1="252" y1="106" x2="306" y2="106" />
                <text x="310" y="109" fill="#FDE68A" fontSize="8" fontFamily="monospace">
                  WAX SEAL
                </text>
              </g>
            )}
            {viewMode === "ritual" && (
              <g>
                <path d="M58 140 Q52 118 62 102 Q70 86 60 68" stroke="#FDE68A" strokeWidth="1.8" fill="none" opacity="0.65" />
                <rect x="42" y="144" width="36" height="38" rx="6" fill="#B45309" stroke="#FDE68A" strokeWidth="1.2" />
                <text x="60" y="167" textAnchor="middle" fill="#FEF3C7" fontSize="7" fontFamily="monospace">
                  SOY 4OZ
                </text>
              </g>
            )}
          </svg>
        );

      case "ember-oak":
        return (
          <svg viewBox="0 0 360 230" className="w-full h-full" aria-hidden="true">
            <defs>
              <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#D97706" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`burl-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7C2D12" />
                <stop offset="50%" stopColor="#431407" />
                <stop offset="100%" stopColor="#1C1917" />
              </linearGradient>
            </defs>
            <circle cx="180" cy="115" r="102" fill={`url(#glow-${uid})`} />
            <ellipse cx="180" cy="198" rx="108" ry="12" fill="#020617" opacity="0.75" />

            {/* Burl Walnut & Spanish Cedar Humidor Chest */}
            <rect x="74" y="56" width="212" height="122" rx="8" fill={`url(#burl-${uid})`} stroke="#D97706" strokeWidth="2" />
            <rect x="84" y="66" width="192" height="102" rx="4" fill="#291206" stroke="#92400E" strokeWidth="1.2" />
            {/* Brass Quadrant Hinges & Lid Seam */}
            <line x1="74" y1="104" x2="286" y2="104" stroke="#F59E0B" strokeWidth="2.2" />
            <rect x="74" y="97" width="16" height="14" rx="2" fill="#F59E0B" />
            <rect x="270" y="97" width="16" height="14" rx="2" fill="#F59E0B" />

            {/* Precision Brass Hygrometer Dial */}
            <circle cx="180" cy="138" r="24" fill="#0C0A09" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="180" cy="138" r="18" fill="none" stroke="#FDE68A" strokeWidth="0.9" strokeDasharray="3 3" />
            <line x1="180" y1="138" x2="192" y2="124" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="180" cy="138" r="3.5" fill="#FDE68A" />
            <text x="180" y="152" textAnchor="middle" fill="#FDE68A" fontSize="7.5" fontFamily="monospace">
              70% RH
            </text>

            {viewMode === "unboxing" && (
              <g>
                <rect x="294" y="74" width="48" height="96" rx="6" fill="#18181B" stroke="#F59E0B" strokeWidth="1.5" />
                <text x="318" y="118" textAnchor="middle" fill="#FDE68A" fontSize="7" fontFamily="monospace">
                  CRYSTAL
                </text>
                <text x="318" y="130" textAnchor="middle" fill="#F8FAFC" fontSize="7" fontFamily="monospace">
                  REST FREE
                </text>
              </g>
            )}
            {viewMode === "ritual" && (
              <g>
                <path d="M180 52 Q170 32 184 18" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
                <text x="180" y="46" textAnchor="middle" fill="#38BDF8" fontSize="8" fontFamily="monospace">
                  QUAD-JET 1300°C
                </text>
              </g>
            )}
          </svg>
        );

      case "luma-clinical":
      case "dermasonic":
        return (
          <svg viewBox="0 0 360 230" className="w-full h-full" aria-hidden="true">
            <defs>
              <radialGradient id={`glow-${uid}`} cx="50%" cy="42%" r="52%">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.34" />
                <stop offset="55%" stopColor={accentColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`wand-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="50%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>
            <circle cx="180" cy="86" r="78" fill={`url(#glow-${uid})`} />
            <circle cx="180" cy="82" r="46" fill="none" stroke="#F43F5E" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />
            <circle cx="180" cy="82" r="62" fill="none" stroke={accentColor} strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
            <ellipse cx="180" cy="202" rx="76" ry="10" fill="#020617" opacity="0.75" />

            {/* 90-Degree Rotating Phototherapy LED Bar */}
            <rect x="122" y="52" width="116" height="30" rx="15" fill={`url(#wand-${uid})`} stroke={accentColor} strokeWidth="2.2" />
            {[138, 155, 172, 188, 205, 222].map((cx, i) => (
              <circle key={cx} cx={cx} cy="67" r="4.5" fill={i % 2 === 0 ? "#F43F5E" : "#38BDF8"} />
            ))}

            {/* Brushed Aluminum Ergonomic Stem */}
            <rect x="167" y="82" width="26" height="114" rx="13" fill={`url(#wand-${uid})`} stroke="#64748B" strokeWidth="1.5" />
            <rect x="173" y="114" width="14" height="36" rx="7" fill="#0F172A" />
            <circle cx="180" cy="124" r="3.5" fill={accentColor} />
            <text x="180" y="142" textAnchor="middle" fill="#F8FAFC" fontSize="6.5" fontFamily="monospace">
              660nm
            </text>

            {/* Included Conductive Peptide Serum Bottle */}
            <g transform="translate(238, 108)">
              <rect x="10" y="0" width="12" height="14" rx="2" fill="#E2E8F0" />
              <rect x="4" y="14" width="24" height="62" rx="6" fill="#0EA5E9" opacity="0.85" stroke="#BAE6FD" strokeWidth="1.2" />
              <text x="16" y="48" textAnchor="middle" fill="#F8FAFC" fontSize="6.5" fontFamily="monospace">
                PEPTIDE
              </text>
            </g>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 360 230" className="w-full h-full" aria-hidden="true">
            <defs>
              <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`body-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
            <circle cx="180" cy="112" r="88" fill={`url(#glow-${uid})`} />
            <ellipse cx="180" cy="198" rx="86" ry="11" fill="#020617" opacity="0.7" />
            <rect
              x="116"
              y="44"
              width="128"
              height="132"
              rx="24"
              fill={`url(#body-${uid})`}
              stroke={accentColor}
              strokeWidth="2.2"
            />
            <circle cx="180" cy="102" r="28" fill="#090D16" stroke={secondaryColor} strokeWidth="1.8" />
            <circle cx="180" cy="102" r="10" fill={accentColor} />
            <line x1="142" y1="150" x2="218" y2="150" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-b from-[#0E1526] via-[#0B101D] to-[#080B14] border-b border-slate-800/80 flex flex-col justify-between p-5 select-none group ${
        interactive ? "min-h-[390px]" : aspectRatio === "16:9" ? "aspect-video" : "aspect-[4/3]"
      }`}
    >
      {/* Top Studio Header Bar — Clean Unboxed Metadata with Middot Separators */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 z-10 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="font-medium text-slate-300 truncate">{category}</span>
          {activeEdition && (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ color: accentColor }} className="font-medium truncate">
                {activeEdition}
              </span>
            </>
          )}
        </div>
        <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
          24h Utah Dispatch
        </span>
      </div>

      {/* Central Vector Studio Canvas + Optional Interactive Hotspot Pins */}
      <div className="relative flex-1 flex items-center justify-center my-2 min-h-[220px]">
        <div
          className={`w-full flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-[1.02] ${
            interactive ? "h-56" : "h-full"
          }`}
        >
          {renderDomainIllustration()}
        </div>

        {/* Interactive Engineering & Craftsmanship Hotspots (Hero Mode) */}
        {interactive && (
          <div className="absolute inset-0 pointer-events-none">
            {hotspots.map((spot, idx) => {
              const isSelected = activeHotspot === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveHotspot(isSelected ? null : idx)}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    borderColor: isSelected ? "#FFFFFF" : accentColor,
                    backgroundColor: isSelected ? accentColor : "#090D16",
                    color: isSelected ? "#090D16" : "#FFFFFF",
                  }}
                  aria-label={`Inspect specification ${idx + 1}: ${spot.label}`}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 text-[11px] font-mono font-bold flex items-center justify-center shadow-lg transition-transform duration-150 hover:scale-110"
                >
                  0{idx + 1}
                </button>
              );
            })}

            {activeHotspot !== null && hotspots[activeHotspot] && (
              <div className="pointer-events-auto absolute bottom-1 right-1 w-72 max-w-[90%] p-3 rounded-lg bg-[#090D16]/95 border border-slate-700 shadow-2xl text-xs space-y-1 backdrop-blur-md z-20">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span style={{ color: accentColor }}>
                    SPECIFICATION 0{activeHotspot + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="font-semibold text-white">
                  {hotspots[activeHotspot].label}
                </div>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {hotspots[activeHotspot].detail}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Studio Control / Caption Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/70 z-10 text-xs shrink-0">
        {interactive ? (
          <div
            role="tablist"
            aria-label="Product studio camera angles"
            className="flex items-center gap-1 bg-[#090D16] p-1 rounded-lg border border-slate-800 overflow-x-auto"
          >
            {(
              [
                { id: "studio", label: "01. Studio" },
                { id: "anatomy", label: "02. Blueprint" },
                { id: "unboxing", label: "03. VIP Gift" },
                { id: "ritual", label: "04. In Ritual" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={viewMode === mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === mode.id
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="truncate font-medium text-slate-300">{title}</span>
        )}

        <span
          style={{ color: accentColor }}
          className="font-mono text-[11px] font-semibold shrink-0 ml-auto"
        >
          {interactive ? "Click 01–03 Pins to Inspect" : "In Stock"}
        </span>
      </div>
    </div>
  );
}
