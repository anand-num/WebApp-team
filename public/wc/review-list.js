// reviews-list.js
import './review-card.js';

export class ReviewList extends HTMLElement {
  constructor() {
    super();
    this.reviews = [];
  }

  connectedCallback() {
    this.render();
  }

  // Helper function to get initials from name
  getInitials(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  // Load reviews from JSON data
  async loadReviews(productId) {
    try {
      const reviewsResponse = await fetch('/public/json/review.json');
      const allReviews = await reviewsResponse.json();
      
      this.reviews = allReviews.filter(r => r.product_id == productId);
      this.renderReviews();
    } catch (error) {
      console.error('Failed to load reviews:', error);
      const container = this.querySelector('#review-container');
      if (container) {
        container.innerHTML = '<p class="error">Сэтгэгдэлүүдийг ачааллаж чадсангүй</p>';
      }
    }
  }

  // Set reviews directly 
  setReviews(reviews) {
    this.reviews = reviews;
    this.renderReviews();
  }

  render() {
    // Main wrapper structure - only create once
    if (!this.innerHTML) {
      this.innerHTML = `
        <div id="review-container"></div>
      `;

      console.log('ReviewList component rendered');
    }
  }

  renderReviews() {
    const container = this.querySelector('#review-container');
    if (!container) return;

    if (this.reviews.length === 0) {
      container.innerHTML = '<p class="no-reviews">Харамсалтай нь энэ бүтээгдэхүүнд сэтгэгдэл байхгүй байна.</p>';
      return;
    }

    // Clear container
    container.innerHTML = '';

    // Create review-card components for each review
    this.reviews.forEach(review => {
      const reviewCard = document.createElement('review-card');
      
      // Set attributes for the review card
      reviewCard.setAttribute('rating', review.rating);
      reviewCard.setAttribute('author', review.author || review.user_name || 'Хэрэглэгч');
      reviewCard.setAttribute('comment', review.comment || review.review_text || 'Сэтгэгдэл байхгүй');
      reviewCard.setAttribute('user-name', review.user_name || review.author);
      
      container.appendChild(reviewCard);
    });
  }

  // Add a single review
  addReview(review) {
    this.reviews.push(review);
    this.renderReviews();
  }

  // Get average rating
  getAverageRating() {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }
}

// Register the component
if (!customElements.get('review-list')) {
  customElements.define('review-list', ReviewList);
}

export default ReviewList;