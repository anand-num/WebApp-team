// review-list.js
import './review-card.js';

export class ReviewList extends HTMLElement {
  constructor() {
    super();
    this.reviews = [];
    this.productId = null;
    this.useManualReviews = false;
    this.isInitialized = false;
  }

  connectedCallback() {
    this.render();
    
    // Check if this instance will receive manual reviews
    // by looking for a specific attribute
    if (this.hasAttribute('data-manual')) {
      this.useManualReviews = true;
      console.log('📝 Review-list in manual mode, waiting for setReviews()');
    } else {
      // Auto-load mode (for product page)
      this.loadReviews();
    }
  }

async loadReviews() {
  if (this.useManualReviews) {
    console.log('⚠️ Skipping auto-load, using manual reviews');
    return;
  }
  
  try {
    // JSON файлаас биш API-с авах
    const urlParams = new URLSearchParams(window.location.search);
    this.productId = urlParams.get('id');

    const response = await fetch('http://localhost:3000/api/reviews');
    const allReviews = await response.json();
    
    if (this.productId) {
      // Product page — тухайн product-ийн review-үүд
      this.reviews = allReviews.filter(r => r.product_id == this.productId);
      console.log(`📦 Product reviews: ${this.reviews.length}`);
    } else {
      // Home page — хамгийн ихдээ 6
      this.reviews = allReviews.slice(0, 6);
      console.log(`🏠 Home reviews: ${this.reviews.length}`);
    }
    
    this.renderReviews();
  } catch (error) {
    console.error('Failed to load reviews:', error);
    this.showError();
  }
}

  /**
   * Public API: Manually set reviews (used by home-reviews component)
   */
  setReviews(reviews) {
    this.useManualReviews = true;
    this.reviews = reviews;
    this.renderReviews();
    console.log(`📝 Manual reviews set: ${reviews.length} reviews`);
  }

  /**
   * Public API: Clear all reviews
   */
  clearReviews() {
    this.reviews = [];
    this.renderReviews();
  }

  render() {
    if (!this.innerHTML) {
      this.innerHTML = `
        <div class="reviews-container"></div>
      `;
    }
  }

  renderReviews() {
    const container = this.querySelector('.reviews-container');
    if (!container) return;

    if (!this.reviews || this.reviews.length === 0) {
      if (this.productId && !this.useManualReviews) {
        container.innerHTML = `
          <div class="no-reviews">
            <p>Харамсалтай нь энэ бүтээгдэхүүнд сэтгэгдэл байхгүй байна.</p>
            <p class="no-reviews-sub">Та энэ бүтээгдэхүүнийг түрээслээд анхны сэтгэгдэл үлдээгээрэй!</p>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="no-reviews">
            <p>📝 Сэтгэгдлүүд байхгүй байна.</p>
          </div>
        `;
      }
      return;
    }

    container.innerHTML = '';

    // Create review cards
    this.reviews.forEach((review, index) => {
      const reviewCard = document.createElement('review-card');
      
      // Map JSON fields to review-card attributes
      const authorName = review.name || review.author || review.user_name || 'Хэрэглэгч';
      const rating = review.rating || 0;
      const comment = review.comment || review.review_text || 'Сэтгэгдэл байхгүй';
      
      reviewCard.setAttribute('rating', rating);
      reviewCard.setAttribute('author', authorName);
      reviewCard.setAttribute('comment', comment);
      reviewCard.setAttribute('user-name', authorName);
      
      container.appendChild(reviewCard);
    });
    
    console.log(`✅ Rendered ${this.reviews.length} reviews`);
  }

  showError() {
    const container = this.querySelector('.reviews-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>Сэтгэгдэлүүдийг ачааллахад алдаа гарлаа</p>
          <button onclick="location.reload()">Дахин ачаалах</button>
        </div>
      `;
    }
  }

  /**
   * Get average rating of current reviews
   */
  getAverageRating() {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((s, r) => s + (r.rating || 0), 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  /**
   * Get total number of reviews
   */
  getTotalReviews() {
    return this.reviews.length;
  }
}

// Register the component
if (!customElements.get('review-list')) {
  customElements.define('review-list', ReviewList);
}

export default ReviewList;