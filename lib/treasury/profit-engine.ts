/**
 * Treasury / net-profit engine.
 *
 * Every number here comes from real order data or an explicit input. Nothing is
 * derived from a ratio of revenue, because a ratio of revenue is a margin
 * assumption, not a cost — and you cannot allocate a tax reserve from an
 * assumption.
 *
 * All money is handled in integer cents internally and returned in dollars to
 * two decimal places, so repeated addition does not drift.
 */

/** Shopify Payments (US, online) default: 2.9% + 30¢ per transaction. */
export const DEFAULT_GATEWAY_FEE_PERCENT = 0.029;
export const DEFAULT_GATEWAY_FEE_FIXED_CENTS = 30;

export interface GatewayFeeSchedule {
  /** Fraction of the charge, e.g. 0.029 for 2.9%. */
  percent: number;
  /** Fixed per-transaction fee, in cents. */
  fixedCents: number;
}

export interface OrderLine {
  sku: string;
  quantity: number;
  /** Unit price actually paid, in dollars, after any line discount. */
  unitPrice: number;
  /** Real supplier or shelf cost per unit, in dollars. Never a % of price. */
  unitCost: number;
}

export interface Order {
  /** Shopify order id, used only for reporting. */
  id: string;
  /** Amount the customer was charged, in dollars, including shipping and tax. */
  total: number;
  /** Discount amount included in `total`, in dollars. Informational only. */
  discounts?: number;
  /** Refunded amount, in dollars. Subtracted from gross. */
  refunded?: number;
  /** What it actually cost to ship this order, in dollars. */
  shippingCost: number;
  /** Ad spend attributed to this order, in dollars. */
  adSpend?: number;
  lines: OrderLine[];
  /** Gateway fee schedule override; defaults to Shopify Payments US. */
  gatewayFee?: Partial<GatewayFeeSchedule>;
}

export interface ProfitBuckets {
  cogsFloatReserve: number;
  growthAdBudget: number;
  taxReserve: number;
  ownerDistributions: number;
}

export interface OrderProfit {
  orderId: string;
  grossRevenue: number;
  refunds: number;
  cogs: number;
  shippingCost: number;
  gatewayFee: number;
  adSpend: number;
  netProfit: number;
  netMarginPercent: number;
  /** Line-level COGS was supplied, not assumed. Always true for this engine. */
  cogsIsActual: true;
}

export interface StoreLedger {
  storeId: string;
  orders: number;
  grossRevenue: number;
  refunds: number;
  discounts: number;
  cogs: number;
  shippingCost: number;
  gatewayFees: number;
  adSpend: number;
  netProfit: number;
  netMarginPercent: number;
  /** True when every order's net profit was positive. */
  profitable: boolean;
  allocations: ProfitBuckets;
  /** Orders with negative net profit — these are the ones to look at first. */
  lossMakingOrderIds: string[];
}

export const DEFAULT_BUCKET_SPLIT = {
  cogsFloatReserve: 0.35,
  growthAdBudget: 0.25,
  taxReserve: 0.2,
  ownerDistributions: 0.2,
} as const;

function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function toDollars(cents: number): number {
  return Math.round(cents) / 100;
}

function gatewayFeeCents(grossCents: number, schedule?: Partial<GatewayFeeSchedule>): number {
  const percent = schedule?.percent ?? DEFAULT_GATEWAY_FEE_PERCENT;
  const fixedCents = schedule?.fixedCents ?? DEFAULT_GATEWAY_FEE_FIXED_CENTS;
  if (grossCents <= 0) return 0;
  return Math.round(grossCents * percent) + fixedCents;
}

/**
 * Net profit for a single order, in cents. Kept internal so the ledger can sum
 * integers rather than re-rounding floats per order.
 */
function orderProfitCents(order: Order): {
  gross: number;
  refunds: number;
  cogs: number;
  shipping: number;
  gateway: number;
  adSpend: number;
  net: number;
} {
  const gross = toCents(order.total);
  const refunds = toCents(order.refunded ?? 0);
  const shipping = toCents(order.shippingCost);
  const adSpend = toCents(order.adSpend ?? 0);
  const cogs = order.lines.reduce(
    (sum, line) => sum + toCents(line.unitCost) * line.quantity,
    0
  );
  const gateway = gatewayFeeCents(gross, order.gatewayFee);

  return {
    gross,
    refunds,
    cogs,
    shipping,
    gateway,
    adSpend,
    net: gross - refunds - cogs - shipping - gateway - adSpend,
  };
}

export function calculateOrderProfit(order: Order): OrderProfit {
  const p = orderProfitCents(order);
  const netRevenue = p.gross - p.refunds;
  return {
    orderId: order.id,
    grossRevenue: toDollars(p.gross),
    refunds: toDollars(p.refunds),
    cogs: toDollars(p.cogs),
    shippingCost: toDollars(p.shipping),
    gatewayFee: toDollars(p.gateway),
    adSpend: toDollars(p.adSpend),
    netProfit: toDollars(p.net),
    netMarginPercent: netRevenue > 0 ? round1((p.net / netRevenue) * 100) : 0,
    cogsIsActual: true,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Allocate profit into buckets. Losses allocate nothing: a negative net profit
 * is a deficit to fund, not money to divide, so every bucket is 0 and the
 * caller sees `netProfit < 0` to act on.
 */
export function allocateProfit(
  netProfit: number,
  split: typeof DEFAULT_BUCKET_SPLIT = DEFAULT_BUCKET_SPLIT
): ProfitBuckets {
  const total = split.cogsFloatReserve + split.growthAdBudget + split.taxReserve + split.ownerDistributions;
  if (Math.abs(total - 1) > 1e-9) {
    throw new Error(`Profit bucket split must sum to 1, got ${total}`);
  }
  if (netProfit <= 0) {
    return { cogsFloatReserve: 0, growthAdBudget: 0, taxReserve: 0, ownerDistributions: 0 };
  }
  const cents = toCents(netProfit);
  const cogsFloatReserve = Math.round(cents * split.cogsFloatReserve);
  const growthAdBudget = Math.round(cents * split.growthAdBudget);
  const taxReserve = Math.round(cents * split.taxReserve);
  // Owner takes the remainder so the four buckets always sum back to netProfit.
  const ownerDistributions = cents - cogsFloatReserve - growthAdBudget - taxReserve;
  return {
    cogsFloatReserve: toDollars(cogsFloatReserve),
    growthAdBudget: toDollars(growthAdBudget),
    taxReserve: toDollars(taxReserve),
    ownerDistributions: toDollars(ownerDistributions),
  };
}

export function calculateStoreLedger(
  storeId: string,
  orders: Order[],
  split: typeof DEFAULT_BUCKET_SPLIT = DEFAULT_BUCKET_SPLIT
): StoreLedger {
  let gross = 0;
  let refunds = 0;
  let discounts = 0;
  let cogs = 0;
  let shipping = 0;
  let gateway = 0;
  let adSpend = 0;
  const lossMakingOrderIds: string[] = [];

  for (const order of orders) {
    const p = orderProfitCents(order);
    gross += p.gross;
    refunds += p.refunds;
    cogs += p.cogs;
    shipping += p.shipping;
    gateway += p.gateway;
    adSpend += p.adSpend;
    discounts += toCents(order.discounts ?? 0);
    if (p.net < 0) lossMakingOrderIds.push(order.id);
  }

  const net = gross - refunds - cogs - shipping - gateway - adSpend;
  const netRevenue = gross - refunds;

  return {
    storeId,
    orders: orders.length,
    grossRevenue: toDollars(gross),
    refunds: toDollars(refunds),
    discounts: toDollars(discounts),
    cogs: toDollars(cogs),
    shippingCost: toDollars(shipping),
    gatewayFees: toDollars(gateway),
    adSpend: toDollars(adSpend),
    netProfit: toDollars(net),
    netMarginPercent: netRevenue > 0 ? round1((net / netRevenue) * 100) : 0,
    profitable: net > 0 && lossMakingOrderIds.length === 0,
    allocations: allocateProfit(toDollars(net), split),
    lossMakingOrderIds,
  };
}

export function calculateFleetLedger(ledgers: StoreLedger[]): {
  stores: number;
  grossRevenue: number;
  netProfit: number;
  netMarginPercent: number;
  allocations: ProfitBuckets;
} {
  const grossCents = ledgers.reduce((s, l) => s + toCents(l.grossRevenue), 0);
  const netCents = ledgers.reduce((s, l) => s + toCents(l.netProfit), 0);
  return {
    stores: ledgers.length,
    grossRevenue: toDollars(grossCents),
    netProfit: toDollars(netCents),
    netMarginPercent: grossCents > 0 ? round1((netCents / grossCents) * 100) : 0,
    allocations: allocateProfit(toDollars(netCents)),
  };
}
