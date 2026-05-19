// review-card.js
export class ReviewCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.review = null;
  }

  connectedCallback() {
    // Get review data from attributes or properties
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
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  render() {
    const authorName = this.review.author || this.review.user_name || 'Хэрэглэгч';
    const initials = this.getInitials(authorName);
    const stars = this.getStars(this.review.rating);
    const comment = this.review.comment || this.review.review_text || 'Сэтгэгдэл байхгүй';
    // const date = this.review.date || this.review.created_at || '2025-01-01';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --background-primary: var(--background-primary, #ffffff);
          --background-secondary: var(--background-secondary, #f5f1ed);
          --background-beige-medium: var(--background-beige-medium, #e8dcc4);
          --background-beige-dark: var(--background-beige-dark, #d4c5a9);
          --text-primary: var(--text-primary, #1a1a1a);
          --text-secondary: var(--text-secondary, #666666);
          --text-tertiary: var(--text-tertiary, #999999);
          --gold: var(--gold, #c9a84c);
          --font-heading: var(--font-heading, 'Georgia', serif);
          --font-body: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
          --font-bold: var(--font-bold, 'Helvetica Neue', sans-serif);
        }

        * {
          box-sizing: border-box;
        }

        .review-card {
          background: var(--background-primary);
          border: 1px solid var(--background-beige-dark);
          border-radius: 4px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .review-card:hover {
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
          transform: translateY(-3px);
        }

        .review-hd {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .reviewer-initial {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 50%;
          background-color: rgba(201, 168, 76, 0.15);
          color: var(--gold);
          border: 1px solid rgba(201, 168, 76, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading), serif;
          font-size: 1rem;
          font-weight: 600;
          margin-top: 0;
        }

        .reviewer-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .reviewer-name {
          display: block;
          color: var(--text-primary);
          font-family: var(--font-body), sans-serif;
          font-size: 0.9rem;
          font-weight: 550;
          margin: 0;
          padding: 0;
          line-height: 1.2;
        }

        .stars {
          font-size: 1.3rem;
          color: var(--gold);
          letter-spacing: 1px;
          margin: 0;
          padding: 0;
        }


        .review-text {
          color: var(--text-secondary);
          font-family: var(--font-body), sans-serif;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          text-align: justify;
        }

        /* Responsive adjustments */
        @media (max-width: 48rem) {
          .review-card {
            padding: 1.2rem;
          }

          .reviewer-initial {
            width: 36px;
            height: 36px;
            min-width: 36px;
            font-size: 0.9rem;
          }

          .review-hd {
            gap: 0.75rem;
          }

          .reviewer-name {
            font-size: 0.85rem;
          }

          .review-text {
            font-size: 0.85rem;
          }

          .stars {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 30rem) {
          .review-card {
            padding: 1rem;
          }

          .reviewer-initial {
            width: 32px;
            height: 32px;
            min-width: 32px;
            font-size: 0.85rem;
          }

          .reviewer-name {
            font-size: 0.8rem;
          }

          .review-text {
            font-size: 0.8rem;
          }

          .stars {
            font-size: 1rem;
          }
        }
      </style>

      <article class="review-card">
        <div class="review-hd">
          <div class="reviewer-initial">${initials}</div>
          <div class="reviewer-info">
            <strong class="reviewer-name">${this.escapeHtml(authorName)}</strong>
            <div class="stars">${stars}</div>
          </div>
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

  // Allow attribute updates to trigger re-render
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.shadowRoot) {
      this.connectedCallback();
    }
  }

  // Observe these attributes for changes
  static get observedAttributes() {
    return ['rating', 'author', 'comment', 'user-name'];
  }
}

// Register the component
if (!customElements.get('review-card')) {
  customElements.define('review-card', ReviewCard);
}

export default ReviewCard;