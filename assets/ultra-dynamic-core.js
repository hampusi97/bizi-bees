/* ==========================================================
   ULTRA-DYNAMIC CORE ENGINE v4.2 (60 FPS WebGL/CSS Transform)
   Repo: bizi-bees /assets/ultra-dynamic-core.js
   ========================================================== */

(function() {
  // 1. MAGNETIC BUTTON PHYSICS
  function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn, .button--primary, .luma-buy-now-btn, .tier-btn-primary, .luma-instant-checkout-btn');
    
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate3d(${x * 0.25}px, ${y * 0.25}px, 0) scale(1.03)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0) scale(1)';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'none';
      });
    });
  }

  // 2. 3D HOLOGRAPHIC CARD TILT & SPECULAR GLARE
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.card-wrapper, .luma-tier-card, .flavor-card, .tilt-card, .direct-vs-amazon-box, .gamified-rewards-wrapper');
    
    cards.forEach(card => {
      // Inject Glare Reflection Element
      if (!card.querySelector('.card-glare')) {
        const glare = document.createElement('div');
        glare.className = 'card-glare';
        card.appendChild(glare);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        
        // Move specular glare
        const glare = card.querySelector('.card-glare');
        if (glare) {
          glare.style.opacity = '1';
          glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        const glare = card.querySelector('.card-glare');
        if (glare) glare.style.opacity = '0';
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });
    });
  }

  // 3. REACTIVE AMBIENT AURA (Color Morphing)
  window.morphAmbientAura = function(hexColor) {
    const aura = document.getElementById('dynamicAmbientAura');
    if (aura) {
      aura.style.background = `radial-gradient(circle at 50% 30%, ${hexColor}33 0%, rgba(255,255,255,0) 70%)`;
    }
  };

  // 4. LIVE CITY RADAR DISPATCH PULSE
  function initLiveCityPulse() {
    const cities = ["Salt Lake City, UT", "Austin, TX", "Scottsdale, AZ", "Denver, CO", "Seattle, WA", "Nashville, TN", "San Diego, CA", "Provo, UT"];
    const ticker = document.getElementById('liveRadarCity');
    if (!ticker) return;

    let index = 0;
    setInterval(() => {
      ticker.style.opacity = '0';
      ticker.style.transform = 'translateY(6px)';
      
      setTimeout(() => {
        index = (index + 1) % cities.length;
        ticker.innerText = cities[index];
        ticker.style.opacity = '1';
        ticker.style.transform = 'translateY(0)';
      }, 400);
    }, 4500);
  }

  // Auto-boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMagneticButtons();
      init3DCardTilt();
      initLiveCityPulse();
    });
  } else {
    initMagneticButtons();
    init3DCardTilt();
    initLiveCityPulse();
  }
})();
