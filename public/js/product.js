/* ══════════════════════════════════════════════════════════
   RENTFIT — product.js
   Populates product.html from product.json using ?id=X
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

function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

function parsePrice(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

const DURATIONS = [
  { id: 'd1', days: 1, mult: 1   },
  { id: 'd3', days: 3, mult: 1.5 },
  { id: 'd7', days: 7, mult: 2.5 },
];

async function init() {
  const id = parseInt(new URLSearchParams(location.search).get('id'), 10);

  // Fetch products and reviews in parallel
  let products = null;
  let allReviews = [];

  for (const path of ['/public/json/product.json', '../json/product.json']) {
    try {
      const r = await fetch(path);
      if (r.ok) { products = await r.json(); break; }
    } catch (_) {}
  }
  for (const path of ['/public/json/review.json', '../json/review.json']) {
    try {
      const r = await fetch(path);
      if (r.ok) { allReviews = await r.json(); break; }
    } catch (_) {}
  }

  if (!products) return;
  const product = id ? products.find(p => p.id === id) : products[0];
  if (!product) return;

  const base = parsePrice(product.price);

  // ── Reviews for this product ─────────────────────────
  const reviews = allReviews.filter(r => r.product_id === product.id);

  // Calculate rating & count from reviews
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
    : product.rating;

  // ── Page title & breadcrumb ──────────────────────────
  document.title = `${product.item_name} — RentFit`;
  document.getElementById('bc-category').textContent = product.category;
  document.getElementById('bc-name').textContent     = product.item_name;

  // ── Image ────────────────────────────────────────────
  const img = document.getElementById('pd-img');
  img.src = `/public/source/${product.img_src}`;
  img.alt = product.item_name;

  // ── Text fields ──────────────────────────────────────
  document.getElementById('pd-brand').textContent  = product.brand;
  document.getElementById('pd-name').textContent   = product.item_name;
  document.getElementById('pd-stars').textContent  = '★'.repeat(Math.round(avgRating));
  document.getElementById('pd-rating').textContent = avgRating;
  document.getElementById('pd-review-count').textContent = `(${reviewCount} үнэлгээ)`;
  document.getElementById('pd-stock').textContent  = `${product.shirheg} ширхэг бэлэн`;
  document.getElementById('pd-desc').textContent   = product.description;

  // ── Render reviews ───────────────────────────────────
  const container = document.getElementById('review-container');
  if (container) {
    if (reviews.length === 0) {
      container.innerHTML = '<p style="color:var(--muted);font-size:.9rem;">Үнэлгээ байхгүй байна.</p>';
    } else {
      container.innerHTML = reviews.map(rv => `
        <article class="review-card">
          <p class="stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)}</p>
          <p>${rv.comment}</p>
          <hr>
          <footer>
            <p class="reviewer-initial">${rv.name.charAt(0)}</p>
            <strong>${rv.name}</strong>
          </footer>
        </article>`).join('');
    }
  }

  // ── Duration prices ──────────────────────────────────
  DURATIONS.forEach(({ id, mult }) => {
    const el = document.getElementById(`price-${id}`);
    if (el) el.textContent = fmt(Math.round(base * mult));
  });

  // ── Size picker — generated from product.sizes ───────
  const szOpts = document.getElementById('sz-opts');
  product.sizes.forEach((size, i) => {
    const input = document.createElement('input');
    input.type    = 'radio';
    input.name    = 'sz';
    input.id      = `sz${size}`;
    input.value   = size;
    if (i === 0) input.checked = true;

    const label = document.createElement('label');
    label.htmlFor    = `sz${size}`;
    label.textContent = size;

    szOpts.appendChild(input);
    szOpts.appendChild(label);
  });

  // ── Total price — updates on duration change ─────────
  function updateTotal() {
    const checked = document.querySelector('input[name="dur"]:checked');
    const days    = checked ? parseInt(checked.value, 10) : 3;
    const dur     = DURATIONS.find(d => d.days === days) || DURATIONS[1];
    document.getElementById('pd-total-price').textContent = fmt(Math.round(base * dur.mult));
  }

  document.querySelectorAll('input[name="dur"]').forEach(r => {
    r.addEventListener('change', updateTotal);
  });
  updateTotal();

  // ── Cart button ──────────────────────────────────────
  const cartBtn = document.getElementById('btn-cart');

  function syncCartBtn() {
    const inCart = getCart().some(i => i.id === product.id);
    cartBtn.textContent = inCart ? 'Сагснаас хасах' : 'Сагсанд нэмэх';
  }

  syncCartBtn();

  cartBtn.addEventListener('click', () => {
    const cart = getCart();
    if (cart.some(i => i.id === product.id)) {
      saveCart(cart.filter(i => i.id !== product.id));
    } else {
      const selectedSize = document.querySelector('input[name="sz"]:checked')?.value || product.sizes[0];
      cart.push({
        id:           product.id,
        name:         product.item_name,
        brand:        product.brand,
        img:          product.img_src,
        size:         selectedSize,
        basePrice:    base,
        selectedDays: parseInt(document.querySelector('input[name="dur"]:checked')?.value || '3', 10),
      });
      saveCart(cart);
    }
    syncCartBtn();
  });

  // ── Wish button ──────────────────────────────────────
  document.getElementById('btn-wish')?.addEventListener('click', function () {
    this.classList.toggle('btn-wish--active');
    this.textContent = this.classList.contains('btn-wish--active')
      ? '♥ Дуртайд нэмэгдсэн'
      : 'Дуртайд нэмэх';
  });
}

init();
