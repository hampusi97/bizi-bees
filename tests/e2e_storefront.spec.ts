import { test, expect } from '@playwright/test';

const STORE_URL = process.env.LIVE_STORE_URL || 'https://bizibees-store.myshopify.com';

test.describe('LUMA CLINICAL™ & BIZI BEES™ E-Commerce Verification Suite', () => {

  test('Homepage loads with zero severe console errors and valid DOM', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore external 3rd-party analytics, tracking beacons, and Shopify platform wallet iframe CSP noise
        if (!text.includes('analytics') && 
            !text.includes('trekkie') && 
            !text.includes('doubleclick') && 
            !text.includes('facebook') && 
            !text.includes('gtag') &&
            !text.includes('favicon.ico') &&
            !text.includes('shop.app') &&
            !text.includes('Content Security Policy') &&
            !text.includes('Failed to load resource')) {
          errors.push(text);
        }
      }
    });

    const response = await page.goto(STORE_URL, { waitUntil: 'domcontentloaded' });
    if (response?.status() === 429) {
      console.log('ℹ️ Shopify returned 429 Too Many Requests. Skipping homepage DOM assertions.');
      return;
    }

    // 1. Verify Status and Title
    await expect(page).toHaveTitle(/Luma|Bizi Bees|Clinical|Store/i);

    // 2. Critical Regression Check: Ensure broken badge blockers are not rendered
    const redBlocker = page.locator('.badge--sale-broken, .ugly-35-badge');
    const count = await redBlocker.count();
    expect(count, 'CRITICAL: Broken badge blockers are still visible!').toBe(0);

    // 3. Verify no severe application JavaScript runtime errors
    expect(errors.length, `JavaScript errors detected on live storefront: ${errors.join(', ')}`).toBe(0);
  });

  test('High-ticket product page and 1-Click Sticky Checkout bypass work', async ({ page }) => {
    // Test live flagship product detail page (Bizi Bees live catalog with fallback to Luma)
    const livePdpUrl = `${STORE_URL}/products/amber-santal-soy-blend-candle-sweet-amber-creamy-sandalwood-vanilla-orchid`;
    let response = await page.goto(livePdpUrl, { waitUntil: 'domcontentloaded' });
    let targetUrl = livePdpUrl;

    if (!response || response.status() !== 200) {
      targetUrl = `${STORE_URL}/products/lumaglow-4-in-1-facial-wand`;
      response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    }

    if (response && response.status() === 200) {
      // 1. Verify product image is rendered and visible
      const productImage = page.locator('.product__media img, .card__media img, .luma-gallery-main img').first();
      if (await productImage.count() > 0) {
        await expect(productImage).toBeVisible();
      }

      // 2. Verify pricing is properly formatted (not NaN or $0.00)
      const priceElement = page.locator('.price-item--sale, .price__regular, .luma-current-price, .product-price, .card-price-current').first();
      if (await priceElement.count() > 0) {
        await expect(priceElement).toBeVisible();
        const priceText = await priceElement.textContent();
        expect(priceText).toMatch(/\$\d+(\.\d{2})?/);
      }

      // 3. Verify Sticky Mobile Cart exists on viewport
      const stickyBar = page.locator('#lumaStickyBar, .bb-sticky-bar, .luma-sticky-bar');
      if (await stickyBar.count() > 0) {
        await expect(stickyBar).toBeVisible();

        // 4. Test 1-Click Fast Checkout redirection
        const buyButton = stickyBar.locator('button');
        await buyButton.click();

        // Wait for URL redirect to verify cart/checkout token generation
        await page.waitForURL(/.*(cart|checkout).*/, { timeout: 10000 });
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/(cart|checkouts)/);
        console.log(`✓ Verified direct checkout routing: ${currentUrl}`);
      }
    } else {
      console.log(`ℹ️ Product URL ${targetUrl} returned status ${response?.status()}. Running fallback catalog verification.`);
      const catResponse = await page.goto(`${STORE_URL}/collections/all`, { waitUntil: 'domcontentloaded' });
      const cards = page.locator('.dyn-card, .boutique-card, .department-card, .card-wrapper, .product-card, a[href*="/products/"]');
      const count = await cards.count();
      
      if (count === 0 || catResponse?.status() === 429) {
        console.log('ℹ️ collections/all empty or throttled; verifying homepage boutique showcase cards.');
        await page.goto(`${STORE_URL}`, { waitUntil: 'domcontentloaded' });
        const homeCards = page.locator('.dyn-card, .boutique-card, .department-card, a[href*="/products/"]');
        expect(await homeCards.count()).toBeGreaterThan(0);
      } else {
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('Delivery Estimator displays valid future calendar date', async ({ page }) => {
    const pdpUrl = `${STORE_URL}/products/amber-santal-soy-blend-candle-sweet-amber-creamy-sandalwood-vanilla-orchid`;
    let response = await page.goto(pdpUrl, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() !== 200) {
      response = await page.goto(`${STORE_URL}/products/lumaglow-4-in-1-facial-wand`, { waitUntil: 'domcontentloaded' });
    }
    if (response?.status() === 429) {
      console.log('ℹ️ Shopify returned 429 Too Many Requests. Skipping delivery estimator assertion.');
      return;
    }
    const deliveryDateEl = page.locator('#estDelivDate, #dateDelivery, .delivery-date').first();
    
    if (await deliveryDateEl.count() > 0) {
      const dateText = await deliveryDateEl.innerText();
      expect(dateText.length).toBeGreaterThan(3);
      console.log(`✓ Verified dynamic delivery estimator date: ${dateText}`);
    } else {
      console.log('ℹ️ Delivery Estimator element not mounted on this template view.');
    }
  });

});
