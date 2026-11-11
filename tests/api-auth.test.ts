import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

process.env.SHOPIFY_WEBHOOK_SECRET = 'test-shopify-secret';
process.env.TEST_BEARER_SECRET = 'test-bearer-secret';

import { checkShopifyHmac, checkBearerSecret, timingSafeEqualStrings } from '../lib/server/api-auth.ts';

function sign(body: string, secret = 'test-shopify-secret'): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
}

test('Shopify HMAC: a correctly signed body is accepted', () => {
  const body = JSON.stringify({ id: 1, total_price: '10.00' });
  assert.equal(checkShopifyHmac(body, sign(body)), null);
});

test('Shopify HMAC: a body tampered with after signing is rejected', () => {
  const signed = JSON.stringify({ id: 1, total_price: '10.00' });
  const tampered = JSON.stringify({ id: 1, total_price: '0.01' });
  assert.equal(checkShopifyHmac(tampered, sign(signed)), 'signature mismatch');
});

test('Shopify HMAC: a signature made with another secret is rejected', () => {
  const body = '{"id":1}';
  assert.equal(checkShopifyHmac(body, sign(body, 'wrong-secret')), 'signature mismatch');
});

test('Shopify HMAC: a missing header is rejected even when a secret exists', () => {
  // Regression: orders-create used to accept the request in exactly this case.
  assert.equal(checkShopifyHmac('{"id":1}', null), 'missing X-Shopify-Hmac-Sha256 header');
});

test('Shopify HMAC: an unset secret rejects instead of accepting everything', () => {
  // Regression: the route used to trust the body when SHOPIFY_WEBHOOK_SECRET was unset.
  // An empty string is what an unset environment variable arrives as in a real deployment.
  assert.equal(
    checkShopifyHmac('{"id":1}', 'anything', ''),
    'SHOPIFY_WEBHOOK_SECRET is not configured'
  );
});

test('Shopify HMAC: an empty body is rejected', () => {
  assert.equal(checkShopifyHmac('', sign('')), 'empty request body');
});

test('Bearer secret: the matching token is accepted', () => {
  assert.equal(checkBearerSecret('Bearer test-bearer-secret', 'TEST_BEARER_SECRET'), null);
});

test('Bearer secret: a wrong token is rejected', () => {
  assert.equal(
    checkBearerSecret('Bearer nope', 'TEST_BEARER_SECRET'),
    'invalid bearer token'
  );
});

test('Bearer secret: a missing header is rejected, not allowed through', () => {
  // Regression: the cron routes only rejected a *wrong* header, so no header passed.
  assert.equal(
    checkBearerSecret(null, 'TEST_BEARER_SECRET'),
    'missing Authorization: Bearer header'
  );
});

test('Bearer secret: an unconfigured secret rejects every request', () => {
  assert.equal(
    checkBearerSecret('Bearer anything', 'SECRET_THAT_IS_NOT_SET'),
    'SECRET_THAT_IS_NOT_SET is not configured'
  );
});

test('Bearer secret: the scheme must be Bearer', () => {
  assert.equal(
    checkBearerSecret('Basic test-bearer-secret', 'TEST_BEARER_SECRET'),
    'missing Authorization: Bearer header'
  );
});

test('timingSafeEqualStrings compares content and length', () => {
  assert.equal(timingSafeEqualStrings('abc', 'abc'), true);
  assert.equal(timingSafeEqualStrings('abc', 'abd'), false);
  assert.equal(timingSafeEqualStrings('abc', 'abcd'), false);
  assert.equal(timingSafeEqualStrings('', ''), true);
});
