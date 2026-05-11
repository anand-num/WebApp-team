// reviews-list.js
import './review-card.js';

export class ReviewsList extends HTMLElement {
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
      this.innerHTML = '<p class="error">Сэтгэгдэлүүдийг ачааллаж чадсангүй</p>';
    }
  }

  // Set reviews directly (if you already have the data)
  setReviews(reviews) {
    this.reviews = reviews;
    this.renderReviews();
  }

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
      reviewCard.setAttribute('date', review.date || review.created_at || '2025-01-01');
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
if (!customElements.get('reviews-list')) {
  customElements.define('reviews-list', ReviewsList);
}

export default ReviewsList;