/* ══════════════════════════════════════════════════════════
   RENTFIT — product.js
   Populates product.html from product.json using ?id=X
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

const cart = new Cart();

function fmt(n)         { return Number(n).toLocaleString() + '₮'; }
function parsePrice(s)  { return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0; }

const DURATIONS = [
  { id: 'd1', days: 1, mult: 1   },
  { id: 'd3', days: 3, mult: 1.5 },
  { id: 'd7', days: 7, mult: 2.5 },
];

// ── ProductPage class ────────────────────────────────────
class ProductPage {
  #product;
  #reviews;
  #base;

  constructor(product, reviews) {
    this.#product = product;
    this.#reviews = reviews;
    this.#base    = parsePrice(product.price);
  }

  // ── Computed properties ──────────────────────────────
  get reviewCount() { return this.#reviews.length; }

  get avgRating() {
    if (!this.reviewCount) return this.#product.rating;
    const sum = this.#reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviewCount) * 10) / 10;
  }

  // ── Render page ──────────────────────────────────────
  render() {
    const p = this.#product;

    document.title = `${p.item_name} — RentFit`;
    document.getElementById('bc-category').textContent = p.category;
    document.getElementById('bc-name').textContent     = p.item_name;

    const img = document.getElementById('pd-img');
    img.src = `/public/source/${p.img_src}`;
    img.alt = p.item_name;

    document.getElementById('pd-brand').textContent        = p.brand;
    document.getElementById('pd-name').textContent         = p.item_name;
    document.getElementById('pd-stars').textContent        = '★'.repeat(Math.round(this.avgRating));
    document.getElementById('pd-rating').textContent       = this.avgRating;
    document.getElementById('pd-review-count').textContent = `(${this.reviewCount} үнэлгээ)`;
    document.getElementById('pd-stock').textContent        = `${p.shirheg} ширхэг бэлэн`;
    document.getElementById('pd-desc').textContent         = p.description;

    // Duration prices
    DURATIONS.forEach(({ id, mult }) => {
      const el = document.getElementById(`price-${id}`);
      if (el) el.textContent = fmt(Math.round(this.#base * mult));
    });

    // Size picker
    const szOpts = document.getElementById('sz-opts');
    const sizes = Array.isArray(p.sizes) ? p.sizes : [p.sizes];
    sizes.forEach((size, i) => {
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'sz';
      input.id = `sz${size}`; input.value = size;
      if (i === 0) input.checked = true;
      const label = document.createElement('label');
      label.htmlFor = `sz${size}`; label.textContent = size;
      szOpts.appendChild(input);
      szOpts.appendChild(label);
    });

    this.renderReviews();
    this.setupListeners();
  }

  // ── Render reviews ───────────────────────────────────
  renderReviews() {
    const container = document.getElementById('review-container');
    if (!container) return;

    if (!this.reviewCount) {
      container.innerHTML = '<p style="color:var(--muted);font-size:.9rem;">Үнэлгээ байхгүй байна.</p>';
      return;
    }

    container.innerHTML = this.#reviews.map(rv => `
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

  // ── Update total price display ───────────────────────
  updateTotal() {
    const checked = document.querySelector('input[name="dur"]:checked');
    const days    = checked ? parseInt(checked.value, 10) : 3;
    const dur     = DURATIONS.find(d => d.days === days) || DURATIONS[1];
    document.getElementById('pd-total-price').textContent = fmt(Math.round(this.#base * dur.mult));
  }

  // ── Sync cart button label ───────────────────────────
  syncCartBtn(btn) {
    btn.textContent = cart.has(this.#product.id) ? 'Сагснаас хасах' : 'Сагсанд нэмэх';
  }

  // ── Wire up interactions ─────────────────────────────
  setupListeners() {
    const p = this.#product;

    document.querySelectorAll('input[name="dur"]').forEach(r =>
      r.addEventListener('change', () => this.updateTotal()));
    this.updateTotal();

    const cartBtn = document.getElementById('btn-cart');
    this.syncCartBtn(cartBtn);
    cartBtn.addEventListener('click', () => {
      if (cart.has(p.id)) {
        cart.remove(p.id);
      } else {
        const size = document.querySelector('input[name="sz"]:checked')?.value
          || (Array.isArray(p.sizes) ? p.sizes[0] : p.sizes);
        const days = parseInt(document.querySelector('input[name="dur"]:checked')?.value || '3', 10);
        cart.addItem({ id: p.id, name: p.item_name, brand: p.brand,
          img: p.img_src, size, basePrice: this.#base, selectedDays: days });
      }
      this.syncCartBtn(cartBtn);
    });

    document.getElementById('btn-wish')?.addEventListener('click', function () {
      this.classList.toggle('btn-wish--active');
      this.textContent = this.classList.contains('btn-wish--active')
        ? '♥ Дуртайд нэмэгдсэн' : 'Дуртайд нэмэх';
    });
  }
}

// ── Boot ─────────────────────────────────────────────────
async function init() {
  const id = parseInt(new URLSearchParams(location.search).get('id'), 10);

  const [products, allReviews] = await Promise.all([
    fetch('/public/json/product.json').then(r => r.json()).catch(() => null),
    fetch('/public/json/review.json').then(r => r.json()).catch(() => []),
  ]);

  if (!products) return;
  const product = id ? products.find(p => p.id === id) : products[0];
  if (!product) return;

  const reviews = allReviews.filter(r => r.product_id === product.id);
  new ProductPage(product, reviews).render();
}

init();
