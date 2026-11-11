import crypto from 'crypto';

/**
 * Shared server-side authentication for automation endpoints.
 *
 * Every route that can spend money, write to the database, or commit to GitHub
 * must call one of these before doing any work. They fail closed: a missing
 * server-side secret is a misconfiguration and is treated as "deny", never as
 * "allow".
 */

/**
 * Constant-time string comparison. Avoids leaking length or content through
 * response timing.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify a Shopify webhook signature (`X-Shopify-Hmac-Sha256`, base64 of the
 * raw request body keyed with the shop's shared secret).
 *
 * Returns a reason string when the request must be rejected so the caller can
 * log it, and `null` when the request is authentic.
 */
export function checkShopifyHmac(
  rawBody: string,
  hmacHeader: string | null | undefined,
  secret?: string
): string | null {
  const sharedSecret = secret ?? process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!sharedSecret) return 'SHOPIFY_WEBHOOK_SECRET is not configured';
  if (!hmacHeader) return 'missing X-Shopify-Hmac-Sha256 header';
  if (!rawBody) return 'empty request body';

  const expected = crypto
    .createHmac('sha256', sharedSecret)
    .update(rawBody, 'utf8')
    .digest('base64');
  return timingSafeEqualStrings(expected, hmacHeader) ? null : 'signature mismatch';
}

/**
 * Verify the shared secret on internal automation endpoints (cron jobs, the
 * Dropper OS deploy/report routes) sent as `Authorization: Bearer <secret>`.
 *
 * `envVar` names the secret to compare against, so each endpoint can have its
 * own credential instead of sharing one.
 *
 * Returns a reason string when the request must be rejected, `null` when it is
 * authorised.
 */
export function checkBearerSecret(
  authorizationHeader: string | null | undefined,
  envVar: string
): string | null {
  const expected = process.env[envVar];
  if (!expected) return `${envVar} is not configured`;
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return 'missing Authorization: Bearer header';
  }
  const presented = authorizationHeader.slice('Bearer '.length).trim();
  if (!presented) return 'empty bearer token';
  return timingSafeEqualStrings(expected, presented) ? null : 'invalid bearer token';
}
