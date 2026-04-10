/* ══════════════════════════════════════════════════════════
   RENTFIT — home.js
   Dynamic home page: featured products, reviews, hero stats
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

const cart = new Cart();

function fmt(n) { return Number(n).toLocaleString() + '₮'; }

const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 0 1-8 0"/>
</svg>`;

// ── Stats class — computes summary metrics from JSON data ─
class Stats {
  #products;
  #reviews;

  constructor(products, reviews) {
    this.#products = products;
    this.#reviews  = reviews;
  }

  // Total item count
  get totalItems() {
    return this.#products.length;
  }

  // Unique brand count using map + reduce
  get totalBrands() {
    const brands = this.#products.map(p => p.brand);
    const unique  = brands.reduce((set, b) => { set.add(b); return set; }, new Set());
    return unique.size;
  }

  // Average rating across all reviews using filter + reduce
  get avgRating() {
    const valid = this.#reviews.filter(r => typeof r.rating === 'number');
    if (!valid.length) return '—';
    const sum = valid.reduce((s, r) => s + r.rating, 0);
    return (sum / valid.length).toFixed(1);
  }

  // Total review count
  get totalReviews() {
    return this.#reviews.length;
  }
}

// ── HomePage class — renders all dynamic sections ─────────
class HomePage {
  #products = [];
  #reviews  = [];

  // ── Data loading ───────────────────────────────────────
  async load() {
    [this.#products, this.#reviews] = await Promise.all([
      fetch('/public/json/product.json').then(r => r.json()).catch(() => []),
      fetch('/public/json/review.json').then(r => r.json()).catch(() => []),
    ]);
  }

  // ── Hero stats — dynamic numbers from JSON ─────────────
  renderStats() {
    const stats = new Stats(this.#products, this.#reviews);

    const el = id => document.getElementById(id);
    if (el('stat-items'))   el('stat-items').textContent   = stats.totalItems + '+';
    if (el('stat-brands'))  el('stat-brands').textContent  = stats.totalBrands + '+';
    if (el('stat-rating'))  el('stat-rating').textContent  = stats.avgRating;
    // stat-users stays static (10k+)
  }

  // ── Featured products — top 4 by rating ───────────────
  renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    // filter premium or high-rated, sort by rating, take top 4
    const top4 = this.#products
      .filter(p => p.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    grid.innerHTML = top4.map(p => `
      <article class="product-card" data-id="${p.id}" style="cursor:pointer">
        <div class="card-visual">
          <img src="/public/source/${p.img_src}" alt="${p.item_name}">
          <span class="badge badge--new">${p.status}</span>
          <button class="card-heart" data-id="${p.id}">&#10084;</button>
          <button class="card-cart" data-id="${p.id}" title="Сагсанд нэмэх">${CART_SVG}</button>
          <button class="card-quick-buy" data-id="${p.id}">Хурдан авах</button>
        </div>
        <div class="card-body">
          <p class="card-brand">${p.brand.toUpperCase()}</p>
          <h3 class="card-name">${p.item_name}</h3>
          <div class="rating">
            <span class="rating-stars">${'★'.repeat(Math.round(p.rating))}</span>
            <span class="rating-count">${p.rating} (${p.review_count})</span>
          </div>
          <div class="card-footer">
            <div>
              <p>Өдөрт</p>
              <strong>${p.price}</strong>
            </div>
            <a class="card-detail-link" href="/public/html/product.html?id=${p.id}">Харах →</a>
          </div>
        </div>
      </article>`).join('');

    this.#wireFeaturedCards(grid, top4);
  }

  // ── Wire cart/quick-buy/heart/click on featured cards ──
  #wireFeaturedCards(grid, products) {
    // Build id→product lookup
    const byId = products.reduce((map, p) => { map[p.id] = p; return map; }, {});

    grid.querySelectorAll('.product-card').forEach(card => {
      const id      = parseInt(card.dataset.id, 10);
      const product = byId[id];

      // Card click → product detail (but not on buttons/links)
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        location.href = `/public/html/product.html?id=${id}`;
      });

      // "Харах →" link stops propagation
      card.querySelector('.card-detail-link')
        ?.addEventListener('click', e => e.stopPropagation());

      // Heart
      card.querySelector('.card-heart').addEventListener('click', function (e) {
        e.stopPropagation();
        this.classList.toggle('liked');
      });

      // Cart button
      const cartBtn = card.querySelector('.card-cart');
      if (cart.has(id)) { cartBtn.classList.add('in-cart'); cartBtn.title = 'Сагснаас хасах'; }

      cartBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (this.classList.contains('in-cart')) {
          cart.remove(id);
          this.classList.remove('in-cart');
          this.title = 'Сагсанд нэмэх';
        } else {
          if (product) cart.addProduct(product);
          this.classList.add('in-cart');
          this.title = 'Сагснаас хасах';
        }
      });

      // Quick-buy
      card.querySelector('.card-quick-buy').addEventListener('click', (e) => {
        e.stopPropagation();
        if (product) cart.addProduct(product);
        location.href = `/public/html/cart.html?quick=${id}`;
      });
    });
  }

  // ── Reviews — 3 top-rated reviews from review.json ────
  renderReviews() {
    const container = document.getElementById('home-review-container');
    if (!container) return;

    // Pick 3 five-star reviews, one per product (filter + reduce + slice)
    const seen    = new Set();
    const top3    = this.#reviews
      .filter(r => r.rating === 5)
      .reduce((acc, r) => {
        if (!seen.has(r.product_id)) { seen.add(r.product_id); acc.push(r); }
        return acc;
      }, [])
      .slice(0, 3);

    container.innerHTML = top3.map(rv => `
      <article class="review-card">
        <p class="stars">${'★'.repeat(rv.rating)}</p>
        <p>${rv.comment}</p>
        <hr>
        <footer>
          <p class="reviewer-initial">${rv.name.charAt(0)}</p>
          <strong>${rv.name}</strong>
        </footer>
      </article>`).join('');
  }

  // ── Render all sections ────────────────────────────────
  render() {
    this.renderStats();
    this.renderFeatured();
    this.renderReviews();
  }

  // ── Boot ─────────────────────────────────────────────
  async init() {
    await this.load();
    this.render();
  }
}

new HomePage().init();
