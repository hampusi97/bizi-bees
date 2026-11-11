import crypto from "crypto";
import fs from "fs";
import path from "path";
import { verifyShopifyHmac } from "../lib/shopify-hmac";
import { commitAndPushFile } from "../lib/github-client";
import { fetchWithRetry } from "../lib/shopify-client";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runSafetyGuardsTests() {
  console.log("\n======================================================");
  console.log("  RUNNING PRODUCTION HARDENING & SAFETY GUARD TESTS   ");
  console.log("======================================================\n");

  const secret = "shpss_test_secret_987654321";
  const sampleBody = JSON.stringify({
    id: 994827103,
    email: "sarah.reader@example.com",
    total_price: "35.00",
    currency: "USD",
    line_items: [{ title: "Blind Date with a Book - Cozy Edition", quantity: 1, price: "14.99" }]
  });

  const validHmac = crypto
    .createHmac("sha256", secret)
    .update(sampleBody, "utf8")
    .digest("base64");

  // Test 1: HMAC Verification accepts authentic Shopify webhook signature
  assert(
    verifyShopifyHmac(sampleBody, validHmac, secret) === true,
    "HMAC: Authentic Shopify webhook signature verified successfully"
  );

  // Test 2: HMAC Verification rejects forged/tampered request body
  const tamperedBody = sampleBody.replace("35.00", "0.01");
  assert(
    verifyShopifyHmac(tamperedBody, validHmac, secret) === false,
    "HMAC: Tampered payload body rejected (signature mismatch)"
  );

  // Test 3: HMAC Verification rejects wrong secret
  assert(
    verifyShopifyHmac(sampleBody, validHmac, "wrong_secret") === false,
    "HMAC: Webhook signed with unauthorized secret rejected"
  );

  // Test 4: HMAC Verification rejects missing header or empty secret
  assert(
    verifyShopifyHmac(sampleBody, null, secret) === false,
    "HMAC: Missing x-shopify-hmac-sha256 header rejected"
  );
  assert(
    verifyShopifyHmac(sampleBody, validHmac, "") === false,
    "HMAC: Unconfigured server webhook secret rejected"
  );

  // Test 5: Theme Deployment Pipeline Safety Guard - config/settings_data.json ignore rule
  const pushResult = await commitAndPushFile(
    "config/settings_data.json",
    "{}",
    "test: attempt to overwrite settings"
  );
  assert(
    pushResult.success === false && (pushResult.error?.includes("config/settings_data.json") ?? false),
    "Pipeline Guard: Direct automated commit to config/settings_data.json is blocked"
  );

  // Test 6: Verify .shopifyignore files contain config/settings_data.json
  const rootIgnore = path.resolve(__dirname, "../../.shopifyignore");
  assert(
    fs.existsSync(rootIgnore) && fs.readFileSync(rootIgnore, "utf8").includes("config/settings_data.json"),
    "Theme Guard: Root .shopifyignore strictly protects config/settings_data.json"
  );

  // Test 7: Verify exponential backoff helper handles HTTP 429 retry logic
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount < 3) {
      return new Response(JSON.stringify({ error: "Throttled" }), {
        status: 429,
        headers: { "Retry-After": "0.05" }
      });
    }
    return new Response(JSON.stringify({ success: true, data: { orders: [] } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  // Temporarily mock global fetch
  const originalFetch = global.fetch;
  global.fetch = mockFetch as any;
  try {
    const res = await fetchWithRetry("https://bizibees-store.myshopify.com/admin/api/2024-04/graphql.json", {
      method: "POST"
    }, 4, 20, 100);
    assert(res.status === 200, "Exponential Backoff: Retries on HTTP 429 and succeeds on subsequent attempt");
    assert(callCount === 3, "Exponential Backoff: Executed exactly 3 attempts (2 retries on 429)");
  } finally {
    global.fetch = originalFetch;
  }

  // Test 8: Verify Bizi Bees Boutique Cozy Editorial Stylesheet exists and contains warm design tokens
  const boutiqueCss = path.resolve(__dirname, "../../assets/bizi-bees-boutique.css");
  assert(fs.existsSync(boutiqueCss), "Bizi Bees: assets/bizi-bees-boutique.css exists");
  const cssContent = fs.readFileSync(boutiqueCss, "utf8");
  assert(
    cssContent.includes("#FAF7F2") && cssContent.includes("#29231E") && cssContent.includes("#D9822B"),
    "Bizi Bees: Warm Linen (#FAF7F2), Deep Coffee (#29231E) & Honey Gold (#D9822B) active"
  );

  // Test 9: Verify Bizi Bees Hero & Blind Date Builder sections exist
  const heroSection = path.resolve(__dirname, "../../sections/bizi-bees-hero.liquid");
  const bdateSection = path.resolve(__dirname, "../../sections/bizi-blind-date-builder.liquid");
  assert(fs.existsSync(heroSection), "Bizi Bees: sections/bizi-bees-hero.liquid exists");
  assert(fs.existsSync(bdateSection), "Bizi Bees: sections/bizi-blind-date-builder.liquid exists");

  console.log("\n======================================================");
  console.log("  ALL PRODUCTION HARDENING TESTS PASSED (100%)       ");
  console.log("======================================================\n");
}

runSafetyGuardsTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
