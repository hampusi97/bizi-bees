import crypto from "crypto";

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

/**
 * Cryptographic HMAC-SHA256 signature verification for Shopify webhooks.
 * Uses process.env.SHOPIFY_WEBHOOK_SECRET to ensure only authentic Shopify webhook calls are processed.
 */
export function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string | null | undefined,
  secret: string | undefined = process.env.SHOPIFY_WEBHOOK_SECRET
): boolean {
  if (!secret || !hmacHeader || !rawBody) {
    return false;
  }
  try {
    const generatedHash = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("base64");

    return timingSafeCompare(generatedHash, hmacHeader);
  } catch (err) {
    console.error("HMAC calculation error:", err);
    return false;
  }
}
