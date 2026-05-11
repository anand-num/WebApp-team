// review-card.js
export class ReviewCard extends HTMLElement {
  constructor() {
    super();
    this.review = null;
  }

  connectedCallback() {
    // Get review data from attributes or properties
    this.review = {
      rating: parseInt(this.getAttribute('rating')) || 0,
      author: this.getAttribute('author') || 'Хэрэглэгч',
      date: this.getAttribute('date') || '2025-01-01',
      comment: this.getAttribute('comment') || 'Сэтгэгдэл байхгүй',
      user_name: this.getAttribute('user-name') || this.getAttribute('author')
    };
    
    this.render();
  }

  // Helper function to get initials from name
  getInitials(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  // Generate star rating HTML
  getStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  render() {
    const authorName = this.review.author || this.review.user_name || 'Хэрэглэгч';
    const initials = this.getInitials(authorName);
    const stars = this.getStars(this.review.rating);
    const comment = this.review.comment || this.review.review_text || 'Сэтгэгдэл байхгүй';
    const date = this.review.date || this.review.created_at || '2025-01-01';

    this.innerHTML = `
      <article class="review-card">
        <div class="review-hd">
          <div class="reviewer-initial">${initials}</div>
          <div class="reviewer-info">
            <strong class="reviewer-name">${this.escapeHtml(authorName)}</strong>
            <div class="stars">${stars}</div>
          </div>
          <time class="review-date">${this.escapeHtml(date)}</time>
        </div>
        <p class="review-text">${this.escapeHtml(comment)}</p>
      </article>
    `;
  }

  // Simple XSS protection
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Method to update review data dynamically
  setReview(reviewData) {
    this.review = reviewData;
    this.render();
  }
}

// Register the component
if (!customElements.get('review-card')) {
  customElements.define('review-card', ReviewCard);
}

export default ReviewCard;