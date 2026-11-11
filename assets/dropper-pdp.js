/* ==========================================================================
   DROPPER OS - MOBILE STICKY CONVERSION BAR (PDP OBSERVER)
   Repo: bizi-bees /assets/dropper-pdp.js
   ========================================================================== */

(function() {
  function initStickyBar() {
    const stickyBar = document.getElementById('DropperStickyBar');
    const stickyAddBtn = document.getElementById('StickyAddToCartBtn');
    if (!stickyBar) return;

    // Locate the primary PDP Add to Cart button on the page
    const targetButtons = [
      document.querySelector('form[action*="/cart/add"] [type="submit"]'),
      document.querySelector('.luma-buy-now-btn'),
      document.querySelector('.button--primary'),
      document.getElementById('AddToCart'),
      document.querySelector('.product-form__submit')
    ].filter(Boolean);

    const mainBtn = targetButtons[0];

    if (mainBtn && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // If the button is NOT intersecting (scrolled past), show sticky bar
          if (!entry.isIntersecting) {
            stickyBar.classList.add('visible');
            stickyBar.setAttribute('aria-hidden', 'false');
          } else {
            stickyBar.classList.remove('visible');
            stickyBar.setAttribute('aria-hidden', 'true');
          }
        });
      }, {
        threshold: 0.1
      });

      observer.observe(mainBtn);
    }

    // Bind Quick Add action
    if (stickyAddBtn) {
      stickyAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find selected variant ID if available from select or input
        let variantId = stickyAddBtn.getAttribute('data-variant-id');
        const formVariantInput = document.querySelector('form[action*="/cart/add"] [name="id"]');
        if (formVariantInput && formVariantInput.value) {
          variantId = formVariantInput.value;
        }

        if (window.DropperCart) {
          stickyAddBtn.disabled = true;
          const origText = stickyAddBtn.innerText;
          stickyAddBtn.innerText = 'Adding...';

          window.DropperCart.addItem({
            id: variantId,
            quantity: 1
          }, true).finally(() => {
            stickyAddBtn.disabled = false;
            stickyAddBtn.innerText = origText;
          });
        } else {
          // Fallback direct POST
          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: variantId, quantity: 1 })
          }).then(() => {
            window.location.href = '/cart';
          });
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyBar);
  } else {
    initStickyBar();
  }
})();
