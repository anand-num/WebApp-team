/* ══════════════════════════════════════════════════════════
   review-list.js — Web Component
   Сэтгэгдлүүдийн жагсаалт.
   Дотроо <review-card> компонентуудыг үүсгэнэ.

   Хэрэглэх (product-page.js дотор):
   const list = this.querySelector('review-list');
   list.setReviews(reviewsArray);       // шууд өгөх
   // эсвэл
   list.loadReviews(productId);         // JSON-аас ачаалах
══════════════════════════════════════════════════════════ */

import './review-card.js';

export class ReviewsList extends HTMLElement {
  constructor() {
    super();
    /** @type {Array} Харуулах сэтгэгдлүүд */
    this.reviews = [];
  }

  connectedCallback() {
    this.render(); // Эхлээд хоосон бүтэц рендерлэнэ
  }

  // ── Мэдээлэл ──────────────────────────────────────────────

  /**
   * JSON файлаас тодорхой бүтээгдэхүүний сэтгэгдлүүдийг ачаална.
   * @param {number|string} productId
   */
  async loadReviews(productId) {
    try {
      const response = await fetch('/public/json/review.json');
      const allReviews = await response.json();
      this.reviews = allReviews.filter(r => r.product_id == productId);
      this.renderReviews();
    } catch (error) {
      console.error('Сэтгэгдэл ачаалах амжилтгүй:', error);
      this.innerHTML = '<p class="error">Сэтгэгдэлүүдийг ачааллаж чадсангүй</p>';
    }
  }

  /**
   * Сэтгэгдлийн массивыг шууд өгч харуулна.
   * product-page.js болон home-reviews.js ашиглана.
   * @param {Array} reviews
   */
  setReviews(reviews) {
    this.reviews = reviews;
    this.renderReviews();
  }

  /**
   * Нэг сэтгэгдэл нэмж дахин рендерлэнэ.
   * @param {Object} review
   */
  addReview(review) {
    this.reviews.push(review);
    this.renderReviews();
  }

  // ── Тооцоолол ─────────────────────────────────────────────

  /**
   * Дундаж үнэлгээг тооцоолно.
   * @returns {number} 0–5 (сэтгэгдэл байхгүй бол 0)
   */
  getAverageRating() {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  // ── Рендерлэх ─────────────────────────────────────────────

  /** Гарчиг болон хоосон контейнерийг рендерлэнэ. */
  render() {
    this.innerHTML = `
      <section class="reviews pd-reviews">
        <div class="review-header">
          <p>Сэтгэгдэл</p>
          <h2>Үйлчлүүлэгчдийн үнэлгээ</h2>
        </div>
        <div class="review-container" id="review-container"></div>
      </section>
    `;
  }

  /**
   * Сэтгэгдэл бүрт <review-card> компонент үүсгэж контейнерт нэмнэ.
   * Сэтгэгдэл байхгүй бол мессеж харуулна.
   */
  renderReviews() {
    const container = this.querySelector('#review-container');
    if (!container) return;

    if (this.reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">Энэ бүтээгдэхүүнд сэтгэгдэл байхгүй байна.</p>';
      return;
    }

    container.innerHTML = '';

    this.reviews.forEach(review => {
      const card = document.createElement('review-card');
      card.setAttribute('rating',  review.rating);
      card.setAttribute('author',  review.author    || review.user_name || 'Хэрэглэгч');
      card.setAttribute('date',    review.date       || review.created_at || '2025-01-01');
      card.setAttribute('comment', review.comment    || review.review_text || 'Сэтгэгдэл байхгүй');
      container.appendChild(card);
    });
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

if (!customElements.get('reviews-list')) {
  customElements.define('reviews-list', ReviewsList);
}

export default ReviewsList;
