/* ══════════════════════════════════════════════════════════
   home-reviews.js — Web Component
   Нүүр хуудасны сэтгэгдлийн хэсэг.
   5 одтой, бүтээгдэхүүн бүрээс нэг (давхардаагүй) дээд 3
   сэтгэгдлийг <review-list> дотор харуулна.

   Хэрэглэх: <home-reviews></home-reviews>
══════════════════════════════════════════════════════════ */

import './review-card.js';
import './review-list.js';

class HomeReviews extends HTMLElement {
  constructor() {
    super();
    /** @type {Array} Харуулах шилдэг сэтгэгдлүүд */
    this.reviews = [];
  }

  async connectedCallback() {
    await this.loadReviews();
    this.render();
  }

  // ── Мэдээлэл ──────────────────────────────────────────────

  /**
   * JSON файлаас 5 одтой, бүтээгдэхүүн бүрээс нэг дээд 3 сэтгэгдлийг ачаална.
   * Бүтээгдэхүүн давхардахгүйн тулд product_id-аар Set ашиглана.
   */
  async loadReviews() {
    try {
      const response = await fetch('/public/json/review.json');
      const allReviews = await response.json();

      const seenProductIds = new Set();

      this.reviews = allReviews
        .filter(r => r.rating === 5)                    // Зөвхөн 5 одтой
        .reduce((acc, r) => {
          if (!seenProductIds.has(r.product_id)) {
            seenProductIds.add(r.product_id);
            acc.push(r);                                // Бүтээгдэхүүн бүрээс нэгийг нэмнэ
          }
          return acc;
        }, [])
        .slice(0, 3);                                   // Хамгийн ихдээ 3
    } catch (error) {
      console.error('Сэтгэгдэл ачаалах амжилтгүй:', error);
      this.reviews = [];
    }
  }

  // ── Рендерлэх ─────────────────────────────────────────────

  /**
   * Сэтгэгдлүүдийг <review-list> компонентод дамжуулж харуулна.
   * Хоосон бол мессеж харуулна.
   */
  render() {
    if (this.reviews.length === 0) {
      this.innerHTML = '<p class="no-reviews">Сэтгэгдэл байхгүй байна.</p>';
      return;
    }

    this.innerHTML = '<review-list id="home-reviews-list"></review-list>';

    // setReviews() нь review-list.js-ийн метод
    const reviewsList = this.querySelector('#home-reviews-list');
    if (reviewsList && reviewsList.setReviews) {
      reviewsList.setReviews(this.reviews);
    }
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('home-reviews', HomeReviews);
export default HomeReviews;
