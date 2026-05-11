// wc/home-reviews.js
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
      
      // Get top 3 unique reviews (5 stars, one per product)
      const seen = new Set();
      this.reviews = allReviews
        .filter(r => r.rating === 5)
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
    if (this.reviews.length === 0) {
      this.innerHTML = '<p class="no-reviews">Сэтгэгдэл байхгүй байна.</p>';
      return;
    }

    // Use the reviews-list component
    this.innerHTML = `
      <review-list id="home-reviews-list"></review-list>
    `;

    // Set the reviews data
    const reviewsList = this.querySelector('#home-reviews-list');
    if (reviewsList && reviewsList.setReviews) {
      reviewsList.setReviews(this.reviews);
    }
  }
  
}

customElements.define('home-reviews', HomeReviews);
export default HomeReviews;