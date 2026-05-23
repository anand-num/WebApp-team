// review-card.js
export class ReviewCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.review = null;
  }

  connectedCallback() {
    // Get review data from attributes
    this.review = {
      rating: parseInt(this.getAttribute('rating')) || 0,
      author: this.getAttribute('author') || 'Хэрэглэгч',
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
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHtml += '★';
    }
    
    // Half star
    if (hasHalfStar) {
      starsHtml += '½';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '☆';
    }
    
    return starsHtml;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  render() {
    const authorName = this.review.author || this.review.user_name || 'Хэрэглэгч';
    const initials = this.getInitials(authorName);
    const stars = this.getStars(this.review.rating);
    const comment = this.review.comment || 'Сэтгэгдэл байхгүй';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .review-card {
          background: var(--background-primary, #ffffff);
          border: 1px solid var(--border, #e5d5c5);
          border-radius: 12px;
          padding: 1.25rem 1.25rem 0 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: box-shadow 0.2s, transform 0.2s;
          height: 100%;
        }

        .review-card:hover {
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
          transform: translateY(-3px);
        }

        .review-hd {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .reviewer-initial {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--gold, #c9a84c);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading, 'Playfair Display', serif);
          font-size: 1.1rem;
          font-weight: 600;
        }

        .reviewer-info {
          flex: 1;
        }

        .reviewer-name {
          display: block;
          color: var(--text-primary, #1a1714);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .stars {
          font-size: 1rem;
          color: var(--gold, #c9a84c);
          letter-spacing: 2px;
        }

        .review-text {
          color: var(--text-secondary, #685d54);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .review-card {
            padding: 1rem 1rem 0 1rem;
          }
          .reviewer-initial {
            width: 36px;
            height: 36px;
            font-size: 0.9rem;
          }
          .reviewer-name {
            font-size: 0.85rem;
          }
          .review-text {
            font-size: 0.8rem;
          }
        }
      </style>

      <article class="review-card">
        <div class="review-hd">
          <div class="reviewer-initial">${this.escapeHtml(initials)}</div>
          <div class="reviewer-info">
            <strong class="reviewer-name">${this.escapeHtml(authorName)}</strong>
            <div class="stars">${stars}</div>
          </div>
        </div>
        <p class="review-text">${this.escapeHtml(comment)}</p>
      </article>
    `;
  }

  // Method to update review data dynamically
  setReview(reviewData) {
    this.review = reviewData;
    this.render();
  }

  static get observedAttributes() {
    return ['rating', 'author', 'comment', 'user-name'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.shadowRoot) {
      this.connectedCallback();
    }
  }
}

// Register the component
if (!customElements.get('review-card')) {
  customElements.define('review-card', ReviewCard);
}

export default ReviewCard;