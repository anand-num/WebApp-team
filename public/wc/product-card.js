
// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Parse price string to number
 * "150,000₮" → 150000
 */
export function parsePrice(str) {
    return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Format number to currency
 * 150000 → "150,000₮"
 */
export function formatPrice(num) {
    return Number(num).toLocaleString() + '₮';
}

/**
 * Toggle product in liked list
 */
export function toggleLiked(productId) {
    const LIKED_KEY = 'rf_liked';
    let likedIds = [];

    try {
        likedIds = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    } catch (e) {
        likedIds = [];
    }
    const idStr = String(productId);
    const index = likedIds.indexOf(productId);
    if (index === -1) {
        likedIds.push(idStr);
    } else {
        likedIds.splice(index, 1);
    }

    localStorage.setItem(LIKED_KEY, JSON.stringify(likedIds));
    return index === -1; // Returns true if was added
}

/**
 * Check if product is in liked list
 */
export function isLiked(productId) {
    const LIKED_KEY = 'rf_liked';
    try {
        const likedIds = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
        return likedIds.indexOf(String(productId)) !== -1;
    } catch (e) {
        return false;
    }
}

// ─────────────────────────────────────────────────────────
// BROWSE PRODUCT CARD COMPONENT
// ─────────────────────────────────────────────────────────

export class ProductCard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }

    // ── Get attributes ──
    get productId() {
        return this.getAttribute('id');
    }

    get brand() {
        return this.getAttribute('brand') || '';
    }

    get name() {
        return this.getAttribute('name') || '';
    }

    get price() {
        return this.getAttribute('price') || '0₮';
    }

    get image() {
        return this.getAttribute('image') || '';
    }

    get rating() {
        return parseFloat(this.getAttribute('rating')) || 0;
    }

    get reviewCount() {
        return parseInt(this.getAttribute('review-count')) || 0;
    }

    get status() {
        return this.getAttribute('status') || '';
    }

    get sizes() {
        try {
            return JSON.parse(this.getAttribute('sizes') || '[]');
        } catch (e) {
            return [];
        }
    }
get stock() {
    const stockValue = this.getAttribute('stock');
    if (stockValue === null || stockValue === undefined || stockValue === '') {
        return 1; // Default to in stock
    }
    return parseInt(stockValue) || 0;
}

    // ── Render card ──
    render() {
        const stars = '★'.repeat(Math.round(this.rating)) +
            '☆'.repeat(5 - Math.round(this.rating));

        this.innerHTML = `
        
      <article class="product-card">
        <div class="card-visual">
          <img 
            class="card-img" 
            src="${this.image}" 
            alt="${this.name}"
            loading="lazy"
          />
          
          ${this.status ? `<span class="badge badge--new">${this.status}</span>` : ''}
          
          <button class="card-heart" aria-label="Add to liked">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

        <button class="card-request-btn ${this.stock <= 0 ? 'disabled' : ''}" ${this.stock <= 0 ? 'disabled' : ''}>
            ${this.stock <= 0 ? '❌ Бэлэн бус' : '📩 Хүсэлт илгээх'}
        </button>
        </div>

        <div class="card-body">
          <p class="card-brand">${this.brand}</p>
          <h3 class="card-name">${this.name}</h3>

          <div class="rating">
            <span class="rating-stars">${stars}</span>
            <span class="rating-count">${this.rating} (${this.reviewCount})</span>
          </div>

          <div class="card-footer">
            <div>
              <p class="price-lbl">Өдөрт</p>
              <strong class="card-price">${this.price}</strong>
            </div>
            <a class="card-link" href="/public/html/product.html?id=${this.productId}">Харах →</a>
          </div>
        </div>
      </article>
    `;
    }

    // ── Setup event listeners ──
    setupListeners() {
        // Heart button - toggle liked
        const heartBtn = this.querySelector('.card-heart');
        if (heartBtn) {
            // Set initial state
            if (isLiked(this.productId)) {
                heartBtn.classList.add('liked');
            }

            // In product-card.js - inside the heart button click handler
            heartBtn.addEventListener('click', (e) => {
                e.preventDefault();// Browseriinh default behavior iig zogsoono. Jishee n a tag deer click hiisen bol link ruu yavahgui bolgono.
                e.stopPropagation();// ooriinhoo ymr negen eventiig gadnah buyu parent ru damjuulahgui bailgana.

                const nowLiked = toggleLiked(this.productId);
                heartBtn.classList.toggle('liked', nowLiked);

                // Dispatch event to notify other pages
                window.dispatchEvent(new CustomEvent('likedUpdated', {
                    detail: { productId: this.productId, liked: nowLiked }
                }));
            });
        }

        // Card click - navigate to product page
        const card = this.querySelector('.product-card');
        if (card) {
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking buttons
                if (e.target.closest('button')) {
                    return;
                }
                const link = this.querySelector('.card-link');
                if (link) {
                    window.location.href = link.href;
                }
            });
        }

        // Request button - open modal
        const requestBtn = this.querySelector('.card-request-btn');
        if (requestBtn) {
            requestBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.stock <= 0) {
                    alert('Уучлаарай, энэ бүтээгдэхүүн бэлэн биш байна.');
                    return;
                }
                // Build product object for modal
                const product = {
                    id: this.productId,
                    brand: this.brand,
                    item_name: this.name,
                    price: this.price,
                    img_src: this.image.replace('/public/source/', ''),
                    sizes: this.sizes,
                    rating: this.rating,
                    review_count: this.reviewCount,
                    stock: this.stock
                };

                // Open request modal if function exists
                if (typeof window.openRequestModal === 'function') {
                    window.openRequestModal(product);
                }
            });
        }
    }
}

// Register component
customElements.define('product-card', ProductCard);