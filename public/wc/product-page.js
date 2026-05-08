// product-page.js (updated version using the extracted components)
import { parsePrice, formatPrice, toggleLiked, isLiked } from './product-card.js';
import './review-list.js';  // Import the reviews component

class ProductPage extends HTMLElement {
  // ... existing code ...

  render() {
    const stars = '★'.repeat(Math.round(this.product.rating)) +
      '☆'.repeat(5 - Math.round(this.product.rating));

    const stockStatus = this.product.stock > 0 ? 'Бэлэн' : 'Дууссан';
    const stockColor = this.product.stock > 0 ? '#27ae60' : '#d32f2f';

    const sizesHtml = this.product.sizes?.map(size => `
      <label class="sz-opt">
        <input type="radio" name="size" value="${size}">
        <span>${size}</span>
      </label>
    `).join('') || '<p>Размер байхгүй</p>';

    const isProductLiked = isLiked(this.product.id);
    const wishlistButtonText = isProductLiked ? '♥ Дуртайд нэмэгдсэн' : '♡ Дуртайд нэмэх';
    const wishlistButtonClass = isProductLiked ? 'btn-wish--active' : '';

    this.innerHTML = `
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a href="/public/html/browse.html">Бүтээгдэхүүн</a>
        <span>›</span>
        <a href="/public/html/browse.html">Түрээс</a>
        <span>›</span>
        <span aria-current="page">${this.product.item_name}</span>
      </div>

      <main class="pd-layout">
        <figure class="image-container image-container--portrait">
          <img id="pd-img" src="/public/source/${this.product.img_src}" alt="${this.product.item_name}" style="width: 100%; height: 100%; object-fit: cover;">
        </figure>

        <article class="pd-info">
          <p class="pd-brand">${this.product.brand}</p>
          <h1 class="pd-name">${this.product.item_name}</h1>

          <p class="pd-meta">
            <span class="rating-stars">${stars}</span>
            <strong>${this.product.rating}</strong>
            <a href="#reviews" class="pd-rv-link">${this.reviews.length} сэтгэгдэл</a>
            <span class="pd-sep" aria-hidden="true">·</span>
            <span class="pd-stock" style="color: ${stockColor}">${stockStatus}</span>
          </p>

          <p class="pd-desc">${this.product.description || 'Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл байхгүй байна.'}</p>

          <!-- Calendar Date Picker -->
          <fieldset class="pd-dates" style="border: none; padding: 0; margin: 0 0 28px;">
            <legend>ТҮРЭЭСИЙН ХУГАЦАА</legend>
            <div class="form-group" style="display: flex; gap: 16px; margin-top: 12px;">
              <div style="flex: 1;">
                <label for="pd-from" style="font-size: 0.75rem; color: var(--muted); display: block; margin-bottom: 6px;">Эхлэх огноо *</label>
                <input type="date" id="pd-from" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface);">
              </div>
              <div style="flex: 1;">
                <label for="pd-to" style="font-size: 0.75rem; color: var(--muted); display: block; margin-bottom: 6px;">Дуусах огноо *</label>
                <input type="date" id="pd-to" style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface);">
              </div>
            </div>
          </fieldset>

          <!-- Size Picker -->
          <fieldset class="sz-opts" id="sz-opts">
            <legend>РАЗМЕР</legend>
            ${sizesHtml}
          </fieldset>

          <!-- Total Price -->
          <div class="pd-total">
            <span class="pd-total-lbl">НИЙТ ДҮН</span>
            <strong class="pd-total-price" id="pd-total-price">—</strong>
          </div>

          <!-- Action Buttons -->
          <button class="btn-primary" id="btn-request" type="button">📩 Хүсэлт илгээх</button>
          <button class="btn-secondary ${wishlistButtonClass}" id="btn-wish" type="button">${wishlistButtonText}</button>

          <!-- Perks -->
          <ul class="pd-perks">
            <li>✓ 24 цагийн дотор хүргэнэ</li>
            <li>✓ Угаалга, цэвэрлэгээ манай хариуцлага</li>
            <li>✓ Хамгаалалтын мөнгө буцаагдана</li>
            <li>✓ Размер таарахгүй бол солиулж болно</li>
          </ul>
        </article>
      </main>

      <!-- Use the extracted reviews-list component -->
      <review-list id="reviews-list"></review-list>

      <aside class="cart-side" id="cartSide" aria-label="Таны сагс">
        <header class="cart-side-hd">
          <h2>Таны сагс</h2>
          <button class="cart-close" onclick="toggleCart()">✕</button>
        </header>
        <section class="cart-items-wrap" id="cartItemsWrap" aria-live="polite"></section>
        <div id="cartFoot"></div>
      </aside>
      
      <div class="cart-overlay" id="cartOverlay" onclick="toggleCart()"></div>
    `;
  }

  async loadData() {
    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      console.error('No product ID provided');
      return;
    }

    try {
      // Load both products and reviews in parallel
      const [productsResponse, reviewsResponse] = await Promise.all([
        fetch('/public/json/product.json'),
        fetch('/public/json/review.json')
      ]);

      const products = await productsResponse.json();
      const allReviews = await reviewsResponse.json();

      // Find the product
      this.product = products.find(p => p.id == productId);

      // Filter reviews for this product
      if (this.product) {
        this.reviews = allReviews.filter(r => r.product_id == this.product.id);
        this.basePrice = parsePrice(this.product.price);
        
        // After rendering, set the reviews in the reviews-list component
        setTimeout(() => {
          const reviewsList = this.querySelector('#reviews-list');
          if (reviewsList && reviewsList.setReviews) {
            reviewsList.setReviews(this.reviews);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  getavgRating() {
    if (!this.reviews.length) return this.product.rating;
    const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }
  
  // ... rest of your existing code ...
}

customElements.define('product-page', ProductPage);