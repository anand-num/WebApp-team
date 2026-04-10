/* ══════════════════════════════════════════════════════════
   RENTFIT — browse.js
   Product catalog with filtering, sorting, and pagination
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// ── Shared cart instance ─────────────────────────────────
const cart = new Cart();

function parsePrice(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

// ── ProductBrowser class ─────────────────────────────────
class ProductBrowser {
  #products  = [];
  #page      = 1;
  #pageSize  = 8;
  #category  = 'All';
  #size      = 'All';
  #search    = '';
  #sort      = 'new';
  #maxPrice  = 500000;

  constructor() {
    this.grid     = document.getElementById('catGrid');
    this.template = document.getElementById('product-template');
    this.catInfo  = document.getElementById('catInfo');
  }

  // ── Data loading ───────────────────────────────────────
  async load() {
    const r = await fetch('/public/json/product.json');
    this.#products = await r.json();
  }

  // ── Filtering & sorting ────────────────────────────────
  getFiltered() {
    let list = this.#products;

    if (this.#category !== 'All')
      list = list.filter(p => p.category === this.#category);

    if (this.#search) {
      const q = this.#search.toLowerCase();
      list = list.filter(p =>
        p.item_name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    if (this.#size !== 'All')
      list = list.filter(p => Array.isArray(p.sizes) && p.sizes.includes(this.#size));

    list = list.filter(p => parsePrice(p.price) <= this.#maxPrice);

    if (this.#sort === 'price-asc')
      list = [...list].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (this.#sort === 'price-desc')
      list = [...list].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    else if (this.#sort === 'rating')
      list = [...list].sort((a, b) => b.rating - a.rating);

    return list;
  }

  // ── Rendering ──────────────────────────────────────────
  display() {
    const filtered   = this.getFiltered();
    const totalPages = Math.ceil(filtered.length / this.#pageSize);

    if (this.#page > totalPages) this.#page = Math.max(1, totalPages);

    const start = (this.#page - 1) * this.#pageSize;
    const page  = filtered.slice(start, start + this.#pageSize);

    this.grid.innerHTML = '';
    this.catInfo.textContent = `${filtered.length} бараа олдлоо`;

    page.forEach(product => this.#renderCard(product));
    this.#updatePagination(filtered.length);
  }

  #renderCard(product) {
    const card    = this.template.content.cloneNode(true);
    const cardEl  = card.querySelector('.product-card');
    const cartBtn = card.querySelector('.card-cart');

    card.querySelector('.card-img').src            = `/public/source/${product.img_src}`;
    card.querySelector('.card-img').alt            = product.item_name;
    card.querySelector('.badge').textContent       = product.status || '';
    card.querySelector('.card-brand').textContent  = product.brand;
    card.querySelector('.card-name').textContent   = product.item_name;
    card.querySelector('.rating-stars').textContent = '★'.repeat(Math.round(product.rating));
    card.querySelector('.rating-count').textContent = `${product.rating} (${product.review_count})`;
    card.querySelector('.card-price').textContent  = product.price;

    // Card → product detail
    cardEl.style.cursor = 'pointer';
    cardEl.addEventListener('click', () => {
      location.href = `/public/html/product.html?id=${product.id}`;
    });

    // "Харах →" link
    const link = card.querySelector('.card-link');
    if (link) {
      link.href = `/public/html/product.html?id=${product.id}`;
      link.addEventListener('click', e => e.stopPropagation());
    }

    // Heart toggle
    card.querySelector('.card-heart').addEventListener('click', function (e) {
      e.stopPropagation();
      this.classList.toggle('liked');
    });

    // Cart toggle
    if (cart.has(product.id)) {
      cartBtn.classList.add('in-cart');
      cartBtn.title = 'Сагснаас хасах';
    }
    cartBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (this.classList.contains('in-cart')) {
        cart.remove(product.id);
        this.classList.remove('in-cart');
        this.title = 'Сагсанд нэмэх';
      } else {
        cart.addProduct(product);
        this.classList.add('in-cart');
        this.title = 'Сагснаас хасах';
      }
    });

    // Quick-buy
    card.querySelector('.card-quick-buy').addEventListener('click', (e) => {
      e.stopPropagation();
      cart.addProduct(product);
      location.href = `/public/html/cart.html?quick=${product.id}`;
    });

    this.grid.appendChild(card);
  }

  #updatePagination(total) {
    const totalPages = Math.ceil(total / this.#pageSize);
    const btns = document.querySelectorAll('.pgb');
    btns[0].disabled = this.#page === 1;
    btns[1].textContent = '1';
    btns[1].classList.toggle('on', this.#page === 1);
    btns[1].style.display = totalPages >= 1 ? '' : 'none';
    btns[2].textContent = '2';
    btns[2].classList.toggle('on', this.#page === 2);
    btns[2].style.display = totalPages >= 2 ? '' : 'none';
    btns[3].disabled = this.#page >= totalPages;
  }

  // ── Filter setters (each triggers re-display) ──────────
  setCategory(v)  { this.#category = v; this.#page = 1; this.display(); }
  setSize(v)      { this.#size = v;     this.#page = 1; this.display(); }
  setSearch(v)    { this.#search = v;   this.#page = 1; this.display(); }
  setSort(v)      { this.#sort = v;                     this.display(); }
  setMaxPrice(v)  { this.#maxPrice = v; this.#page = 1; this.display(); }
  setPage(v)      { this.#page = v;                     this.display(); }

  reset() {
    this.#category = 'All'; this.#size = 'All'; this.#search = '';
    this.#sort = 'new'; this.#maxPrice = 500000; this.#page = 1;
    document.querySelector('input[name="cat"][value="All"]').checked  = true;
    document.querySelector('input[name="size"][value="All"]').checked = true;
    const priceRange = document.querySelector('.price-range');
    const priceLabel = document.querySelector('.pr-inputs span');
    priceRange.value = 500000;
    priceLabel.textContent = '≤ 500,000₮';
    document.getElementById('srchInp').value = '';
    document.getElementById('sortSel').value = 'new';
    this.display();
  }

  // ── Wire up all controls ───────────────────────────────
  setupListeners() {
    document.querySelectorAll('input[name="cat"]').forEach(r =>
      r.addEventListener('change', () => this.setCategory(r.value)));

    document.querySelectorAll('input[name="size"]').forEach(r =>
      r.addEventListener('change', () => this.setSize(r.value)));

    document.getElementById('srchInp').addEventListener('input', e =>
      this.setSearch(e.target.value.trim()));

    document.getElementById('sortSel').addEventListener('change', e =>
      this.setSort(e.target.value));

    const priceRange = document.querySelector('.price-range');
    const priceLabel = document.querySelector('.pr-inputs span');
    priceRange.addEventListener('input', () => {
      priceLabel.textContent = `≤ ${parseInt(priceRange.value).toLocaleString()}₮`;
      this.setMaxPrice(parseInt(priceRange.value, 10));
    });

    document.querySelector('.flt-reset').addEventListener('click', () => this.reset());

    document.querySelectorAll('.pgb').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const total = Math.ceil(this.getFiltered().length / this.#pageSize);
        if (i === 0 && this.#page > 1)      this.setPage(this.#page - 1);
        else if (i === 1)                   this.setPage(1);
        else if (i === 2)                   this.setPage(2);
        else if (i === 3 && this.#page < total) this.setPage(this.#page + 1);
      });
    });
  }
}

// ── Boot ─────────────────────────────────────────────────
const browser = new ProductBrowser();
browser.load().then(() => {
  browser.display();
  browser.setupListeners();
});
