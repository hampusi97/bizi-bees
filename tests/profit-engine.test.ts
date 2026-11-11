import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateProfit,
  calculateFleetLedger,
  calculateOrderProfit,
  calculateStoreLedger,
  type Order,
} from '../lib/treasury/profit-engine.ts';

// A fixed order set so the arithmetic is auditable by hand.
// $100 order, $30 real unit cost, $5 label, $6 ad spend.
// Gateway fee = 100 * 0.029 + 0.30 = 3.20
// Net = 100 - 0 - 30 - 5 - 3.20 - 6 = 55.80
const baseOrder: Order = {
  id: 'order-1',
  total: 100,
  shippingCost: 5,
  adSpend: 6,
  lines: [{ sku: 'DROP-X', quantity: 1, unitPrice: 100, unitCost: 30 }],
};

test('order profit subtracts real costs, not a percentage of revenue', () => {
  const p = calculateOrderProfit(baseOrder);
  assert.equal(p.cogs, 30);
  assert.equal(p.gatewayFee, 3.2);
  assert.equal(p.shippingCost, 5);
  assert.equal(p.adSpend, 6);
  assert.equal(p.netProfit, 55.8);
  assert.equal(p.netMarginPercent, 55.8);
});

test('COGS comes from unit costs and quantities, never from a ratio of price', () => {
  const order: Order = {
    id: 'order-2',
    total: 200,
    shippingCost: 0,
    lines: [
      { sku: 'A', quantity: 2, unitPrice: 50, unitCost: 7.25 },
      { sku: 'B', quantity: 1, unitPrice: 100, unitCost: 41.1 },
    ],
  };
  const p = calculateOrderProfit(order);
  assert.equal(p.cogs, 55.6, '2 x 7.25 + 41.10');
});

test('a refund is subtracted from gross revenue', () => {
  const p = calculateOrderProfit({ ...baseOrder, refunded: 100 });
  assert.equal(p.refunds, 100);
  assert.equal(p.netProfit, -44.2, 'full refund still owes gateway, shipping and COGS');
});

test('a partial refund reduces profit by the refunded amount', () => {
  const p = calculateOrderProfit({ ...baseOrder, refunded: 25 });
  assert.equal(p.netProfit, 30.8);
});

test('gateway fee is not charged on a zero-value order', () => {
  const p = calculateOrderProfit({ ...baseOrder, total: 0, lines: [] });
  assert.equal(p.gatewayFee, 0);
});

test('an order that loses money reports a negative profit', () => {
  const p = calculateOrderProfit({
    id: 'loss',
    total: 20,
    shippingCost: 9,
    lines: [{ sku: 'X', quantity: 1, unitPrice: 20, unitCost: 18 }],
  });
  // 20 - 18 - 9 - (0.58 + 0.30) = -7.88
  assert.equal(p.netProfit, -7.88);
});

test('store ledger sums orders and flags the loss-making ones', () => {
  const ledger = calculateStoreLedger('bizi-bees', [
    baseOrder,
    {
      id: 'order-2',
      total: 50,
      shippingCost: 5,
      lines: [{ sku: 'UTAH-Y', quantity: 1, unitPrice: 50, unitCost: 10 }],
    },
    {
      id: 'order-3',
      total: 20,
      shippingCost: 9,
      lines: [{ sku: 'UTAH-Z', quantity: 1, unitPrice: 20, unitCost: 18 }],
    },
  ]);

  assert.equal(ledger.orders, 3);
  assert.equal(ledger.grossRevenue, 170);
  assert.equal(ledger.cogs, 58);
  assert.equal(ledger.shippingCost, 19);
  assert.deepEqual(ledger.lossMakingOrderIds, ['order-3']);
  assert.equal(ledger.profitable, false, 'one loss-making order means the store is not cleanly profitable');
});

test('store ledger discounts are reported but not double-subtracted', () => {
  const ledger = calculateStoreLedger('s', [{ ...baseOrder, discounts: 15 }]);
  assert.equal(ledger.discounts, 15);
  assert.equal(ledger.netProfit, 55.8, 'the discount is already inside order.total');
});

test('allocations sum back to net profit exactly, to the cent', () => {
  for (const net of [55.8, 100, 0.03, 1234.57, 99999.99]) {
    const a = allocateProfit(net);
    const sum = Math.round(
      (a.cogsFloatReserve + a.growthAdBudget + a.taxReserve + a.ownerDistributions) * 100
    );
    assert.equal(sum, Math.round(net * 100), `buckets must sum to ${net}`);
  }
});

test('allocations follow the 35/25/20/20 split', () => {
  const a = allocateProfit(1000);
  assert.equal(a.cogsFloatReserve, 350);
  assert.equal(a.growthAdBudget, 250);
  assert.equal(a.taxReserve, 200);
  assert.equal(a.ownerDistributions, 200);
});

test('a loss allocates nothing — there is no tax reserve on a deficit', () => {
  const a = allocateProfit(-500);
  assert.deepEqual(a, {
    cogsFloatReserve: 0,
    growthAdBudget: 0,
    taxReserve: 0,
    ownerDistributions: 0,
  });
});

test('a split that does not sum to 1 throws rather than silently losing money', () => {
  assert.throws(
    () =>
      allocateProfit(100, {
        cogsFloatReserve: 0.5,
        growthAdBudget: 0.5,
        taxReserve: 0.5,
        ownerDistributions: 0.5,
      }),
    /must sum to 1/
  );
});

test('fleet ledger aggregates stores without float drift', () => {
  const a = calculateStoreLedger('a', [baseOrder]);
  const b = calculateStoreLedger('b', [baseOrder]);
  const fleet = calculateFleetLedger([a, b]);
  assert.equal(fleet.stores, 2);
  assert.equal(fleet.grossRevenue, 200);
  assert.equal(fleet.netProfit, 111.6);
});

test('an empty store reports zeros rather than NaN', () => {
  const ledger = calculateStoreLedger('empty', []);
  assert.equal(ledger.netMarginPercent, 0);
  assert.equal(ledger.netProfit, 0);
  assert.equal(ledger.profitable, false);
});
