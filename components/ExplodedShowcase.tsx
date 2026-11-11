"use client";

/**
 * Exploded-view scrollytelling showcase.
 *
 * Three stages over one pinned viewport:
 *   1. the product floats, headline behind it;
 *   2. it separates into its layers with callout lines;
 *   3. the layers reassemble and a bundle box rises around them.
 *
 * Deliberately built without GSAP/Lenis/CDN: the animation is driven by
 * `requestAnimationFrame` from scroll position, so it works with no third-party
 * script, no network, and no CSP exceptions. If JS never runs, or the visitor
 * prefers reduced motion, the section renders as a plain static anatomy list
 * with a working Add-to-bag button — never as blank space.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExplodedShowcase } from "@/lib/exploded-showcase";

export interface ExplodedShowcaseProps {
  showcase: ExplodedShowcase;
  /** Called with the bundle's product ids when the CTA is pressed. */
  onAddBundle: (productIds: string[]) => void;
  /** Optional: open the cart drawer after adding. */
  onOpenCart?: () => void;
}

type Stage = 1 | 2 | 3;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Linear progress from 0..1 between two scroll fractions. */
const segment = (progress: number, from: number, to: number) =>
  clamp01((progress - from) / (to - from));

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function ExplodedShowcase({
  showcase,
  onAddBundle,
  onOpenCart,
}: ExplodedShowcaseProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [added, setAdded] = useState(false);

  const stage: Stage = progress < 0.3 ? 1 : progress < 0.72 ? 2 : 3;

  // Respect the OS setting. Also the fallback for anyone on a low-end device
  // where a pinned 3.2-viewport section is a battery and jank problem.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // One rAF loop, passive listener, no layout thrash: we read scrollTop once per
  // frame and write transforms from state.
  useEffect(() => {
    if (reducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;

    let frame = 0;
    let ticking = false;

    const measure = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) {
        setProgress(0);
        return;
      }
      setProgress(clamp01(-rect.top / scrollable));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  const addBundle = useCallback(() => {
    onAddBundle(showcase.bundle.includes);
    setAdded(true);
    onOpenCart?.();
  }, [onAddBundle, onOpenCart, showcase.bundle.includes]);

  // Stage maths, computed once per render from `progress`.
  const explode = easeInOut(segment(progress, 0.18, 0.55));
  const reassemble = easeInOut(segment(progress, 0.72, 0.95));
  const calloutOpacity = segment(progress, 0.3, 0.45) * (1 - segment(progress, 0.68, 0.78));
  const companionIn = easeOut(segment(progress, 0.78, 0.92));
  const boxIn = easeOut(segment(progress, 0.84, 1));
  const headlineFade = 1 - segment(progress, 0.05, 0.35);
  const headlineScale = 1 - 0.18 * segment(progress, 0.05, 0.35);

  const saving = useMemo(
    () => Math.max(0, showcase.bundle.compareAtPrice - showcase.bundle.price),
    [showcase.bundle]
  );

  // ---------------------------------------------------------------- fallback
  if (reducedMotion) {
    return (
      <section
        aria-label={`${showcase.productName} anatomy`}
        className="mx-auto max-w-5xl px-6 py-16"
      >
        <h2 className="text-3xl font-semibold tracking-tight">{showcase.productName}</h2>
        <p className="mt-2 text-sm text-neutral-500">{showcase.productSpec}</p>
        <ol className="mt-8 space-y-4">
          {showcase.layers.map((layer) => (
            <li key={layer.title} className="border-l-2 border-neutral-300 pl-4">
              <p className="text-sm font-semibold">{layer.title}</p>
              <p className="text-sm text-neutral-500">{layer.spec}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={addBundle}
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
          >
            {added ? "Added to bag" : `Add ${showcase.bundle.title} · $${showcase.bundle.price}`}
          </button>
          {saving > 0 && <span className="text-sm text-neutral-500">Save ${saving.toFixed(2)}</span>}
        </div>
      </section>
    );
  }

  // ------------------------------------------------------------------ pinned
  return (
    <section
      ref={sectionRef}
      aria-label={`${showcase.productName} exploded view`}
      className="relative h-[320vh] bg-neutral-950 text-white"
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Stage 1: kinetic backdrop typography */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
          style={{ opacity: headlineFade, transform: `scale(${headlineScale})` }}
        >
          <span className="select-none text-center text-[13vw] font-black uppercase leading-[0.85] tracking-tighter text-white/[0.07]">
            {showcase.backdropHeadline}
          </span>
        </div>

        {/* Layers */}
        <div className="relative h-full w-full max-w-6xl px-4" style={{ perspective: "1200px" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-0 w-[min(78vw,520px)]">
              {showcase.layers.map((layer, i) => {
                const separated = layer.offsetY * explode * (1 - reassemble);
                const rotation = 14 * explode * (1 - reassemble);
                const scale = 1 + 0.04 * explode - 0.12 * reassemble;
                return (
                  <div
                    key={layer.title}
                    className="absolute left-0 right-0 top-0 will-change-transform"
                    style={{
                      transform: `translate3d(0, ${separated}px, 0) rotateX(${rotation}deg) rotateY(${-rotation * 0.85}deg) scale(${scale})`,
                    }}
                  >
                    <div
                      className={`h-16 w-full rounded-2xl bg-gradient-to-br ${layer.plate} shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/10`}
                    />
                    {/* Callout: hidden from AT — the fallback list carries the text */}
                    <div
                      aria-hidden="true"
                      className="absolute left-full top-1/2 hidden w-64 -translate-y-1/2 items-center gap-3 md:flex"
                      style={{
                        opacity: calloutOpacity,
                        transform: `translate(${40 * (1 - calloutOpacity)}px, -50%)`,
                      }}
                    >
                      <span className="h-px w-10 bg-white/40" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-white">
                          {layer.title}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-white/60">{layer.spec}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage 3: companions fly in */}
          {showcase.companions.map((name, i) => {
            const dir = i === 0 ? -1 : 1;
            return (
              <div
                key={name}
                className="absolute top-1/2 hidden -translate-y-1/2 md:block"
                style={{
                  [dir < 0 ? "left" : "right"]: "6%",
                  opacity: companionIn,
                  transform: `translate(${dir * -160 * (1 - companionIn)}px, -50%) rotate(${dir * -4}deg)`,
                }}
              >
                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-medium backdrop-blur">
                  + {name}
                </div>
              </div>
            );
          })}

          {/* Stage 3: the box */}
          <div
            className="absolute inset-x-0 bottom-[8vh] mx-auto max-w-md px-4"
            style={{
              opacity: boxIn,
              transform: `translateY(${140 * (1 - boxIn)}px) scale(${0.9 + 0.1 * boxIn})`,
            }}
          >
            <div className="rounded-3xl border border-white/15 bg-neutral-900/90 p-6 text-center shadow-2xl backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                {showcase.bundle.tag}
              </p>
              <h3 className="mt-2 text-lg font-bold uppercase tracking-tight">
                {showcase.bundle.title}
              </h3>
              <p className="mt-2 flex items-baseline justify-center gap-2">
                <span className="text-2xl font-bold">${showcase.bundle.price.toFixed(2)}</span>
                <s className="text-sm text-white/40">
                  ${showcase.bundle.compareAtPrice.toFixed(2)}
                </s>
              </p>
              <button
                type="button"
                onClick={addBundle}
                className="mt-4 w-full rounded-full bg-white px-6 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {added ? "Added to bag ✓" : "Add complete box to bag →"}
              </button>
            </div>
          </div>
        </div>

        {/* HUD */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 px-6 pb-4 text-[10px] font-medium uppercase tracking-wider text-white/50">
          <span className="whitespace-nowrap">
            {stage === 1 ? "01 / Overview" : stage === 2 ? "02 / Exploded anatomy" : "03 / The complete box"}
          </span>
          <div className="h-px flex-1 bg-white/15">
            <div className="h-px bg-white/70" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span className="hidden whitespace-nowrap sm:inline">Scroll to deconstruct ↓</span>
        </div>
      </div>
    </section>
  );
}
