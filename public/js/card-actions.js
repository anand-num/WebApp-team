/* ══════════════════════════════════════════════════════════
   RENTFIT — card-actions.js
   Injects cart icon + quick-buy onto static product cards
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

const cart = new Cart();

const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 0 1-8 0"/>
</svg>`;

// ── CardActions class ────────────────────────────────────
class CardActions {
  #products = [];

  // ── Load product list ────────────────────────────────
  async load() {
    for (const path of ['/public/json/product.json', '../json/product.json']) {
      try {
        const r = await fetch(path);
        if (r.ok) { this.#products = await r.json(); break; }
      } catch (_) {}
    }
  }

  // ── Match card to product by image filename ──────────
  matchProduct(imgSrc) {
    const file = imgSrc.split('/').pop();
    return this.#products.find(p => p.img_src === file) || null;
  }

  // ── Inject buttons into a single card ────────────────
  injectCard(card) {
    const visual = card.querySelector('.card-visual');
    if (!visual || visual.querySelector('.card-cart')) return;

    const img     = visual.querySelector('img');
    const product = img ? this.matchProduct(img.src) : null;

    // Card click → product detail
    if (product) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        location.href = `/public/html/product.html?id=${product.id}`;
      });
      const viewLink = card.querySelector('.card-footer a');
      if (viewLink) {
        viewLink.href = `/public/html/product.html?id=${product.id}`;
        viewLink.addEventListener('click', e => e.stopPropagation());
      }
    }

    // Heart button stopPropagation
    card.querySelector('.card-heart')?.addEventListener('click', e => e.stopPropagation());

    // Cart button
    const cartBtn = document.createElement('button');
    cartBtn.className = 'card-cart';
    cartBtn.title     = 'Сагсанд нэмэх';
    cartBtn.innerHTML = CART_SVG;

    if (product && cart.has(product.id)) {
      cartBtn.classList.add('in-cart');
      cartBtn.title = 'Сагснаас хасах';
    }

    cartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cartBtn.classList.contains('in-cart')) {
        if (product) cart.remove(product.id);
        cartBtn.classList.remove('in-cart');
        cartBtn.title = 'Сагсанд нэмэх';
      } else {
        if (product) cart.addProduct(product);
        cartBtn.classList.add('in-cart');
        cartBtn.title = 'Сагснаас хасах';
      }
    });

    // Quick-buy button
    const quickBtn = document.createElement('button');
    quickBtn.className   = 'card-quick-buy';
    quickBtn.textContent = 'Хурдан авах';
    quickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (product) {
        cart.addProduct(product);
        location.href = `/public/html/cart.html?quick=${product.id}`;
      }
    });

    visual.appendChild(cartBtn);
    visual.appendChild(quickBtn);
  }

  // ── Process all cards on the page ────────────────────
  injectAll() {
    document.querySelectorAll('.product-card').forEach(card => this.injectCard(card));
  }

  // ── Boot ─────────────────────────────────────────────
  async init() {
    await this.load();
    this.injectAll();
  }
}

new CardActions().init();
