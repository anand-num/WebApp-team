// home-reviews.js
import './review-card.js';
import './review-list.js';

class HomeReviews extends HTMLElement {
  constructor() {
    super();
    this.reviews = [];
  }

  async connectedCallback() {
    await this.loadReviews();
    this.render();
  }

  async loadReviews() {
    try {
      const response = await fetch('/public/json/review.json');
      const allReviews = await response.json();

      // Get unique reviews (one per product) with rating >= 4
      const seen = new Set();
      this.reviews = allReviews
        .filter(r => r.rating >= 4)
        .reduce((acc, r) => {
          if (!seen.has(r.product_id)) {
            seen.add(r.product_id);
            acc.push(r);
          }
          return acc;
        }, [])
        .slice(0, 3);  // Show top 3 reviews
      
      console.log('🏠 Home reviews loaded:', this.reviews.length);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      this.reviews = [];
    }
  }

  render() {
    if (!this.reviews || this.reviews.length === 0) {
      this.innerHTML = `
        <section class="reviews-home">
          <p class="no-reviews">Сэтгэгдэл байхгүй байна.</p>
        </section>
      `;
      return;
    }

    this.innerHTML = `
      <section class="reviews-home">
        <review-list id="home-reviews-list" data-manual></review-list>
      </section>
    `;

    // Pass the filtered reviews to review-list component
    const reviewsList = this.querySelector('#home-reviews-list');
    if (reviewsList && typeof reviewsList.setReviews === 'function') {
      reviewsList.setReviews(this.reviews);
    }
  }
}

// Register the component
if (!customElements.get('home-reviews')) {
  customElements.define('home-reviews', HomeReviews);
}

export default HomeReviews;