// product-page.js
import { parsePrice, formatPrice, toggleLiked, isLiked } from './product-card.js';
import './review-list.js';
import './review-card.js';

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
      this.populateReviews();
      this.updateTotal();
    } else {
      this.innerHTML = '<div class="error">Бүтээгдэхүүн олдсонгүй</div>';
    }
  }

  async loadData() {
    // URL-с product ID авах
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      console.error('No product ID provided');
      return;
    }

    try {
      // API-с product болон review хамт авах
      const [productsResponse, reviewsResponse] = await Promise.all([
        fetch(`http://localhost:3000/api/products`),
        fetch(`http://localhost:3000/api/reviews`)
      ]);

      const products = await productsResponse.json();
      const allReviews = await reviewsResponse.json();

      // ID-гаар product олох
      this.product = products.find(p => p.id == productId);

      // Тухайн product-ийн review-үүдийг шүүх
      if (this.product) {
        this.reviews = allReviews.filter(r => r.product_id == this.product.id);
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

    const isOutOfStock = this.product.in_stock <= 0 || this.product.stock <= 0;
    const stockStatus = !isOutOfStock ? 'Бэлэн' : 'Дууссан';
    const stockColor = !isOutOfStock ? '#27ae60' : '#d32f2f';

    const sizesHtml = this.product.sizes?.map(size => `
      <label class="sz-opt">
        <input type="radio" name="size" value="${size}">
        <span>${size}</span>
      </label>
    `).join('') || '<p>Размер байхгүй</p>';

    // Check if product is liked using imported function
    const isProductLiked = isLiked(String(this.product.id));
    const wishlistButtonText = isProductLiked ? '♥ Дуртайд нэмэгдсэн' : '♡ Дуртайд нэмэх';
    const wishlistButtonClass = isProductLiked ? 'btn-wish--active' : '';

    // Build reviews section with web component
    // No more inline review card HTML!
    const reviewsSection = this.reviews.length > 0 ? `
      <section class="pd-reviews" id="reviews">
        <div class="review-header">
          <p>Сэтгэгдэл</p>
          <h2>Үйлчлүүлэгчдийн үнэлгээ</h2>
        </div>
        <review-list id="review-list"></review-list>
      </section>
    ` : `
      <section class="pd-reviews" id="reviews">
        <div class="review-header">
          <p>Сэтгэгдэл</p>
          <h2>Үйлчлүүлэгчдийн үнэлгээ</h2>
        </div>
        <p class="no-reviews">Харамсалтай нь энэ бүтээгдэхүүнд сэтгэгдэл байхгүй байна.</p>
      </section>
    `;

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

          <!-- Total Price -->
          <div class="pd-total">
            <span class="pd-total-lbl">1 ӨДРИЙН ҮНЭ</span>
            <strong class="pd-total-price" id="pd-total-price">${this.product.price}</strong>
          </div>

          <!-- Action Buttons - Add disabled and change text -->
              <button class="btn-primary" id="btn-request" type="button" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? '❌ Дуссан байна' : '📩 Сагслах'}
              </button>
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

      <!-- Reviews Section with Web Component -->
      ${reviewsSection}


    `;
  }

  /**
   * Populate the reviews list component with review data
   * This method is called after render() to populate the <reviews-list> element
   */
  populateReviews() {
    const reviewsList = this.querySelector('#review-list');
    if (!reviewsList) return;

    customElements.whenDefined('reviews-list').then(() => {
      if (this.reviews.length > 0) {
        reviewsList.setReviews(this.reviews);
      }
    });
  }

  setupListeners() {
    const isOutOfStock = this.product.in_stock <= 0 || this.product.stock <= 0;
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
          if (isOutOfStock) {
      requestBtn.disabled = true;
      requestBtn.title = 'Энэ бүтээгдэхүүн бэлэн биш байна';
    }

      requestBtn.addEventListener('click', () => {
              if (isOutOfStock) {
        alert('Уучлаарай, энэ бүтээгдэхүүн бэлэн биш байна.');
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
          rating: this.product.rating,
          review_count: this.reviews.length
        };

        if (typeof window.openRequestModal === 'function') {
          window.openRequestModal(requestProduct);
        } else {
          const fromInput = this.querySelector('#pd-from');
          const toInput = this.querySelector('#pd-to');
          const days = this.daysBetween(
            fromInput?.value || '',
            toInput?.value || ''
          );
          alert(`Хүсэлт илгээгдлээ!\n\nБараа: ${this.product.item_name}\nРазмер: ${this.selectedSize}\nОгноо: ${fromInput?.value || ''} - ${toInput?.value || ''}\nХоног: ${days}\nНийт: ${formatPrice(this.basePrice * days)}`);
        }
      });
    }

    // Wishlist button
    const wishBtn = this.querySelector('#btn-wish');
    if (wishBtn) {
      // Set initial state - already done in render() but this ensures consistency
      if (isLiked(String(this.product.id))) {
        wishBtn.classList.add('btn-wish--active');
      }

      wishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const nowLiked = toggleLiked(String(this.product.id));
        this.updateWishlistButton(nowLiked);

        // Dispatch event to notify other pages (like product cards on browse page)
        window.dispatchEvent(new CustomEvent('likedUpdated', {
          detail: { productId: this.product.id, liked: nowLiked }
        }));
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