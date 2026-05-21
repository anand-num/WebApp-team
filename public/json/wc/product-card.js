/* ══════════════════════════════════════════════════════════
   product-card.js — Web Component + Utility Functions
   Бүтээгдэхүүний карт компонент болон дэлгүүрийн
   нийтлэг туслах функцуудыг агуулна.

   Хэрэглэх:
   <product-card
     id="1"
     brand="Valentino"
     name="Evening Gown"
     price="150,000₮"
     rating="4.5"
     review-count="12"
     image="/public/source/dress.jpg"
     status="NEW"
     sizes='["S","M","L"]'
   ></product-card>
══════════════════════════════════════════════════════════ */

// ── Нийтлэг туслах функцууд ───────────────────────────────
// Эдгээрийг product-page.js болон browse-product-grid.js ашиглана.

/**
 * Үнийн мөрийг тоо руу хөрвүүлнэ.
 * @param {string} str - "150,000₮" гэх мэт форматтай мөр
 * @returns {number} 150000
 */
export function parsePrice(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Тоог үнийн форматтай мөр болгоно.
 * @param {number} num - 150000
 * @returns {string} "150,000₮"
 */
export function formatPrice(num) {
  return Number(num).toLocaleString() + '₮';
}

/**
 * Бүтээгдэхүүнийг "таалагдсан" жагсаалтд нэмэх/хасах.
 * @param {string|number} productId
 * @returns {boolean} true → нэмэгдсэн, false → хасагдсан
 */
export function toggleLiked(productId) {
  const LIKED_KEY = 'rf_liked';
  let likedIds;

  try {
    likedIds = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
  } catch {
    likedIds = [];
  }

  const index = likedIds.indexOf(productId);
  if (index === -1) {
    likedIds.push(productId);    // Нэмэх
  } else {
    likedIds.splice(index, 1);   // Хасах
  }

  localStorage.setItem(LIKED_KEY, JSON.stringify(likedIds));
  return index === -1; // true → нэмэгдсэн
}

/**
 * Бүтээгдэхүүн "таалагдсан" жагсаалтад байгаа эсэхийг шалгана.
 * @param {string|number} productId
 * @returns {boolean}
 */
export function isLiked(productId) {
  const LIKED_KEY = 'rf_liked';
  try {
    const likedIds = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    return likedIds.indexOf(productId) !== -1;
  } catch {
    return false;
  }
}

// ── Компонент ─────────────────────────────────────────────

export class ProductCard extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupListeners();
  }

  // ── Attribute getters ──────────────────────────────────────
  // HTML attribute-уудыг тохиромжтой төрөлтэйгөөр уншина.

  get productId()   { return this.getAttribute('id'); }
  get brand()       { return this.getAttribute('brand') || ''; }
  get name()        { return this.getAttribute('name') || ''; }
  get price()       { return this.getAttribute('price') || '0₮'; }
  get image()       { return this.getAttribute('image') || ''; }
  get status()      { return this.getAttribute('status') || ''; }

  get rating() {
    return parseFloat(this.getAttribute('rating')) || 0;
  }
  get reviewCount() {
    return parseInt(this.getAttribute('review-count')) || 0;
  }
  get sizes() {
    try {
      return JSON.parse(this.getAttribute('sizes') || '[]');
    } catch {
      return [];
    }
  }

  // ── Рендерлэх ─────────────────────────────────────────────

  /** Картын бүх HTML-ийг бүтээнэ. */
  render() {
    const filledStars = '★'.repeat(Math.round(this.rating));
    const emptyStars  = '☆'.repeat(5 - Math.round(this.rating));

    this.innerHTML = `
      <article class="product-card">
        <div class="card-visual">
          <img class="card-img" src="${this.image}" alt="${this.name}" loading="lazy"/>
          ${this.status ? `<span class="badge badge--new">${this.status}</span>` : ''}
          <button class="card-heart" aria-label="Таалагдсанд нэмэх">❤</button>
          <button class="card-request-btn">📩 Хүсэлт илгээх</button>
        </div>
        <div class="card-body">
          <p class="card-brand">${this.brand}</p>
          <h3 class="card-name">${this.name}</h3>
          <div class="rating">
            <span class="rating-stars">${filledStars}${emptyStars}</span>
            <span class="rating-count">${this.rating} (${this.reviewCount})</span>
          </div>
          <div class="card-footer">
            <div>
              <p class="price-lbl">Өдөрт</p>
              <strong class="card-price">${this.price}</strong>
            </div>
            <a class="card-link" href="/public/html/product.html?id=${this.productId}">Харах →</a>
          </div>
        </div>
      </article>
    `;
  }

  // ── Үйл явдлууд ───────────────────────────────────────────

  /** Картын дотоод бүх товчинд listener бүртгэнэ. */
  setupListeners() {
    this._setupHeartButton();
    this._setupCardClick();
    this._setupRequestButton();
  }

  /**
   * Зүрхний товч: таалагдсан жагсаалтд нэмэх/хасах.
   * Өөрчлөлтийг бусад хуудсуудад мэдэгдэхийн тулд CustomEvent дамжуулна.
   */
  _setupHeartButton() {
    const heartBtn = this.querySelector('.card-heart');
    if (!heartBtn) return;

    // Анхны байдлыг тохируулна
    if (isLiked(this.productId)) {
      heartBtn.classList.add('liked');
    }

    heartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const nowLiked = toggleLiked(this.productId);
      heartBtn.classList.toggle('liked', nowLiked);

      // Таалагдсан хуудас шинэчлэгдэхийн тулд event дамжуулна
      window.dispatchEvent(new CustomEvent('likedUpdated', {
        detail: { productId: this.productId, liked: nowLiked }
      }));
    });
  }

  /**
   * Карт дарагдах: бүтээгдэхүүний дэлгэрэнгүй хуудас руу шилжинэ.
   * Товч/холбоос дарагдсан бол шилжихгүй.
   */
  _setupCardClick() {
    const card = this.querySelector('.product-card');
    if (!card) return;

    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // Товч дарагдсан бол өнгөрнө
      const link = this.querySelector('.card-link');
      if (link) window.location.href = link.href;
    });
  }

  /**
   * "Хүсэлт илгээх" товч: request modal нээнэ.
   * window.openRequestModal() функц байх ёстой (request-modal.js).
   */
  _setupRequestButton() {
    const requestBtn = this.querySelector('.card-request-btn');
    if (!requestBtn) return;

    requestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const product = {
        id: this.productId,
        brand: this.brand,
        item_name: this.name,
        price: this.price,
        img_src: this.image.replace('/public/source/', ''),
        sizes: this.sizes,
        rating: this.rating,
        review_count: this.reviewCount,
      };

      if (typeof window.openRequestModal === 'function') {
        window.openRequestModal(product);
      }
    });
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('product-card', ProductCard);
