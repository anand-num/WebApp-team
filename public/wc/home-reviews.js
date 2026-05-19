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

      // Get top 3 unique reviews (rating 4, one per product)
      const seen = new Set();
      this.reviews = allReviews
        .filter(r => r.rating === 4)
        .reduce((acc, r) => {
          if (!seen.has(r.product_id)) {
            seen.add(r.product_id);
            acc.push(r);
          }
          return acc;
        }, [])
        .slice(0, 3);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      this.reviews = [];
    }
  }

  render() {
    // Use your global class names so provided CSS applies (light DOM)
    if (!this.reviews || this.reviews.length === 0) {
      this.innerHTML = `
        <section class="reviews-home">
          <div class="review-header">
            <h2>Үйлчлүүлэгчдийн сэтгэгдэл</h2>
          </div>
          <p class="no-reviews">Сэтгэгдэл байхгүй байна.</p>
        </section>
      `;
      return;
    }

    this.innerHTML = `
      <section class="reviews-home">
        <div class="review-header">
          <h2>Топ сэтгэгдэл</h2>
        </div>
        <reviews-list id="home-reviews-list" class="reviews-list"></reviews-list>
      </section>
    `;

    // Pass the reviews to the child reviews-list component using its public API
    const reviewsList = this.querySelector('#home-reviews-list');
    if (reviewsList) {
      if (typeof reviewsList.setReviews === 'function') {
        reviewsList.setReviews(this.reviews);
      } else {
        // Fallback: set property and dispatch event; reviews-list listens to setReviews normally
        reviewsList.reviews = this.reviews;
        reviewsList.dispatchEvent(new CustomEvent('reviews-updated', { bubbles: true }));
      }
    }
  }
}

if (!customElements.get('home-reviews')) {
  customElements.define('home-reviews', HomeReviews);
}

export default HomeReviews;