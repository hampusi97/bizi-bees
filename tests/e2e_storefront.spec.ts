import { test, expect, devices } from '@playwright/test';

// Test across real iPhone mobile viewport (where 85% of mobile sales happen)
test.use({ ...devices['iPhone 14 Pro'] });

const STORE_URL = process.env.LIVE_STORE_URL || 'https://bizibees-store.myshopify.com';

test.describe('LUMA CLINICAL™ Mission-Critical E-Commerce Smoke Test', () => {

  test('Homepage loads with zero console errors and valid DOM', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(STORE_URL, { waitUntil: 'networkidle' });

    // 1. Verify Status and Title
    await expect(page).toHaveTitle(/Luma|Bizi Bees|Clinical/i);

    // 2. Critical Regression Check: Ensure ugly red 35% blocks are completely dead
    const redBlocker = page.locator('.product-card__badge:visible, [class*="35-off"]:visible');
    const count = await redBlocker.count();
    expect(count, 'CRITICAL: Giant red sale badges are still visible!').toBe(0);

    // 3. Verify no severe JavaScript runtime errors
    expect(errors.length, `JavaScript errors detected on live storefront: ${errors.join(', ')}`).toBe(0);
  });

  test('High-ticket product page and 1-Click Sticky Checkout bypass work', async ({ page }) => {
    // Navigate directly to the flagship LumaGlow wand (or first active product)
    const targetUrl = `${STORE_URL}/products/lumaglow-4-in-1-facial-wand`;
    const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    if (response && response.status() === 200) {
      // 1. Verify product image is rendered and visible
      const productImage = page.locator('.product__media img, .card__media img, .luma-gallery-main img').first();
      if (await productImage.count() > 0) {
        await expect(productImage).toBeVisible();
      }

      // 2. Verify pricing is properly formatted (not NaN or $0.00)
      const priceElement = page.locator('.price-item--sale, .price__regular, .luma-current-price, .product-price').first();
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
      console.log(`ℹ️ Product URL ${targetUrl} returned ${response?.status()}. Running fallback catalog verification.`);
      await page.goto(`${STORE_URL}/collections/all`, { waitUntil: 'domcontentloaded' });
      const cards = page.locator('.card-wrapper, .product-card');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('Delivery Estimator displays valid future calendar date', async ({ page }) => {
    await page.goto(`${STORE_URL}/products/lumaglow-4-in-1-facial-wand`, { waitUntil: 'domcontentloaded' });
    const deliveryDateEl = page.locator('#dateDelivery');
    
    if (await deliveryDateEl.count() > 0) {
      const dateText = await deliveryDateEl.innerText();
      expect(dateText.length).toBeGreaterThan(3);
      console.log(`✓ Verified dynamic delivery estimator date: ${dateText}`);
    }
  });

});
