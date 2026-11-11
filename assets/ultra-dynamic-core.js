/**
 * Ultra-Dynamic Core — Bizi Bees / Luma
 * Magnetic CTAs, 3D tilt + specular, reactive aura, live radar pill.
 * Vanilla JS, no dependencies. Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (reduceMotion) return;
    var nodes = document.querySelectorAll('.ud-magnetic, .boutique-btn-primary, [data-ud-magnetic]');
    nodes.forEach(function (btn) {
      if (btn.dataset.udMagneticInit) return;
      btn.dataset.udMagneticInit = '1';
      btn.classList.add('ud-magnetic');
      var inner = btn.querySelector('.ud-magnetic-inner');
      if (!inner) {
        inner = document.createElement('span');
        inner.className = 'ud-magnetic-inner';
        while (btn.firstChild) inner.appendChild(btn.firstChild);
        btn.appendChild(inner);
      }
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        var strength = 0.22;
        btn.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
        inner.style.transform = 'translate(' + (x * strength * 0.4) + 'px,' + (y * strength * 0.4) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
        inner.style.transform = '';
      });
    });
  }

  /* ---------- 3D holographic tilt + specular ---------- */
  function initTilt() {
    if (reduceMotion) return;
    var cards = document.querySelectorAll('.ud-tilt-card, .boutique-card, .bizi-product-card, [data-ud-tilt]');
    cards.forEach(function (card) {
      if (card.dataset.udTiltInit) return;
      card.dataset.udTiltInit = '1';
      card.classList.add('ud-tilt-card');
      var specular = card.querySelector('.ud-specular');
      if (!specular) {
        specular = document.createElement('div');
        specular.className = 'ud-specular';
        card.appendChild(specular);
      }
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (py - 0.5) * -12;
        var ry = (px - 0.5) * 14;
        card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(1.02,1.02,1.02)';
        card.style.setProperty('--ud-mx', (px * 100) + '%');
        card.style.setProperty('--ud-my', (py * 100) + '%');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
        card.classList.remove('is-tilting');
      });
    });
  }

  /* ---------- Reactive ambient aura (swatches) ---------- */
  function initAura() {
    var sections = document.querySelectorAll('[data-ud-aura]');
    sections.forEach(function (sec) {
      sec.classList.add('ud-aura-section');
      var swatches = sec.querySelectorAll('[data-swatch-color], [data-color]');
      swatches.forEach(function (sw) {
        var color = sw.getAttribute('data-swatch-color') || sw.getAttribute('data-color') || '#0D9488';
        function apply() {
          sec.style.setProperty('--ud-aura-color', colorToRgba(color, 0.14));
        }
        sw.addEventListener('mouseenter', apply);
        sw.addEventListener('focus', apply);
        sw.addEventListener('click', apply);
      });
    });
  }

  function colorToRgba(hex, alpha) {
    var c = (hex || '#0D9488').replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var r = parseInt(c.slice(0, 2), 16) || 13;
    var g = parseInt(c.slice(2, 4), 16) || 148;
    var b = parseInt(c.slice(4, 6), 16) || 136;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ---------- Live city radar pill ---------- */
  var CITIES = [
    'Salt Lake City, UT',
    'Denver, CO',
    'Phoenix, AZ',
    'Boise, ID',
    'Las Vegas, NV',
    'Portland, OR',
    'Austin, TX',
    'Seattle, WA'
  ];

  function initRadar() {
    var pills = document.querySelectorAll('[data-ud-radar]');
    if (!pills.length) return;
    pills.forEach(function (el) {
      el.classList.add('ud-radar-pill');
      var idx = 0;
      function tick() {
        var mins = 2 + Math.floor(Math.random() * 11);
        el.innerHTML =
          '<span class="ud-radar-dot" aria-hidden="true"></span>' +
          '<span>Dispatched to ' + CITIES[idx % CITIES.length] + ' · ' + mins + 'm ago</span>';
        idx++;
      }
      tick();
      setInterval(tick, 14000);
    });
  }

  function boot() {
    initMagnetic();
    initTilt();
    initAura();
    initRadar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-init after Shopify section / cart AJAX re-renders
  document.addEventListener('shopify:section:load', boot);
  document.addEventListener('cart:updated', function () {
    setTimeout(initMagnetic, 100);
  });
})();
