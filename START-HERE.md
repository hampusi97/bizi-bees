> Current as of October 28, 2026: the live theme is already connected to this repo and Shopify commits theme edits to main. Do not upload bizi-bees-shopify-theme.zip over the published theme. The steps below are the original launch kit, not the current admin checklist. See operations/2026-10-28-christmas-listings.md.

# bizi bees — launch kit

Brand: bizi bees. Tagline: Good finds. Fresh beginnings. Honey #F2CB56, ink #202B29, cream #FCFAF5, sage #E8ECDF. Friendly, practical voice. Use actual-item photos with plain backgrounds, consistent lighting, and close-ups of flaws. Illustrations in the preview are category art, not inventory photos. The wordmark is text and needs no paid font.

## Files
- bizi-bees-shopify-theme.zip: upload this ZIP in Shopify → Online Store → Themes → Import theme → Upload ZIP. Preview before publishing.
- bizi-bees-theme/: editable Shopify source; native product forms, cart, checkout handoff, search, collection filtering, contact form, and responsive layouts.
- bizi-bees-preview/index.html: open locally to explore the design, demo categories, search, filters, and sample product detail. Checkout and messaging are intentionally unavailable here.
- page-content/: copy-ready About, FAQ and Contact text; shipping and returns are OWNER DRAFTS with placeholders.
- inventory-template.csv: header plus one draft-only placeholder row. Replace every placeholder, set a real price, and enter actual quantity before import. Do not publish the sample row. Shopify imports may require inventory assignment at a location after import.

## Shopify setup
1. Set store name to bizi bees. Confirm store owner, U.S. business details, support email, currency USD, time zone, and shipping origin. Do not invent any of these details.
2. Upload theme and preview desktop and phone layouts.
3. Create collections with handles electronics, books, clothing, toys, more-finds. Use product type rules matching Electronics, Books, Clothing, Toys, More finds. Create a New arrivals collection sorted newest first. Select it under theme editor → Home → Featured collection.
4. Create pages with handles about, shipping, returns, faq, contact, condition-guide. Copy page content excluding its first H1 (theme already renders the title). Assign contact to page.contact and condition-guide to page.condition-guide. Assign other pages to default page. Finish draft policies before making pages visible. Navigation in this theme uses these handles directly.
5. Settings → Custom data → Products: create the following metafields. Then populate them for every product. None are created by installing a theme.

| Namespace/key | Type | Purpose |
|---|---|---|
| custom.condition | Single line text with preset choices | New / unused, Like new, Good, Fair, For parts / repair |
| custom.condition_notes | Multi-line text | Actual wear, flaws, markings, odors, missing pieces |
| custom.included | Multi-line text | Accessories, packaging, manuals, components |
| custom.testing | Multi-line text | Exact tests, results, defects, battery behavior; never imply testing not performed |
| custom.measurements | Multi-line text | Clothing measurements, dimensions and fit notes |
| custom.book_format | Single line text | Hardcover, paperback, etc. |
| custom.genre | Single line text | Book genre |
| custom.age_range | Single line text | Toy age guidance from actual manufacturer label |

Use native product vendor for actual brand; use Size and Color variant options for apparel. Do not use the store name as a substitute for an item's brand when brand filtering is desired. For single one-off items, one variant and quantity 1 is usually sufficient. Track inventory, disable continuing to sell out of stock, and reconcile other selling channels to avoid overselling.

6. Install Shopify Search & Discovery if needed. Add availability, price, product type, vendor/brand, condition, Size, Color, book format, genre, and age range as applicable. Enable eligible metafield definitions for filtering. The theme renders the filters Shopify provides; installing the ZIP does not activate filters. Keep category-specific fields empty on irrelevant products. Validate filter behavior on a populated collection.
7. Add actual inventory with item-specific photos, price, SKU, weight, quantity, condition, flaws, testing and included items. For parts/repair items, make defects prominent in the title and description. No invented reviews, testing, warranty, or savings claims are included.
8. Complete shipping origin, destinations, rates, package dimensions/weights, handling times and tracking workflow. Ensure policy copy matches checkout. Confirm carrier requirements for batteries and restricted goods before listing affected items. No free shipping threshold or dispatch promise is assumed.
9. Finalize returns, privacy and terms in Settings → Policies and the linked shipping/returns pages. Set and verify the contact form recipient in Shopify notification settings. Test delivery of a real contact message.
10. Owner completes payment/payout setup, required business verification, tax settings, plan selection and any domain purchase. Use the included Shopify domain initially to minimize cost; paid themes, paid fonts and additional paid apps are unnecessary for this package. Shopify service/payment fees still apply; verify current terms in your account.

## Launch checks
- Preview a real product with several images and a product with missing optional data; check long titles on a phone.
- Verify every collection and footer link. Search for a real item, use and clear filters, test sorts and pagination.
- Verify variants show correct prices in the selector, unavailable options cannot be selected, cart quantity updates/removal work, and Shopify checkout receives the selected variant. Headline price intentionally shows “From” for varying prices.
- Complete a Shopify test order: taxes, shipping, confirmation email, inventory decrement, cancellation/refund and sold-out state. Test the contact form and response inbox.
- Check keyboard navigation, visible focus, meaningful image alt text, zoom and mobile overflow.
- Remove all placeholders and sample inventory; review shipping/returns. Publish theme only after account-side tests pass. Keep the password page active until launch-ready.

## Verification boundary
The theme's local JSON files and archive structure can be checked without Shopify. Liquid rendering, Shopify fraud/spam protection, payment flow, metafield filters, inventory behavior and email delivery require a real store with actual data and account-side testing. This is a focused custom starter theme, not a Shopify Theme Store-certified theme. It does not include app-specific features, subscriptions, multi-currency selectors or customer account templates; Shopify-hosted checkout handles checkout.

Official references:
- https://help.shopify.com/en/manual/online-store/themes/adding-themes
- https://shopify.dev/docs/storefronts/themes/architecture
- https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters
