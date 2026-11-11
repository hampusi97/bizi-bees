/**
 * Autonomous Multi-Armed Bandit (MAB) Testing Engine
 * File: lib/algorithms/multi-armed-bandit.ts
 * Epsilon-Greedy dynamic allocation algorithm for self-optimizing storefront experiments.
 */

export interface ExperimentVariant {
  id: string;
  name: string;
  value: unknown;
  impressions: number;
  conversions: number; // Completed Add-to-Carts or Purchases
  weight: number;
}

export interface Experiment {
  id: string;
  name: string;
  epsilon: number; // e.g. 0.1 = 10% explore random, 90% exploit winning variant
  variants: ExperimentVariant[];
  createdAt: number;
  lastUpdated: number;
}

export interface VariantDecision {
  experimentId: string;
  selectedVariantId: string;
  name: string;
  value: unknown;
  isExploration: boolean;
  conversionRate: number;
}

export class MultiArmedBanditEngine {
  private experiments: Map<string, Experiment> = new Map();

  constructor() {
    this.seedDefaultExperiments();
  }

  private seedDefaultExperiments(): void {
    // 1. Free Shipping Threshold Experiment ($35 vs $50 vs $65)
    this.experiments.set("free-shipping-threshold", {
      id: "free-shipping-threshold",
      name: "Dynamic Cart Free Shipping Threshold",
      epsilon: 0.1, // 10% explore, 90% exploit
      createdAt: Date.now() - 86400000 * 3,
      lastUpdated: Date.now(),
      variants: [
        {
          id: "tier-35",
          name: "$35 Free Shipping Threshold",
          value: { thresholdDollars: 35, thresholdCents: 3500 },
          impressions: 420,
          conversions: 15, // 3.57% CR
          weight: 0.33,
        },
        {
          id: "tier-50",
          name: "$50 Free Shipping Threshold (Editorial Default)",
          value: { thresholdDollars: 50, thresholdCents: 5000 },
          impressions: 890,
          conversions: 43, // 4.83% CR (Winner)
          weight: 0.34,
        },
        {
          id: "tier-65",
          name: "$65 Free Shipping Threshold",
          value: { thresholdDollars: 65, thresholdCents: 6500 },
          impressions: 210,
          conversions: 6, // 2.85% CR
          weight: 0.33,
        },
      ],
    });

    // 2. Editorial Hero Headline Experiment (Bizi Bees Boutique)
    this.experiments.set("hero-headline", {
      id: "hero-headline",
      name: "Bizi Bees Editorial Hero Headline",
      epsilon: 0.1,
      createdAt: Date.now() - 86400000 * 2,
      lastUpdated: Date.now(),
      variants: [
        {
          id: "headline-curated",
          name: "Curated Pre-Loved Literature, Timeless Games & Everyday Gifts",
          value: "Curated Pre-Loved Literature, Timeless Games & Everyday Gifts",
          impressions: 340,
          conversions: 18, // 5.29% CR
          weight: 0.33,
        },
        {
          id: "headline-artisan",
          name: "Hand-Inspected Vintage Books, Paper Goods & Cozy Utah Crates",
          value: "Hand-Inspected Vintage Books, Paper Goods & Cozy Utah Crates",
          impressions: 512,
          conversions: 34, // 6.64% CR (Winner)
          weight: 0.34,
        },
        {
          id: "headline-intentional",
          name: "Thoughtful Circular Commerce: Pre-Loved Books & Tactile Goods",
          value: "Thoughtful Circular Commerce: Pre-Loved Books & Tactile Goods",
          impressions: 290,
          conversions: 12, // 4.13% CR
          weight: 0.33,
        },
      ],
    });
  }

  public selectVariant(experimentId: string, record = true): VariantDecision {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.variants.length === 0) {
      throw new Error(`Experiment with ID '${experimentId}' not found`);
    }

    let selected: ExperimentVariant;
    let isExploration = false;

    if (Math.random() < exp.epsilon) {
      isExploration = true;
      const randomIndex = Math.floor(Math.random() * exp.variants.length);
      selected = exp.variants[randomIndex];
    } else {
      selected = exp.variants.reduce((best, current) => {
        const currentCR =
          current.impressions > 0 ? current.conversions / current.impressions : 0;
        const bestCR =
          best.impressions > 0 ? best.conversions / best.impressions : 0;
        return currentCR > bestCR ? current : best;
      });
    }

    if (record) {
      selected.impressions++;
      exp.lastUpdated = Date.now();
    }

    const cr =
      selected.impressions > 0 ? selected.conversions / selected.impressions : 0;

    return {
      experimentId: exp.id,
      selectedVariantId: selected.id,
      name: selected.name,
      value: selected.value,
      isExploration,
      conversionRate: parseFloat(cr.toFixed(4)),
    };
  }

  public recordConversion(experimentId: string, variantId: string): boolean {
    const exp = this.experiments.get(experimentId);
    if (!exp) return false;

    const variant = exp.variants.find((v) => v.id === variantId);
    if (!variant) return false;

    variant.conversions++;
    exp.lastUpdated = Date.now();
    return true;
  }

  public getExperiment(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  public getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}

export function selectWinningVariant(
  experiment: Pick<Experiment, "id" | "epsilon"> & {
    variants: Pick<ExperimentVariant, "id" | "impressions" | "conversions">[];
  }
): string {
  if (Math.random() < experiment.epsilon) {
    const randomIndex = Math.floor(Math.random() * experiment.variants.length);
    return experiment.variants[randomIndex].id;
  }
  return experiment.variants.reduce((best, curr) => {
    const currCR = curr.impressions > 0 ? curr.conversions / curr.impressions : 0;
    const bestCR = best.impressions > 0 ? best.conversions / best.impressions : 0;
    return currCR > bestCR ? curr : best;
  }).id;
}

const globalForMAB = global as unknown as {
  banditSingleton?: MultiArmedBanditEngine;
};
export const banditEngine =
  globalForMAB.banditSingleton || new MultiArmedBanditEngine();
if (process.env.NODE_ENV !== "production") {
  globalForMAB.banditSingleton = banditEngine;
}
