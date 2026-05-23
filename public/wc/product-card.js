// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────

export function parsePrice(str) {
    return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

export function formatPrice(num) {
    return Number(num).toLocaleString() + '₮';
}

// ── Get current user from localStorage ──
function getCurrentUser() {
    try {
        const userJson = localStorage.getItem('rf_user');
        if (!userJson) return null;
        const userData = JSON.parse(userJson);
        return userData.user_id || userData.id || userData._id;
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
}

// ── Toggle like in MongoDB (EXPORTED for product-page.js) ──
export async function toggleLiked(productId) {
    const userId = getCurrentUser();
    if (!userId) {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('open');
        return false;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}/liked/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: String(productId) })
        });
        
        if (!response.ok) return false;
        const result = await response.json();
        return result.liked;
    } catch (error) {
        console.error('Error toggling like:', error);
        return false;
    }
}

// ── Check if product is liked from MongoDB (EXPORTED for product-page.js) ──
export async function isLiked(productId) {
    const userId = getCurrentUser();
    if (!userId) return false;

    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}/liked`);
        if (!response.ok) return false;
        const data = await response.json();
        return (data.liked_items || []).includes(String(productId));
    } catch (error) {
        console.error('Error checking liked:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────
// BROWSE PRODUCT CARD COMPONENT
// ─────────────────────────────────────────────────────────

export class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.likedStatus = false;
    }

    async connectedCallback() {
        await this.render();
        await this.setupListeners();
    }

    get productId() { return this.getAttribute('id'); }
    get brand() { return this.getAttribute('brand') || ''; }
    get name() { return this.getAttribute('name') || ''; }
    get price() { return this.getAttribute('price') || '0₮'; }
    get image() { return this.getAttribute('image') || ''; }
    get rating() { return parseFloat(this.getAttribute('rating')) || 0; }
    get reviewCount() { return parseInt(this.getAttribute('review-count')) || 0; }
    get status() { return this.getAttribute('status') || ''; }
    get sizes() {
        try { return JSON.parse(this.getAttribute('sizes') || '[]'); }
        catch { return []; }
    }
    get stock() {
        const val = this.getAttribute('stock');
        if (val === null || val === '') return 1;
        return parseInt(val) || 0;
    }

    async render() {
        const stars = '★'.repeat(Math.round(this.rating)) + '☆'.repeat(5 - Math.round(this.rating));
        this.likedStatus = await isLiked(this.productId);

        this.innerHTML = `
      <article class="product-card">
        <div class="card-visual">
          <img class="card-img" src="${this.image}" alt="${this.name}" loading="lazy" />
          ${this.status ? `<span class="badge badge--new">${this.status}</span>` : ''}
          <button class="card-heart ${this.likedStatus ? 'liked' : ''}" aria-label="Add to liked">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button class="card-request-btn ${this.stock <= 0 ? 'disabled' : ''}" ${this.stock <= 0 ? 'disabled' : ''}>
            ${this.stock <= 0 ? '❌ Дууссан байна' : '📩 Хүсэлт илгээх'}
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

    async setupListeners() {
        const heartBtn = this.querySelector('.card-heart');
        if (heartBtn) {
            heartBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const nowLiked = await toggleLiked(this.productId);
                heartBtn.classList.toggle('liked', nowLiked);
                this.likedStatus = nowLiked;

                window.dispatchEvent(new CustomEvent('likedUpdated', {
                    detail: { productId: this.productId, liked: nowLiked }
                }));
            });
        }

        const card = this.querySelector('.product-card');
        if (card) {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const link = this.querySelector('.card-link');
                if (link) window.location.href = link.href;
            });
        }

        const requestBtn = this.querySelector('.card-request-btn');
        if (requestBtn) {
            requestBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.stock <= 0) {
                    alert('Уучлаарай, энэ бүтээгдэхүүн бэлэн биш байна.');
                    return;
                }
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
                if (typeof window.openRequestModal === 'function') {
                    window.openRequestModal(product);
                }
            });
        }
    }
}

customElements.define('product-card', ProductCard);