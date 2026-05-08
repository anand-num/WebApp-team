// product-page.js
import { parsePrice, formatPrice, toggleLiked, isLiked } from './product-card.js';

class ProductPage extends HTMLElement {
  constructor() {
    super();
    this.product = null;
    this.reviews = [];
    this.selectedSize = null;
    this.fromDate = null;
    this.toDate = null;
    this.basePrice = 0;
  }

  async connectedCallback() {
    await this.loadData();
    if (this.product) {
      this.render();
      this.setupListeners();
      this.updateTotal();
    } else {
      this.innerHTML = '<div class="error">Бүтээгдэхүүн олдсонгүй</div>';
    }
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
        // Parse base price from product price string
        this.basePrice = parsePrice(this.product.price);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  // Helper function to get initials from name
  getInitials(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getavgRating() {
    if (!this.reviews.length) return this.product.rating;
    const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  // Helper function to calculate days between two dates
  daysBetween(date1, date2) {
    const from = new Date(date1);
    const to = new Date(date2);
    if (!from || !to || to <= from) return 0;
    return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  }

  // Update total price based on selected dates
  updateTotal() {
    const fromInput = this.querySelector('#pd-from');
    const toInput = this.querySelector('#pd-to');
    const totalPriceEl = this.querySelector('#pd-total-price');

    if (!fromInput || !toInput || !totalPriceEl) return;

    const fromDate = fromInput.value;
    const toDate = toInput.value;

    if (fromDate && toDate) {
      const days = this.daysBetween(fromDate, toDate);
      if (days > 0) {
        const total = this.basePrice * days;
        totalPriceEl.textContent = formatPrice(total);
      } else {
        totalPriceEl.textContent = 'Буруу огноо';
      }
    } else {
      totalPriceEl.textContent = '—';
    }
  }

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

    // Check if product is liked using imported function
    const isProductLiked = isLiked(this.product.id);
    const wishlistButtonText = isProductLiked ? '♥ Дуртайд нэмэгдсэн' : '♡ Дуртайд нэмэх';
    const wishlistButtonClass = isProductLiked ? 'btn-wish--active' : '';

    // Generate reviews HTML with proper review card styling
    const reviewsHtml = this.reviews.length > 0
      ? this.reviews.map(review => {
        const reviewStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const authorName = review.author || review.user_name || 'Хэрэглэгч';
        const initials = this.getInitials(authorName);

        return `
            <article class="review-card">
              <div class="review-hd">
                <div class="reviewer-initial">${initials}</div>
                <div class="reviewer-info">
                  <strong class="reviewer-name">${authorName}</strong>
                  <div class="stars">${reviewStars}</div>
                </div>
                <time class="review-date">${review.date || review.created_at || '2025-01-01'}</time>
              </div>
              <p class="review-text">${review.comment || review.review_text || 'Сэтгэгдэл байхгүй'}</p>
            </article>
          `;
      }).join('')
      : '<p class="no-reviews">Харамсалтай нь энэ бүтээгдэхүүнд сэтгэгдэл байхгүй байна.</p>';

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

      <!-- Reviews Section -->
      <section class="reviews pd-reviews" id="reviews">
        <div class="review-header">
          <p>Сэтгэгдэл</p>
          <h2>Үйлчлүүлэгчдийн үнэлгээ</h2>
        </div>
        <div class="review-container" id="review-container">
          ${reviewsHtml}
        </div>
      </section>

      
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

  setupListeners() {
    // Size selection
    const sizeRadios = this.querySelectorAll('input[name="size"]');
    sizeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.selectedSize = e.target.value;
      });
    });

    // Date inputs - update total when changed
    const fromInput = this.querySelector('#pd-from');
    const toInput = this.querySelector('#pd-to');

    if (fromInput) {
      fromInput.addEventListener('change', () => {
        this.fromDate = fromInput.value;
        this.updateTotal();
      });
    }

    if (toInput) {
      toInput.addEventListener('change', () => {
        this.toDate = toInput.value;
        this.updateTotal();
      });
    }

    // Request button
    const requestBtn = this.querySelector('#btn-request');
    if (requestBtn) {
      requestBtn.addEventListener('click', () => {
        if (!this.selectedSize) {
          alert('Размер сонгоно уу');
          return;
        }

        const fromInput = this.querySelector('#pd-from');
        const toInput = this.querySelector('#pd-to');

        if (!fromInput.value || !toInput.value) {
          alert('Түрээсийн огноо сонгоно уу');
          return;
        }

        const days = this.daysBetween(fromInput.value, toInput.value);
        if (days <= 0) {
          alert('Дуусах огноо эхлэх огнооноос хойш байх ёстой');
          return;
        }

        const requestProduct = {
          id: this.product.id,
          brand: this.product.brand,
          item_name: this.product.item_name,
          price: this.product.price,
          img_src: this.product.img_src,
          sizes: this.product.sizes,
          selectedSize: this.selectedSize,
          fromDate: fromInput.value,
          toDate: toInput.value,
          rentalDays: days,
          totalPrice: formatPrice(this.basePrice * days),
          rating: this.product.rating,
          review_count: this.reviews.length
        };

        if (typeof window.openRequestModal === 'function') {
          window.openRequestModal(requestProduct);
        } else {
          alert(`Хүсэлт илгээгдлээ!\n\nБараа: ${this.product.item_name}\nРазмер: ${this.selectedSize}\nОгноо: ${fromInput.value} - ${toInput.value}\nХоног: ${days}\nНийт: ${formatPrice(this.basePrice * days)}`);
        }
      });
    }

    // Wishlist button - using imported toggleLiked function
    const wishBtn = this.querySelector('#btn-wish');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        const nowLiked = toggleLiked(this.product.id);
        this.updateWishlistButton(nowLiked);
      });
    }
  }

  updateWishlistButton(nowLiked) {
    const wishBtn = this.querySelector('#btn-wish');
    if (!wishBtn) return;

    if (nowLiked) {
      wishBtn.textContent = '♥ Дуртайд нэмэгдсэн';
      wishBtn.classList.add('btn-wish--active');
    } else {
      wishBtn.textContent = '♡ Дуртайд нэмэх';
      wishBtn.classList.remove('btn-wish--active');
    }
  }
}

// Register the component
customElements.define('product-page', ProductPage);