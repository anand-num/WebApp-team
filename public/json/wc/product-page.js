/* ══════════════════════════════════════════════════════════
   product-page.js — Web Component
   Бүтээгдэхүүний дэлгэрэнгүй хуудас.
   URL-аас ID уншиж, JSON-аас бараа болон сэтгэгдлийг ачаална.

   Хэрэглэх: <product-page></product-page>
   Шаардлага: product.html?id=<бараанй ID>

   Дотоод хамааралтай компонентууд:
   - <review-list>  (review-list.js)
   - parsePrice, formatPrice, toggleLiked, isLiked (product-card.js)
══════════════════════════════════════════════════════════ */

import { parsePrice, formatPrice, toggleLiked, isLiked } from './product-card.js';
import './review-list.js';

class ProductPage extends HTMLElement {
  // ... existing code ...

  /** Бүтээгдэхүүний дэлгэрэнгүй хуудасны HTML бүтэц. */
  render() {
    const filledStars = '★'.repeat(Math.round(this.product.rating));
    const emptyStars  = '☆'.repeat(5 - Math.round(this.product.rating));

    const stockStatus = this.product.stock > 0 ? 'Бэлэн' : 'Дууссан';
    const stockColor  = this.product.stock > 0 ? '#27ae60' : '#d32f2f';

    // Размарын radio товчнуудыг үүсгэнэ
    const sizesHtml = this.product.sizes?.map(size => `
      <label class="sz-opt">
        <input type="radio" name="size" value="${size}">
        <span>${size}</span>
      </label>
    `).join('') || '<p>Размер байхгүй</p>';

    const productIsLiked     = isLiked(this.product.id);
    const wishlistBtnText    = productIsLiked ? '♥ Дуртайд нэмэгдсэн' : '♡ Дуртайд нэмэх';
    const wishlistBtnClass   = productIsLiked ? 'btn-wish--active' : '';

    this.innerHTML = `
      <!-- Breadcrumb навигаци -->
      <div class="breadcrumb">
        <a href="/public/html/browse.html">Бүтээгдэхүүн</a>
        <span>›</span>
        <a href="/public/html/browse.html">Түрээс</a>
        <span>›</span>
        <span aria-current="page">${this.product.item_name}</span>
      </div>

      <main class="pd-layout">
        <!-- Бүтээгдэхүүний зураг -->
        <figure class="image-container image-container--portrait">
          <img id="pd-img"
               src="/public/source/${this.product.img_src}"
               alt="${this.product.item_name}"
               style="width:100%;height:100%;object-fit:cover;">
        </figure>

        <!-- Мэдээллийн хэсэг -->
        <article class="pd-info">
          <p class="pd-brand">${this.product.brand}</p>
          <h1 class="pd-name">${this.product.item_name}</h1>

          <!-- Үнэлгээ + нөөц -->
          <p class="pd-meta">
            <span class="rating-stars">${filledStars}${emptyStars}</span>
            <strong>${this.product.rating}</strong>
            <a href="#reviews" class="pd-rv-link">${this.reviews.length} сэтгэгдэл</a>
            <span class="pd-sep" aria-hidden="true">·</span>
            <span class="pd-stock" style="color:${stockColor}">${stockStatus}</span>
          </p>

          <p class="pd-desc">${this.product.description || 'Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл байхгүй байна.'}</p>

          <!-- Түрээсийн огноо сонгогч -->
          <fieldset class="pd-dates" style="border:none;padding:0;margin:0 0 28px;">
            <legend>ТҮРЭЭСИЙН ХУГАЦАА</legend>
            <div class="form-group" style="display:flex;gap:16px;margin-top:12px;">
              <div style="flex:1;">
                <label for="pd-from" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:6px;">Эхлэх огноо *</label>
                <input type="date" id="pd-from" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:4px;background:var(--surface);">
              </div>
              <div style="flex:1;">
                <label for="pd-to" style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:6px;">Дуусах огноо *</label>
                <input type="date" id="pd-to" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:4px;background:var(--surface);">
              </div>
            </div>
          </fieldset>

          <!-- Размар сонгогч -->
          <fieldset class="sz-opts" id="sz-opts">
            <legend>РАЗМЕР</legend>
            ${sizesHtml}
          </fieldset>

          <!-- Нийт үнэ (огноо сонгосны дараа шинэчлэгдэнэ) -->
          <div class="pd-total">
            <span class="pd-total-lbl">НИЙТ ДҮН</span>
            <strong class="pd-total-price" id="pd-total-price">—</strong>
          </div>

          <!-- Үйлдлийн товчнууд -->
          <button class="btn-primary"   id="btn-request" type="button">📩 Хүсэлт илгээх</button>
          <button class="btn-secondary ${wishlistBtnClass}" id="btn-wish" type="button">${wishlistBtnText}</button>

          <!-- Давуу талуудын жагсаалт -->
          <ul class="pd-perks">
            <li>✓ 24 цагийн дотор хүргэнэ</li>
            <li>✓ Угаалга, цэвэрлэгээ манай хариуцлага</li>
            <li>✓ Хамгаалалтын мөнгө буцаагдана</li>
            <li>✓ Размер таарахгүй бол солиулж болно</li>
          </ul>
        </article>
      </main>

      <!-- Сэтгэгдлийн жагсаалт — review-list.js ачаалж харуулна -->
      <review-list id="reviews-list"></review-list>
    `;
  }

  /**
   * URL-аас бараа ID уншиж, product.json болон review.json-аас
   * зэрэг (parallel) мэдээллийг ачаална.
   */
  async loadData() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      console.error('URL-д бараа ID байхгүй байна');
      return;
    }

    try {
      // Хоёр файлыг зэрэг ачаална (Promise.all → хурдан)
      const [productsRes, reviewsRes] = await Promise.all([
        fetch('/public/json/product.json'),
        fetch('/public/json/review.json'),
      ]);

      const products   = await productsRes.json();
      const allReviews = await reviewsRes.json();

      // Энэ бүтээгдэхүүнийг олно
      this.product = products.find(p => p.id == productId);

      if (this.product) {
        // Зөвхөн энэ бараатай холбоотой сэтгэгдлийг шүүнэ
        this.reviews   = allReviews.filter(r => r.product_id == this.product.id);
        this.basePrice = parsePrice(this.product.price);

        // render() дуусмагц review-list компонентод өгнө
        setTimeout(() => {
          const reviewsList = this.querySelector('#reviews-list');
          if (reviewsList && reviewsList.setReviews) {
            reviewsList.setReviews(this.reviews);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Мэдээлэл ачаалах амжилтгүй:', error);
    }
  }

  /**
   * Сэтгэгдлүүдийн дундаж үнэлгээг тооцоолно.
   * Сэтгэгдэл байхгүй бол бүтээгдэхүүний анхны үнэлгээг буцаана.
   * @returns {number}
   */
  getavgRating() {
    if (!this.reviews.length) return this.product.rating;
    const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  // ... rest of your existing code ...
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('product-page', ProductPage);
