/* ══════════════════════════════════════════════════════════
   home-featured.js — Web Component
   Нүүр хуудасны "Онцлох бүтээгдэхүүн" хэсэг.
   Үнэлгээ хамгийн өндөр (≥4.5) дээд 4 барааг харуулна.

   Хэрэглэх: <featured-products></featured-products>
══════════════════════════════════════════════════════════ */

class FeaturedProducts extends HTMLElement {
  constructor() {
    super();
    /** @type {Array} Харуулах бүтээгдэхүүнүүд (шүүсний дараа) */
    this.products = [];
  }

  async connectedCallback() {
    await this.loadProducts();
    this.render();
    this.attachEventListeners();
  }

  // ── Мэдээлэл ──────────────────────────────────────────────

  /**
   * JSON файлаас өндөр үнэлгээтэй дээд 4 барааг ачаална.
   * Үнэлгээ 4.5-аас дээш, буурах эрэмбэлэлттэйгээр.
   */
  async loadProducts() {
    try {
      const response = await fetch('/public/json/product.json');
      const allProducts = await response.json();

      this.products = allProducts
        .filter(p => p.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    } catch (error) {
      console.error('Онцлох бараа ачаалах амжилтгүй:', error);
    }
  }

  // ── Таалагдсан жагсаалт ────────────────────────────────────

  /**
   * localStorage-аас таалагдсан барааны ID-уудыг уншина.
   * @returns {Array<number>}
   */
  getLikedIds() {
    try {
      return JSON.parse(localStorage.getItem('rf_liked')) || [];
    } catch {
      return [];
    }
  }

  /**
   * Барааг таалагдсан жагсаалтд нэмэх/хасах.
   * @param {number} id - Барааны ID
   * @returns {boolean} true → нэмэгдсэн, false → хасагдсан
   */
  toggleLiked(id) {
    const ids = this.getLikedIds();
    const idx = ids.indexOf(id);
    if (idx === -1) {
      ids.push(id);
    } else {
      ids.splice(idx, 1);
    }
    localStorage.setItem('rf_liked', JSON.stringify(ids));
    return idx === -1; // true → нэмэгдсэн
  }

  // ── Рендерлэх ─────────────────────────────────────────────

  /** Бүтээгдэхүүний grid болон толгой хэсгийг бүтээнэ. */
  render() {
    const likedIds = this.getLikedIds();

    this.innerHTML = `
      <header class="featured-header">
        <p class="section-tag" aria-hidden="true">Онцлох</p>
        <h2 class="section-title">Түгээмэл хувцаснууд</h2>
      </header>

      <div class="product-grid" id="featured-grid">
        ${this.products.map(p => this._cardHTML(p, likedIds)).join('')}
      </div>

      <div class="featured-cta">
        <a href="/public/html/browse.html" class="btn-secondary">Бүх каталог →</a>
      </div>
    `;
  }

  /**
   * Нэг барааны карт HTML-ийг бүтээнэ.
   * @param {Object} p - Бүтээгдэхүүний мэдээлэл
   * @param {Array} likedIds - Таалагдсан ID-уудын жагсаалт
   * @returns {string} HTML мөр
   */
  _cardHTML(p, likedIds) {
    const filledStars = '★'.repeat(Math.round(p.rating));
    const emptyStars  = '☆'.repeat(5 - Math.round(p.rating));
    const isLiked     = likedIds.includes(p.id);

    return `
      <article class="product-card" data-id="${p.id}">
        <div class="card-visual">
          <img src="/public/source/${p.img_src}" alt="${p.item_name}">
          <span class="badge badge--new">${p.status}</span>
          <button class="card-heart ${isLiked ? 'liked' : ''}" data-id="${p.id}">❤️</button>
          <button class="card-request-btn" data-id="${p.id}">📩 Хүсэлт илгээх</button>
        </div>
        <div class="card-body">
          <p class="card-brand">${p.brand.toUpperCase()}</p>
          <h3 class="card-name">${p.item_name}</h3>
          <div class="rating">
            <span class="rating-stars">${filledStars}${emptyStars}</span>
            <span class="rating-count">${p.rating} (${p.review_count})</span>
          </div>
          <div class="card-footer">
            <div>
              <p class="price-lbl">Өдөрт</p>
              <strong class="card-price">${p.price}</strong>
            </div>
            <a class="card-link" href="/public/html/product.html?id=${p.id}">Харах →</a>
          </div>
        </div>
      </article>
    `;
  }

  // ── Үйл явдлууд ───────────────────────────────────────────

  /** Зүрх, хүсэлт, карт товчнуудад listener бүртгэнэ. */
  attachEventListeners() {
    this._setupHeartButtons();
    this._setupRequestButtons();
    this._setupCardClicks();
  }

  /** Зүрхний товч бүрт таалагдах/болиулах listener нэмнэ. */
  _setupHeartButtons() {
    this.querySelectorAll('.card-heart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const nowLiked = this.toggleLiked(id);
        btn.classList.toggle('liked', nowLiked);
      });
    });
  }

  /**
   * "Хүсэлт илгээх" товч бүрт listener нэмнэ.
   * window.openRequestModal() функц байх ёстой (request-modal.js).
   */
  _setupRequestButtons() {
    this.querySelectorAll('.card-request-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const product = this.products.find(p => p.id === id);
        if (product && typeof window.openRequestModal === 'function') {
          window.openRequestModal(product);
        }
      });
    });
  }

  /** Карт дарагдах үед бүтээгдэхүүний хуудас руу шилжинэ. */
  _setupCardClicks() {
    this.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return; // Товч/холбоос бол өнгөрнө
        location.href = `/public/html/product.html?id=${card.dataset.id}`;
      });
    });
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('featured-products', FeaturedProducts);
export default FeaturedProducts;
