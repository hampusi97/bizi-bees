/* ==========================================================================
   DROPPER OS - AJAX SLIDE-OUT CART DRAWER CONTROLLER
   Repo: bizi-bees /assets/dropper-cart.js
   ========================================================================== */

(function() {
  let activeThresholdCents = 5000; // Default $50.00 fallback
  let activeBanditVariant = 'tier-50';

  // Autonomous MAB calibration
  fetch('/api/bandit/decide?experiment=free-shipping-threshold')
    .then(res => res.json())
    .then(json => {
      if (json.success && json.decision) {
        activeThresholdCents = json.decision.value?.thresholdCents || 5000;
        activeBanditVariant = json.decision.selectedVariantId;
        if (window.DropperCart && window.DropperCart.renderLastCart) {
          window.DropperCart.render(window.DropperCart.renderLastCart);
        }
      }
    })
    .catch(() => {});

  window.DropperCart = {
    isOpen: false,
    renderLastCart: null,

    init: function() {
      this.bindEvents();
      this.refreshCart(false); // initial silent sync
    },

    bindEvents: function() {
      const overlay = document.getElementById('DropperCartOverlay');
      const closeBtn = document.getElementById('DropperCartClose');
      
      if (overlay) {
        overlay.addEventListener('click', () => this.close());
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close());
      }

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Intercept any click on header cart links or buttons with [data-open-cart]
      document.querySelectorAll('a[href="/cart"], .editorial-cart-btn, [data-open-cart]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });

      // Listen for custom add-to-cart events across the page
      document.addEventListener('dropper:cart:open', () => this.open());
      document.addEventListener('dropper:cart:refresh', () => this.refreshCart(true));
    },

    open: function() {
      const drawer = document.getElementById('DropperCartDrawer');
      if (drawer) {
        drawer.classList.add('active');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
        this.refreshCart(false);
      }
    },

    close: function() {
      const drawer = document.getElementById('DropperCartDrawer');
      if (drawer) {
        drawer.classList.remove('active');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        this.isOpen = false;
      }
    },

    refreshCart: function(openAfterRefresh = false) {
      fetch('/cart.js', {
        headers: { 'Accept': 'application/json' }
      })
      .then(res => res.json())
      .then(cart => {
        this.render(cart);
        if (openAfterRefresh) {
          this.open();
        }
      })
      .catch(err => console.warn('[DropperCart] Fetch cart error:', err));
    },

    addItem: function(items, openDrawer = true) {
      // Record conversion for MAB Free Shipping threshold
      if (activeBanditVariant) {
        fetch('/api/bandit/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experimentId: 'free-shipping-threshold',
            variantId: activeBanditVariant
          })
        }).catch(() => {});
      }

      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ items: Array.isArray(items) ? items : [items] })
      })
      .then(res => res.json())
      .then(data => {
        this.refreshCart(openDrawer);
        return data;
      })
      .catch(err => {
        console.error('[DropperCart] Add item error:', err);
      });
    },

    updateQty: function(lineKey, quantity) {
      fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id: lineKey, quantity: quantity })
      })
      .then(res => res.json())
      .then(cart => {
        this.render(cart);
      })
      .catch(err => console.error('[DropperCart] Change qty error:', err));
    },

    quickAddUpsell: function(variantId, title, priceCents) {
      this.addItem([{
        id: variantId,
        quantity: 1
      }], true);
    },

    render: function(cart) {
      this.renderLastCart = cart;
      // 1. Update Cart Count Badges
      const countBadges = document.querySelectorAll('#DropperCartCount, .editorial-cart-count, .cart-pill');
      countBadges.forEach(b => b.textContent = cart.item_count || 0);

      // 2. Free Shipping Meter
      const meterText = document.getElementById('ShippingMeterText');
      const meterFill = document.getElementById('ShippingMeterFill');
      const subtotalEl = document.getElementById('DropperSubtotal');
      const checkoutTotalEl = document.getElementById('DropperCheckoutTotal');

      const totalCents = cart.total_price || 0;
      const formattedTotal = `$${(totalCents / 100).toFixed(2)}`;

      if (subtotalEl) subtotalEl.textContent = formattedTotal;
      if (checkoutTotalEl) checkoutTotalEl.textContent = formattedTotal;

      if (meterText && meterFill) {
        if (totalCents >= activeThresholdCents) {
          meterText.innerHTML = '<span class="shipping-unlocked">🎉 You\'ve unlocked Free Standard Shipping!</span>';
          meterFill.style.width = '100%';
          meterFill.style.backgroundColor = '#2D3B2D';
        } else {
          const remaining = ((activeThresholdCents - totalCents) / 100).toFixed(2);
          const percent = Math.min(100, Math.max(0, (totalCents / activeThresholdCents) * 100));
          meterText.innerHTML = `Add <strong>$${remaining}</strong> to unlock <strong>Free Standard Shipping</strong>`;
          meterFill.style.width = `${percent}%`;
          meterFill.style.backgroundColor = '#2D3B2D';
        }
      }

      // 3. Render Items
      const emptyState = document.getElementById('DropperCartEmptyState');
      const listContainer = document.getElementById('DropperCartItemsList');
      const upsellSection = document.getElementById('DropperDrawerUpsells');
      const footerSection = document.getElementById('DropperDrawerFooter');

      if (!listContainer) return;

      if (!cart.items || cart.items.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        listContainer.innerHTML = '';
        if (footerSection) footerSection.style.opacity = '0.5';
        if (footerSection) footerSection.style.pointerEvents = 'none';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (footerSection) footerSection.style.opacity = '1';
      if (footerSection) footerSection.style.pointerEvents = 'auto';

      let html = '';
      cart.items.forEach(item => {
        const itemImg = item.image ? item.image : 'https://placehold.co/100x100?text=Item';
        const itemPrice = `$${(item.final_line_price / 100).toFixed(2)}`;
        const variantTitle = item.variant_title ? `<div class="cart-item-variant">${item.variant_title}</div>` : '';

        html += `
          <div class="cart-item-row" data-line-key="${item.key}">
            <img src="${itemImg}" alt="${item.title}" class="cart-item-img" width="68" height="68" loading="lazy">
            <div class="cart-item-details">
              <a href="${item.url}" class="cart-item-title">${item.product_title}</a>
              ${variantTitle}
              <div class="cart-item-bottom">
                <div class="cart-item-qty">
                  <button type="button" class="qty-btn" onclick="DropperCart.updateQty('${item.key}', ${item.quantity - 1})" aria-label="Decrease quantity">&minus;</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button type="button" class="qty-btn" onclick="DropperCart.updateQty('${item.key}', ${item.quantity + 1})" aria-label="Increase quantity">&plus;</button>
                </div>
                <div class="cart-item-price">${itemPrice}</div>
              </div>
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;
    }
  };

  // Boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.DropperCart.init());
  } else {
    window.DropperCart.init();
  }
})();
