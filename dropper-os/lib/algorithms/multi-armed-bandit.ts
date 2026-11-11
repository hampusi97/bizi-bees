/**
 * Autonomous Multi-Armed Bandit (MAB) Testing Engine
 * File: dropper-os/lib/algorithms/multi-armed-bandit.ts
 * Epsilon-Greedy dynamic allocation algorithm for self-optimizing storefront experiments.
 */

export interface ExperimentVariant {
  id: string;
  name: string;
  value: any;
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
  value: any;
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
    this.experiments.set('free-shipping-threshold', {
      id: 'free-shipping-threshold',
      name: 'Dynamic Cart Free Shipping Threshold',
      epsilon: 0.1, // 10% explore, 90% exploit
      createdAt: Date.now() - 86400000 * 3,
      lastUpdated: Date.now(),
      variants: [
        {
          id: 'tier-35',
          name: '$35 Free Shipping Threshold',
          value: { thresholdDollars: 35, thresholdCents: 3500 },
          impressions: 420,
          conversions: 15, // 3.57% CR
          weight: 0.33,
        },
        {
          id: 'tier-50',
          name: '$50 Free Shipping Threshold',
          value: { thresholdDollars: 50, thresholdCents: 5000 },
          impressions: 890,
          conversions: 43, // 4.83% CR (Winner)
          weight: 0.34,
        },
        {
          id: 'tier-65',
          name: '$65 Free Shipping Threshold',
          value: { thresholdDollars: 65, thresholdCents: 6500 },
          impressions: 210,
          conversions: 6, // 2.85% CR
          weight: 0.33,
        },
      ],
    });

    // 2. Editorial Hero Headline Experiment
    this.experiments.set('hero-headline', {
      id: 'hero-headline',
      name: 'Storefront Editorial Hero Headline',
      epsilon: 0.15,
      createdAt: Date.now() - 86400000 * 2,
      lastUpdated: Date.now(),
      variants: [
        {
          id: 'headline-curated',
          name: 'Curated Literature & Botanical Goods',
          value: 'Curated Literature & Botanical Goods',
          impressions: 340,
          conversions: 18, // 5.29% CR
          weight: 0.33,
        },
        {
          id: 'headline-artisan',
          name: 'Handcrafted Book Crates & Artisan Apothecary',
          value: 'Handcrafted Book Crates & Artisan Apothecary',
          impressions: 512,
          conversions: 34, // 6.64% CR (Winner)
          weight: 0.34,
        },
        {
          id: 'headline-intentional',
          name: 'Unbox Intentional Moments: Books, Wax & Botanical Scents',
          value: 'Unbox Intentional Moments: Books, Wax & Botanical Scents',
          impressions: 290,
          conversions: 12, // 4.13% CR
          weight: 0.33,
        },
      ],
    });
  }

  /**
   * Epsilon-Greedy dynamic variant selection
   */
  public selectVariant(experimentId: string, record = true): VariantDecision {
    const exp = this.experiments.get(experimentId);
    if (!exp || exp.variants.length === 0) {
      throw new Error(`Experiment with ID '${experimentId}' not found`);
    }

    let selected: ExperimentVariant;
    let isExploration = false;

    // 1. Explore: With probability epsilon, choose random variant
    if (Math.random() < exp.epsilon) {
      isExploration = true;
      const randomIndex = Math.floor(Math.random() * exp.variants.length);
      selected = exp.variants[randomIndex];
    } else {
      // 2. Exploit: Pick the variant with highest conversion rate (CR)
      selected = exp.variants.reduce((best, current) => {
        const currentCR = current.impressions > 0 ? current.conversions / current.impressions : 0;
        const bestCR = best.impressions > 0 ? best.conversions / best.impressions : 0;
        return currentCR > bestCR ? current : best;
      });
    }

    if (record) {
      selected.impressions++;
      exp.lastUpdated = Date.now();
    }

    const cr = selected.impressions > 0 ? selected.conversions / selected.impressions : 0;

    return {
      experimentId: exp.id,
      selectedVariantId: selected.id,
      name: selected.name,
      value: selected.value,
      isExploration,
      conversionRate: parseFloat(cr.toFixed(4)),
    };
  }

  /**
   * Records a conversion event (Add to Cart or Completed Purchase)
   */
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

// Standalone function matching the user's explicit specification
export function selectWinningVariant(experiment: Experiment): string {
  // 1. Explore: With probability epsilon, choose random variant
  if (Math.random() < experiment.epsilon) {
    const randomIndex = Math.floor(Math.random() * experiment.variants.length);
    return experiment.variants[randomIndex].id;
  }
  // 2. Exploit: Pick the variant with the highest conversion rate (CR)
  return experiment.variants.reduce((best, current) => {
    const currentCR = current.impressions > 0 ? current.conversions / current.impressions : 0;
    const bestCR = best.impressions > 0 ? best.conversions / best.impressions : 0;
    return currentCR > bestCR ? current : best;
  }).id;
}

const globalForMAB = global as unknown as { banditSingleton?: MultiArmedBanditEngine };
export const banditEngine = globalForMAB.banditSingleton || new MultiArmedBanditEngine();
if (process.env.NODE_ENV !== 'production') {
  globalForMAB.banditSingleton = banditEngine;
}
