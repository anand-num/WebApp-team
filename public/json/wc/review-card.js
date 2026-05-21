/* ══════════════════════════════════════════════════════════
   review-card.js — Web Component
   Нэг хэрэглэгчийн сэтгэгдлийн карт.

   Attribute-ээр дамжуулан мэдээлэл авна:
   <review-card
     rating="5"
     author="Б.Мөнхзул"
     date="2025-03-15"
     comment="Маш гоё байсан!"
   ></review-card>

   Эсвэл JS-ээр: card.setReview({ rating, author, date, comment })
══════════════════════════════════════════════════════════ */

export class ReviewCard extends HTMLElement {
  constructor() {
    super();
    /** @type {Object|null} Сэтгэгдлийн мэдээлэл */
    this.review = null;
  }

  connectedCallback() {
    // Attribute-уудаас мэдээллийг уншина
    this.review = {
      rating:  parseInt(this.getAttribute('rating'))   || 0,
      author:  this.getAttribute('author')             || 'Хэрэглэгч',
      date:    this.getAttribute('date')               || '2025-01-01',
      comment: this.getAttribute('comment')            || 'Сэтгэгдэл байхгүй',
    };
    this.render();
  }

  // ── Туслах функцууд ────────────────────────────────────────

  /**
   * Нэрнээс эхний үсгийг (avatar-д зориулж) авна.
   * @param {string} name
   * @returns {string} Нэг үсэг, жишээ: "Б"
   */
  _getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  /**
   * Үнэлгээнээс одны HTML бүтээнэ.
   * @param {number} rating - 0–5
   * @returns {string} "★★★★☆" гэх мэт
   */
  _getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  // ── Рендерлэх ─────────────────────────────────────────────

  /** Сэтгэгдлийн картын HTML-ийг бүтээнэ. */
  render() {
    const author  = this.review.author;
    const initial = this._getInitial(author);
    const stars   = this._getStars(this.review.rating);

    this.innerHTML = `
      <article class="review-card">
        <div class="review-hd">
          <!-- Avatar: нэрийн эхний үсэг -->
          <div class="reviewer-initial">${initial}</div>
          <div class="reviewer-info">
            <strong class="reviewer-name">${this._escape(author)}</strong>
            <div class="stars">${stars}</div>
          </div>
          <time class="review-date">${this._escape(this.review.date)}</time>
        </div>
        <p class="review-text">${this._escape(this.review.comment)}</p>
      </article>
    `;
  }

  // ── Аюулгүй байдал ────────────────────────────────────────

  /**
   * XSS халдлагаас хамгаалахын тулд тусгай тэмдэгтүүдийг encode хийнэ.
   * @param {string} str
   * @returns {string}
   */
  _escape(str) {
    if (!str) return '';
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  // ── Публик API ────────────────────────────────────────────

  /**
   * Сэтгэгдлийн мэдээллийг шинэчилж дахин рендерлэнэ.
   * review-list.js ашиглана.
   * @param {Object} reviewData - { rating, author, date, comment }
   */
  setReview(reviewData) {
    this.review = reviewData;
    this.render();
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

if (!customElements.get('review-card')) {
  customElements.define('review-card', ReviewCard);
}

export default ReviewCard;
