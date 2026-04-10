/* ══════════════════════════════════════════════════════════
   RENTFIT — card-actions.js
   Injects cart icon + quick-buy onto any static product card
   and wires up localStorage cart logic.
══════════════════════════════════════════════════════════ */
'use strict';

const CART_KEY = 'rf_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addToCart(product) {
  const cart = getCart();
  if (cart.some(i => i.id === product.id)) return;
  cart.push({
    id:           product.id,
    name:         product.item_name,
    brand:        product.brand,
    img:          product.img_src,
    size:         product.sizes[0],
    basePrice:    parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0,
    selectedDays: 1,
  });
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
}

const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 0 1-8 0"/>
</svg>`;

// Fetch product list, match each card by image filename, inject buttons
async function initCards() {
  let products = [];
  for (const path of ['/public/json/product.json', '../json/product.json']) {
    try {
      const r = await fetch(path);
      if (r.ok) { products = await r.json(); break; }
    } catch (_) {}
  }

  // Find product by matching img filename
  function matchProduct(imgSrc) {
    const file = imgSrc.split('/').pop();
    return products.find(p => p.img_src === file) || null;
  }

  document.querySelectorAll('.product-card').forEach(card => {
    const visual = card.querySelector('.card-visual');
    if (!visual) return;

    // Skip cards already processed (browse.js handles those via template)
    if (visual.querySelector('.card-cart')) return;

    const img = visual.querySelector('img');
    const product = img ? matchProduct(img.src) : null;

    // ── Card click → product detail page ─────────────
    const productCard = visual.closest('.product-card');
    if (productCard && product) {
      productCard.style.cursor = 'pointer';
      productCard.addEventListener('click', () => {
        location.href = `/public/html/product.html?id=${product.id}`;
      });
      // Fix static "Харах →" link if present
      const viewLink = productCard.querySelector('.card-footer a');
      if (viewLink) {
        viewLink.href = `/public/html/product.html?id=${product.id}`;
        viewLink.addEventListener('click', e => e.stopPropagation());
      }
    }

    // ── Cart icon button ──────────────────────────────
    const cartBtn = document.createElement('button');
    cartBtn.className = 'card-cart';
    cartBtn.title = 'Сагсанд нэмэх';
    cartBtn.innerHTML = CART_SVG;

    // Mark if already in cart
    if (product && getCart().some(i => i.id === product.id)) {
      cartBtn.classList.add('in-cart');
      cartBtn.title = 'Сагснаас хасах';
    }

    cartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cartBtn.classList.contains('in-cart')) {
        if (product) removeFromCart(product.id);
        cartBtn.classList.remove('in-cart');
        cartBtn.title = 'Сагсанд нэмэх';
      } else {
        if (product) addToCart(product);
        cartBtn.classList.add('in-cart');
        cartBtn.title = 'Сагснаас хасах';
      }
    });

    // ── Quick-buy button ──────────────────────────────
    const quickBtn = document.createElement('button');
    quickBtn.className = 'card-quick-buy';
    quickBtn.textContent = 'Хурдан авах';

    quickBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (product) addToCart(product);
      location.href = `/public/html/cart.html?quick=${product ? product.id : ''}`;
    });

    visual.appendChild(cartBtn);
    visual.appendChild(quickBtn);
  });
}

initCards();
