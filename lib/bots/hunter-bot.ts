/**
 * HunterBot — product research scoring.
 *
 * A pure function over a candidate's numbers. No network, no side effects, so it
 * is fully testable and its verdicts can be audited.
 *
 * The rubric is the one the business actually stated (v5 §3), 100 points:
 *   margin 30 · pain point 25 · shipping/defect safety 20 · visual hook 15 · upsell 10
 *
 * A high score cannot rescue a bad margin. `AUTO_APPROVE` additionally requires
 * the hard floors below, because a product that loses money per unit is not a
 * candidate no matter how photogenic it is.
 */

export interface ProductCandidate {
  title: string;
  /** What the unit costs us landed (supplier + inbound shipping), in dollars. */
  landedCost: number;
  /** What we would charge, in dollars. */
  retailPrice: number;
  /** Package weight in ounces. */
  weightOz: number;
  solvesPainPoint: boolean;
  hasVisualDemoHook: boolean;
  /** Expected return/defect rate, e.g. 0.02 for 2%. */
  defectReturnRate: number;
  /** Has a natural add-on to offer in the cart drawer. */
  hasUpsellEcosystem: boolean;
  /** Days from order to delivery. */
  shippingDays: number;
  targetStoreId: string;
  supplierSku: string;
  supplierUrl: string;
}

export type Verdict = 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'REJECT';

export interface EvaluatedProduct extends ProductCandidate {
  score: number;
  netProfitPerUnit: number;
  grossMarginPercent: number;
  markupMultiple: number;
  verdict: Verdict;
  reasons: string[];
  /** Hard floors that failed. Non-empty means no verdict above MANUAL_REVIEW. */
  blockers: string[];
}

/** Hard floors. Any failure caps the verdict at MANUAL_REVIEW. */
export const FLOORS = {
  minGrossMarginPercent: 55,
  minNetProfitPerUnit: 10,
  maxWeightOz: 32,
  maxDefectReturnRate: 0.04,
  maxShippingDays: 8,
} as const;

export const AUTO_APPROVE_SCORE = 80;
export const MANUAL_REVIEW_SCORE = 60;

/** Shopify Payments US default, matching the treasury engine. */
const GATEWAY_PERCENT = 0.029;
const GATEWAY_FIXED = 0.3;

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function evaluateProductCandidate(item: ProductCandidate): EvaluatedProduct {
  const reasons: string[] = [];
  const blockers: string[] = [];

  const netProfitPerUnit = item.retailPrice - item.landedCost - (item.retailPrice * GATEWAY_PERCENT + GATEWAY_FIXED);
  const grossMarginPercent =
    item.retailPrice > 0 ? ((item.retailPrice - item.landedCost) / item.retailPrice) * 100 : 0;
  const markupMultiple = item.landedCost > 0 ? item.retailPrice / item.landedCost : 0;

  let score = 0;

  // 1. Margin potential — 30 points.
  if (grossMarginPercent >= 70) {
    score += 30;
    reasons.push(`Gross margin ${round1(grossMarginPercent)}% (≥70%)`);
  } else if (grossMarginPercent >= 60) {
    score += 22;
    reasons.push(`Gross margin ${round1(grossMarginPercent)}% (≥60%)`);
  } else if (grossMarginPercent >= 55) {
    score += 14;
    reasons.push(`Gross margin ${round1(grossMarginPercent)}% (≥55%, thin)`);
  } else {
    reasons.push(`Gross margin ${round1(grossMarginPercent)}% is below the 55% floor`);
  }

  // 2. Pain point / problem solver — 25 points.
  if (item.solvesPainPoint) {
    score += 25;
    reasons.push('Solves an immediate problem');
  } else {
    reasons.push('No clear problem being solved — harder to sell on a hook');
  }

  // 3. Shipping and defect safety — 20 points (10 + 10).
  if (item.weightOz <= FLOORS.maxWeightOz) {
    score += 10;
    reasons.push(`Lightweight (${item.weightOz}oz ≤ 32oz)`);
  } else {
    reasons.push(`Heavy (${item.weightOz}oz) — freight eats the margin`);
  }
  if (item.defectReturnRate <= 0.03) {
    score += 10;
    reasons.push(`Low return rate (${(item.defectReturnRate * 100).toFixed(1)}%)`);
  } else if (item.defectReturnRate <= FLOORS.maxDefectReturnRate) {
    score += 5;
    reasons.push(`Return rate ${(item.defectReturnRate * 100).toFixed(1)}% is borderline`);
  } else {
    reasons.push(`Return rate ${(item.defectReturnRate * 100).toFixed(1)}% is above the 4% floor`);
  }

  // 4. Visual hook — 15 points.
  if (item.hasVisualDemoHook) {
    score += 15;
    reasons.push('Demonstrable in a 3-second video');
  } else {
    reasons.push('Hard to demonstrate visually');
  }

  // 5. Upsell ecosystem — 10 points.
  if (item.hasUpsellEcosystem) {
    score += 10;
    reasons.push('Has a natural cart-drawer add-on');
  }

  // Hard floors — checked independently of the score.
  if (grossMarginPercent < FLOORS.minGrossMarginPercent) {
    blockers.push(`Gross margin ${round1(grossMarginPercent)}% < ${FLOORS.minGrossMarginPercent}%`);
  }
  if (netProfitPerUnit < FLOORS.minNetProfitPerUnit) {
    blockers.push(`Net profit ${round2(netProfitPerUnit)} < ${FLOORS.minNetProfitPerUnit} per unit`);
  }
  if (item.weightOz > FLOORS.maxWeightOz) {
    blockers.push(`Weight ${item.weightOz}oz > ${FLOORS.maxWeightOz}oz`);
  }
  if (item.defectReturnRate > FLOORS.maxDefectReturnRate) {
    blockers.push(`Return rate ${(item.defectReturnRate * 100).toFixed(1)}% > 4%`);
  }
  if (item.shippingDays > FLOORS.maxShippingDays) {
    blockers.push(`Shipping ${item.shippingDays} days > ${FLOORS.maxShippingDays}`);
  }

  let verdict: Verdict;
  if (score >= AUTO_APPROVE_SCORE && blockers.length === 0) {
    verdict = 'AUTO_APPROVE';
  } else if (score >= MANUAL_REVIEW_SCORE && !blockers.some((b) => b.includes('margin') || b.includes('Net profit'))) {
    verdict = 'MANUAL_REVIEW';
  } else {
    verdict = 'REJECT';
  }

  return {
    ...item,
    score,
    netProfitPerUnit: round2(netProfitPerUnit),
    grossMarginPercent: round1(grossMarginPercent),
    markupMultiple: round2(markupMultiple),
    verdict,
    reasons,
    blockers,
  };
}

/** Evaluate a batch and split by verdict, preserving input order. */
export function evaluateCandidates(items: ProductCandidate[]): {
  approved: EvaluatedProduct[];
  review: EvaluatedProduct[];
  rejected: EvaluatedProduct[];
} {
  const evaluated = items.map(evaluateProductCandidate);
  return {
    approved: evaluated.filter((p) => p.verdict === 'AUTO_APPROVE'),
    review: evaluated.filter((p) => p.verdict === 'MANUAL_REVIEW'),
    rejected: evaluated.filter((p) => p.verdict === 'REJECT'),
  };
}
