"use client";

import React from "react";

interface StoreProductVisualProps {
  storeId: string;
  productIndex?: number;
  accentColor: string;
  secondaryColor?: string;
  title: string;
  category?: string;
  aspectRatio?: "16:9" | "4:3";
}

export default function StoreProductVisual({
  storeId,
  productIndex = 0,
  accentColor,
  secondaryColor = "#F8FAFC",
  title,
  category = "Flagship Edition",
  aspectRatio = "4:3",
}: StoreProductVisualProps) {
  const renderDomainIllustration = () => {
    switch (storeId) {
      case "bizi-bees":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id={`kraft-${productIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D6B588" />
                <stop offset="100%" stopColor="#B0895A" />
              </linearGradient>
            </defs>
            <rect x="75" y="32" width="170" height="154" rx="6" fill="#8C673E" opacity="0.45" transform="rotate(-4 160 110)" />
            <rect x="80" y="28" width="160" height="156" rx="5" fill={`url(#kraft-${productIndex})`} stroke="#78552B" strokeWidth="1.5" />
            <line x1="80" y1="106" x2="240" y2="106" stroke="#5C4022" strokeWidth="3.5" strokeDasharray="6 2" />
            <line x1="160" y1="28" x2="160" y2="184" stroke="#5C4022" strokeWidth="3.5" strokeDasharray="6 2" />
            <path d="M135 72 Q155 90 175 138" stroke="#3F6212" strokeWidth="2" fill="none" />
            <ellipse cx="142" cy="78" rx="6" ry="3" transform="rotate(-30 142 78)" fill="#65A30D" />
            <ellipse cx="148" cy="88" rx="6" ry="3" transform="rotate(25 148 88)" fill="#65A30D" />
            <ellipse cx="152" cy="96" rx="6" ry="3" transform="rotate(-25 152 96)" fill="#84CC16" />
            <circle cx="160" cy="106" r="22" fill="#D97706" stroke="#FDE68A" strokeWidth="2" />
            <circle cx="160" cy="106" r="16" fill="#B45309" stroke="#FCD34D" strokeWidth="1" />
            <ellipse cx="160" cy="107" rx="5" ry="7" fill="#FDE68A" />
            <ellipse cx="152" cy="104" rx="6" ry="3.5" transform="rotate(-20 152 104)" fill="#FEF3C7" opacity="0.85" />
            <ellipse cx="168" cy="104" rx="6" ry="3.5" transform="rotate(20 168 104)" fill="#FEF3C7" opacity="0.85" />
            <rect x="104" y="138" width="112" height="30" rx="3" fill="#FAF7F2" stroke="#D6B588" strokeWidth="1" />
            <line x1="116" y1="149" x2="204" y2="149" stroke="#78552B" strokeWidth="1.5" />
            <line x1="126" y1="158" x2="194" y2="158" stroke="#A1805B" strokeWidth="1.5" />
          </svg>
        );

      case "ember-oak":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            <rect x="64" y="62" width="192" height="114" rx="8" fill="#5C2D0C" stroke="#B45309" strokeWidth="2" />
            <rect x="72" y="70" width="176" height="98" rx="4" fill="#431E05" stroke="#92400E" strokeWidth="1.2" />
            <line x1="64" y1="106" x2="256" y2="106" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="160" cy="138" r="22" fill="#1C1917" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="160" cy="138" r="17" fill="none" stroke="#FDE68A" strokeWidth="0.75" strokeDasharray="3 3" />
            <line x1="160" y1="138" x2="171" y2="127" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <circle cx="160" cy="138" r="3" fill="#FDE68A" />
            <rect x="64" y="100" width="14" height="12" fill="#D97706" />
            <rect x="242" y="100" width="14" height="12" fill="#D97706" />
          </svg>
        );

      case "luma-clinical":
      case "dermasonic":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            <circle cx="160" cy="78" r="46" fill={accentColor} opacity="0.18" />
            <circle cx="160" cy="78" r="30" fill="#EF4444" opacity="0.22" />
            <rect x="112" y="54" width="96" height="26" rx="13" fill="#E2E8F0" stroke={accentColor} strokeWidth="2" />
            {[128, 144, 160, 176, 192].map((cx) => (
              <circle key={cx} cx={cx} cy="67" r="4" fill="#F43F5E" />
            ))}
            <rect x="149" y="80" width="22" height="108" rx="11" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
            <rect x="154" y="114" width="12" height="28" rx="6" fill="#0F172A" />
            <circle cx="160" cy="122" r="3" fill={accentColor} />
          </svg>
        );

      case "luma-relief":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            <circle cx="160" cy="110" r="64" fill="#8B5CF6" opacity="0.14" />
            {/* 360 Cold Compression Hydrogel Cap */}
            <path d="M96 135 C96 72 224 72 224 135 L212 152 Q160 132 108 152 Z" fill="#2E1065" stroke="#8B5CF6" strokeWidth="2.5" />
            <path d="M104 114 Q160 98 216 114" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeDasharray="5 3" />
            <path d="M144 143 Q160 126 176 143" stroke="#C4B5FD" strokeWidth="2" fill="none" />
          </svg>
        );

      case "fizz-lab":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {[104, 160, 216].map((x, idx) => (
              <g key={x}>
                <rect x={x - 3} y="32" width="6" height="22" fill="#F59E0B" />
                <path d={`M${x - 8} 32 L${x + 14} 32 L${x + 18} 38`} stroke="#FDE68A" strokeWidth="3" fill="none" strokeLinecap="round" />
                <rect x={x - 8} y="54" width="16" height="22" rx="3" fill="#334155" />
                <rect
                  x={x - 20}
                  y="74"
                  width="40"
                  height="112"
                  rx="8"
                  fill={idx === 0 ? "#F43F5E" : idx === 1 ? "#F59E0B" : "#06B6D4"}
                  opacity="0.88"
                  stroke="#F8FAFC"
                  strokeWidth="1.2"
                />
                <rect x={x - 15} y="102" width="30" height="52" rx="3" fill="#FAF7F2" />
                <line x1={x - 10} y1="118" x2={x + 10} y2="118" stroke="#0F172A" strokeWidth="2" />
                <line x1={x - 8} y1="130" x2={x + 8} y2="130" stroke="#64748B" strokeWidth="1.5" />
              </g>
            ))}
          </svg>
        );

      case "crave-lab":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            <rect x="66" y="38" width="188" height="144" rx="10" fill="#27170E" stroke="#D97706" strokeWidth="2" />
            {[80, 124, 168, 212].map((x, idx) => (
              <g key={x}>
                <rect
                  x={x - 2}
                  y="52"
                  width="34"
                  height="116"
                  rx="4"
                  fill={idx % 2 === 0 ? "#3E2112" : "#5A321C"}
                  stroke="#92400E"
                  strokeWidth="1"
                />
                <rect x={x - 2} y="114" width="34" height="54" rx="3" fill="#D97706" />
                <line x1={x + 4} y1="68" x2={x + 26} y2="68" stroke="#78350F" strokeWidth="2" />
                <line x1={x + 4} y1="86" x2={x + 26} y2="86" stroke="#78350F" strokeWidth="2" />
              </g>
            ))}
          </svg>
        );

      case "aura-sculpt":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Seamless Studio Top + High-Waist Legging Silhouette */}
            <path d="M126 36 L142 36 L146 58 L174 58 L178 36 L194 36 L198 84 L122 84 Z" fill="#065F46" stroke="#10B981" strokeWidth="2" />
            <path d="M126 94 L194 94 L204 186 L172 186 L160 128 L148 186 L116 186 Z" fill="#047857" stroke="#34D399" strokeWidth="2" />
            <line x1="127" y1="108" x2="193" y2="108" stroke="#6EE7B7" strokeWidth="1.5" strokeDasharray="4 2" />
          </svg>
        );

      case "pawglow":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Ultrasonic Cool Mist Cloud + Brush Head */}
            <circle cx="160" cy="60" r="24" fill="#A855F7" opacity="0.2" />
            <circle cx="140" cy="52" r="14" fill="#D8B4FE" opacity="0.25" />
            <circle cx="180" cy="52" r="14" fill="#D8B4FE" opacity="0.25" />
            <ellipse cx="160" cy="96" rx="54" ry="30" fill="#1E1B4B" stroke="#A855F7" strokeWidth="2.5" />
            <circle cx="160" cy="96" r="10" fill="#C084FC" />
            <rect x="148" y="126" width="24" height="62" rx="12" fill="#312E81" stroke="#A855F7" strokeWidth="2" />
          </svg>
        );

      case "zenith-sleep":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* 3D Contoured Bluetooth Blackout Sleep Mask */}
            <path d="M74 108 C74 74 134 74 160 92 C186 74 246 74 246 108 C246 142 192 146 160 124 C128 146 74 142 74 108 Z" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2.5" />
            <ellipse cx="118" cy="108" rx="26" ry="16" fill="#0F172A" stroke="#818CF8" strokeWidth="1.5" />
            <ellipse cx="202" cy="108" rx="26" ry="16" fill="#0F172A" stroke="#818CF8" strokeWidth="1.5" />
            <circle cx="86" cy="108" r="5" fill="#A5B4FC" />
            <circle cx="234" cy="108" r="5" fill="#A5B4FC" />
          </svg>
        );

      case "aura-posture":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Figure-8 Smart Haptic Posture Sensor */}
            <path d="M116 54 C84 54 84 136 132 126 M204 54 C236 54 236 136 188 126" stroke="#334155" strokeWidth="12" fill="none" strokeLinecap="round" />
            <rect x="134" y="82" width="52" height="64" rx="16" fill="#0F172A" stroke="#14B8A6" strokeWidth="2.5" />
            <circle cx="160" cy="106" r="12" fill="#134E4A" stroke="#2DD4BF" strokeWidth="2" />
            <circle cx="160" cy="106" r="4" fill="#5EEAD4" />
          </svg>
        );

      case "lumicarve":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Precision CNC Cordless Micro-Engraving Pen */}
            <g transform="rotate(-28 160 110)">
              <rect x="148" y="34" width="24" height="126" rx="6" fill="#334155" stroke="#EAB308" strokeWidth="2" />
              <rect x="152" y="64" width="16" height="32" rx="3" fill="#0F172A" />
              <line x1="148" y1="120" x2="172" y2="120" stroke="#FDE047" strokeWidth="2" />
              <polygon points="152,160 168,160 163,182 157,182" fill="#94A3B8" />
              <line x1="160" y1="182" x2="160" y2="202" stroke="#FDE047" strokeWidth="2.5" />
              <circle cx="160" cy="202" r="5" fill="#FEF08A" />
            </g>
          </svg>
        );

      case "calmcore":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Weighted 12-Channel Quilted Herbal Shoulder & Neck Wrap */}
            <path d="M82 128 C82 64 238 64 238 128 C238 158 202 168 190 144 C180 122 140 122 130 144 C118 168 82 158 82 128 Z" fill="#164E63" stroke="#06B6D4" strokeWidth="2.5" />
            <line x1="122" y1="78" x2="132" y2="138" stroke="#67E8F9" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="160" y1="70" x2="160" y2="126" stroke="#67E8F9" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="198" y1="78" x2="188" y2="138" stroke="#67E8F9" strokeWidth="1.2" strokeDasharray="3 3" />
          </svg>
        );

      case "floraspring":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Set of 4 Olla Terracotta Self-Watering Spikes */}
            {[96, 138, 182, 224].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="68" rx="15" ry="7" fill="#9A3412" stroke="#F97316" strokeWidth="1.5" />
                <polygon points={`${x - 14},70 ${x + 14},70 ${x + 3},174 ${x - 3},174`} fill="#C2410C" stroke="#EA580C" strokeWidth="1.2" />
                <path d={`M${x} 58 Q${x - 10} 40 ${x - 22} 46`} stroke="#22C55E" strokeWidth="2" fill="none" />
                <ellipse cx={x - 16} cy="45" rx="7" ry="3.5" fill="#22C55E" />
              </g>
            ))}
          </svg>
        );

      case "velobrew":
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            {/* Cordless 20-Bar Portable Espresso Maker */}
            <rect x="122" y="34" width="76" height="148" rx="16" fill="#1C1917" stroke="#F97316" strokeWidth="2.5" />
            <line x1="122" y1="74" x2="198" y2="74" stroke="#EA580C" strokeWidth="2" />
            <line x1="122" y1="142" x2="198" y2="142" stroke="#44403C" strokeWidth="2" />
            <circle cx="160" cy="108" r="14" fill="#0C0A09" stroke="#F97316" strokeWidth="2" />
            <text x="160" y="112" textAnchor="middle" fill="#FDBA74" fontSize="10" fontFamily="monospace">93°C</text>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 320 220" className="w-full h-full" aria-hidden="true">
            <circle cx="160" cy="108" r="72" fill={accentColor} opacity="0.16" />
            <rect x="114" y="52" width="92" height="108" rx="22" fill="#0F172A" stroke={accentColor} strokeWidth="2.2" />
            <circle cx="160" cy="96" r="22" fill="none" stroke={secondaryColor} strokeWidth="2" />
            <circle cx="160" cy="96" r="8" fill={accentColor} />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#0D1322] border-b border-slate-800/80 flex flex-col justify-between p-4 select-none ${
        aspectRatio === "16:9" ? "aspect-video" : "aspect-[4/3]"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-slate-400 z-10">
        <span className="uppercase tracking-wider font-medium truncate">{category}</span>
        <span className="font-mono text-slate-500">24h Utah Hub</span>
      </div>

      <div className="flex-1 flex items-center justify-center my-1">{renderDomainIllustration()}</div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 z-10 pt-1 border-t border-slate-800/60">
        <span className="truncate font-medium text-slate-300">{title}</span>
        <span style={{ color: accentColor }} className="font-mono font-semibold shrink-0 ml-2">
          Verified
        </span>
      </div>
    </div>
  );
}
