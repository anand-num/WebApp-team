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
      // JSON файлаас биш API-с авах
      const response = await fetch('http://localhost:3000/api/reviews');

      if (!response.ok) throw new Error('API error');

      // API-с аль хэдийн шүүгдсэн өгөгдөл ирнэ
      const data = await response.json();
      
      this.reviews = data.slice(0,3);
    
      

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