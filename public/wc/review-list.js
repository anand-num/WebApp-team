// review-list.js
import './review-card.js';

export class ReviewList extends HTMLElement {
  constructor() {
    super();
    this.reviews = [];
    this.productId = null;
    this.useManualReviews = false;
  }

  connectedCallback() {
    this.render();
    
    // Check if this instance will receive manual reviews
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
      // Get product ID from URL if on product page
      const urlParams = new URLSearchParams(window.location.search);
      this.productId = urlParams.get('id');

      if (this.productId) {
        // Product page - fetch product with embedded reviews
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();
        const product = products.find(p => p.id == this.productId);
        
        if (product && product.reviews) {
          this.reviews = product.reviews;
          console.log(`📦 Product reviews loaded: ${this.reviews.length}`);
        } else {
          this.reviews = [];
        }
      }
      
      this.renderReviews();
    } catch (error) {
      console.error('Failed to load reviews:', error);
      this.showError();
    }
  }

  /**
   * Public API: Manually set reviews (used by product-page.js)
   */
  setReviews(reviews) {
    this.useManualReviews = true;
    this.reviews = reviews || [];
    this.renderReviews();
    console.log(`📝 Manual reviews set: ${this.reviews.length} reviews`);
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
    
    // Add styles if not present
    if (!document.querySelector('#review-list-styles')) {
      const style = document.createElement('style');
      style.id = 'review-list-styles';
      style.textContent = `
        .reviews-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .no-reviews {
          text-align: center;
          padding: 3rem;
          background: var(--background-secondary, #f5f0e8);
          border-radius: 16px;
          color: var(--text-secondary, #685d54);
        }
        
        .no-reviews p {
          margin: 0.5rem 0;
        }
        
        .no-reviews-sub {
          font-size: 0.85rem;
          opacity: 0.7;
        }
        
        .error-message {
          text-align: center;
          padding: 2rem;
          color: var(--red, #c0392b);
        }
        
        .error-message button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: var(--gold, #c9a84c);
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .reviews-container {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  renderReviews() {
    const container = this.querySelector('.reviews-container');
    if (!container) return;

    if (!this.reviews || this.reviews.length === 0) {
      container.innerHTML = `
        <div class="no-reviews">
          <p>📝 Харамсалтай нь энэ бүтээгдэхүүнд сэтгэгдэл байхгүй байна.</p>
          <p class="no-reviews-sub">Та хамгийн түрүүнд сэтгэгдэл үлдээгээрэй!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    // Create review cards from embedded review data
    this.reviews.forEach((review) => {
      const reviewCard = document.createElement('review-card');
      
      // Map embedded review fields to review-card attributes
      const authorName = review.name || review.user_name || 'Хэрэглэгч';
      const rating = review.rating || 0;
      const comment = review.comment || 'Сэтгэгдэл байхгүй';
      
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
          <p>❌ Сэтгэгдлүүдийг ачааллахад алдаа гарлаа</p>
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