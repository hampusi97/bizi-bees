/**
 * compile-15-stores-master.mjs — Phase 3 theme compiler
 * Compiles all 15 root-valid Shopify 2.0 themes into .build-themes/
 * Invoked by ArchitectBot / OmegaBot. Can be re-run to rebuild all themes.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BUILD = join(ROOT, ".build-themes");

const stores = JSON.parse(readFileSync(join(ROOT, "config", "stores-15.config.json"), "utf8")).stores;

function ensure(dir) { mkdirSync(dir, { recursive: true }); }
function write(rel, content) {
  const full = join(ROOT, rel);
  ensure(full.replace(/\/[^/]*$/, ""));
  writeFileSync(full, content);
  process.stdout.write(`[compile] wrote ${rel}\n`);
}

let themes = 0;
for (const store of stores) {
  const root = join(BUILD, store.id);
  for (const d of ["layout","sections","templates","snippets","assets","config","locales"]) {
    ensure(join(root, d));
  }
  const acc = store.palette.accent;

  write(`.build-themes/${store.id}/layout/theme.liquid`, `
<!doctype html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{{ page_title }} | ${store.name}</title>{{ content_for_header }}<link rel="stylesheet" href="{{ 'theme.css' | asset_url }}"></head>
<body><a class="skip-link" href="#main-content">Skip to content</a>{% section 'scrollytelling-hero' %}<section id="main-content">{% section 'product-grid' %}</section><section class="loyalty-pill-wrap">{% include 'loyalty-vip-club' %}</section>{% section 'footer' %}<script src="{{ 'theme.js' | asset_url }}"></script></body></html>
`);

  write(`.build-themes/${store.id}/config/settings_data.json`, JSON.stringify({
    colors: { background: store.palette.background, accent: store.palette.accent, surface: store.palette.surface },
    typography: { body: "system-ui,-apple-system,sans-serif", heading: "system-ui,-apple-system,sans-serif" },
  }, null, 2));

  write(`.build-themes/${store.id}/config/settings_schema.json`, JSON.stringify({
    name: `${store.name} Theme`,
    settings: [
      { type: "color", id: "accent_color", label: "Accent color", default: store.palette.accent },
      { type: "color", id: "background_color", label: "Background", default: store.palette.background },
    ],
  }, null, 2));

  write(`.build-themes/${store.id}/locales/en.default.json`, JSON.stringify({
    general: { skip_to_content: "Skip to content", add_to_bag: "Add to Bag" },
    loyalty: { club: store.vipClub, points: "VIP Points", refer: "Give $15, Get $15" },
  }, null, 2));

  const layers = store.explodedLayers.map((l,i)=>`<div class="exploded-layer" data-layer="${i+1}">${escape(l)}</div>`).join("\n");
  write(`.build-themes/${store.id}/sections/scrollytelling-hero.liquid`, `
{% comment %}3D Isometric SVG Exploded Scrollytelling Hero - ${store.explodedHero}{% endcomment %}
<section class="scrollytelling-hero" id="scrollytelling-hero" data-store="${store.id}">
  <div class="hero-spotlight"></div>
  <h1 class="hero-typo">${escape(store.explodedHero)}</h1>
  <div class="product-3d" id="product-3d">${layers}</div>
  <div class="cta-wrap"><button class="cta-unlock" id="unlock-box">Unlock Complete Box</button></div>
</section>
`);

  write(`.build-themes/${store.id}/sections/product-grid.liquid`, `<section class="product-grid"><h2 class="section-title">Featured Products</h2><div class="grid" id="product-grid"></div></section>`);
  write(`.build-themes/${store.id}/sections/footer.liquid`, `<footer class="site-footer"><p>${escape(store.name)} &mdash; ${store.domain}</p><p>${escape(store.vipClub)}</p></footer>`);

  const m = store.cartMilestones.map(ms=>`<div class="milestone" data-threshold="${ms.threshold}">${ms.threshold} &mdash; ${escape(ms.reward)}</div>`).join("\n");
  write(`.build-themes/${store.id}/snippets/cart-drawer.liquid`, `<div class="cart-drawer" id="cart-drawer" aria-hidden="true"><h3>Your Cart</h3><div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div><div class="milestones">${m}</div><div class="cart-items" id="cart-items"></div><div class="vip-points">VIP Points: <span id="vip-points">0</span></div><button class="checkout-btn">Checkout</button></div>`);
  write(`.build-themes/${store.id}/snippets/loyalty-vip-club.liquid`, `<div class="loyalty-pill" id="loyalty-pill"><span class="club-name">${escape(store.vipClub)}</span><span class="points">10 pts per $1</span><button class="voucher" data-code="WELCOME15">WELCOME15</button><button class="voucher" data-code="BUNDLE20">BUNDLE20</button><span class="referral">Give $15, Get $15</span></div>`);
  write(`.build-themes/${store.id}/snippets/json-ld-schema.liquid`, `<script type="application/ld+json">{ "@context": "https://schema.org/", "@type": "Product", "name": "${escape(store.explodedHero)}", "brand": "${escape(store.name)}", "url": "https://${store.domain}/" }</script>`);

  write(`.build-themes/${store.id}/templates/index.json`, JSON.stringify({ sections: { scrollytelling: { type: "scrollytelling-hero" }, grid: { type: "product-grid" } } }, null, 2));
  write(`.build-themes/${store.id}/templates/product.json`, JSON.stringify({ sections: { product: { type: "product-grid" } } }, null, 2));
  write(`.build-themes/${store.id}/templates/cart.json`, JSON.stringify({ sections: { cart: { type: "product-grid" } } }, null, 2));

  write(`.build-themes/${store.id}/assets/theme.js`, `(function(){const u=document.getElementById('unlock-box');if(u)u.addEventListener('click',()=>alert('Box unlocked for ${store.name}!'));const layers=document.querySelectorAll('.exploded-layer');if(layers.length)window.addEventListener('scroll',()=>{const p=window.scrollY/Math.max(window.innerHeight,1);layers.forEach((el,i)=>{const pr=Math.max(0,Math.min(1,(p-i*0.18)/0.25));el.style.transform='translateY('+(-pr*120)+'px) scale('+(1-pr*0.15)+')';el.style.opacity=0.5+pr*0.5;});});})();`);
  write(`.build-themes/${store.id}/assets/theme.css`, `
:root{--bg:${store.palette.background};--surface:${store.palette.surface};--accent:${acc};}
body{background:var(--bg);color:#fff;font-family:system-ui,-apple-system,sans-serif;margin:0;}
.scrollytelling-hero{position:relative;height:100vh;min-height:600px;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;}
.hero-spotlight{position:absolute;inset:-10%;background:radial-gradient(circle at 50% 35%,rgba(255,255,255,0.14),transparent 55%);z-index:0;pointer-events:none;}
.hero-typo{position:relative;z-index:2;font-size:clamp(1.75rem,5vw,4rem);letter-spacing:-0.03em;text-transform:uppercase;margin:0 0 1rem 0;}
.product-3d{position:relative;z-index:2;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;perspective:1400px;}
.exploded-layer{background:var(--surface);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:1.5rem 1rem;text-align:center;transition:transform .5s cubic-bezier(.4,0,.2,1),opacity .5s ease;opacity:0.55;max-width:260px;}
.exploded-layer:hover{border-color:var(--accent);transform:translateY(-4px);}
.cta-wrap{position:relative;z-index:2;margin-top:2rem;}
.cta-unlock{background:var(--accent);color:#000;border:none;border-radius:10px;padding:1rem 2.25rem;font-weight:800;cursor:pointer;}
.cart-drawer{position:fixed;inset:0 0 auto 38%;background:var(--surface);padding:1.5rem;border-top:1px solid rgba(255,255,255,0.1);z-index:50;display:none;width:min(60vw,420px);}
.cart-drawer .progress-bar{height:7px;background:rgba(255,255,255,0.12);border-radius:4px;margin:.6rem 0;overflow:hidden;}
.cart-drawer .progress-fill{height:100%;background:var(--accent);width:0%;transition:width .35s ease;}
.loyalty-pill-wrap{position:fixed;bottom:1.5rem;left:1.5rem;z-index:60;}
.loyalty-pill{background:var(--surface);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:.55rem 1.1rem;color:#fff;font-size:.82rem;display:flex;gap:.75rem;align-items:center;}
.loyalty-pill button{background:var(--accent);color:#000;border:none;border-radius:8px;padding:.35rem .85rem;font-weight:700;cursor:pointer;}
.site-footer{padding:2.5rem 1rem;border-top:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);font-size:.85rem;text-align:center;}
@media(max-width:640px){.cart-drawer{inset:0 0 auto 0;width:100%;}.product-3d{gap:.75rem;}.exploded-layer{max-width:200px;padding:1rem .75rem;}}
`);

  themes++;
  process.stdout.write(`[compile] theme complete: ${store.id}\n`);
}

process.stdout.write(`[compile] TOTAL: ${themes} root-valid Shopify 2.0 themes in .build-themes/\n`);

function escape(s){return String(s).replace(/[&<>"']/g,(c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);}
