// wc/featured-products.js
class FeaturedProducts extends HTMLElement {
  constructor() {
    super();
    this.products = [];
  }

  async connectedCallback() {
    await this.loadProducts();
    this.render();
    this.attachEventListeners();
  }

  async loadProducts() {
    try {
      const response = await fetch('/public/json/product.json');
      const allProducts = await response.json();
      
      // Get top 4 rated products
      this.products = allProducts
        .filter(p => p.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  getLikedIds() {
    try {
      return JSON.parse(localStorage.getItem('rf_liked')) || [];
    } catch {
      return [];
    }
  }

  toggleLiked(id) {
    const ids = this.getLikedIds();
    const idx = ids.indexOf(id);
    if (idx === -1) {
      ids.push(id);
    } else {
      ids.splice(idx, 1);
    }
    localStorage.setItem('rf_liked', JSON.stringify(ids));
    return idx === -1;
  }

  render() {
    const likedIds = this.getLikedIds();
    
    this.innerHTML = `
      <header class="featured-header">
        <p class="section-tag" aria-hidden="true">Онцлох</p>
        <h2 class="section-title" id="section-title">Түгээмэл хувцаснууд</h2>
      </header>
      <div class="product-grid" id="featured-grid">
        ${this.products.map(p => `
          <article class="product-card" data-id="${p.id}">
            <div class="card-visual">
              <img src="/public/source/${p.img_src}" alt="${p.item_name}">
              <span class="badge badge--new">${p.status}</span>
              <button class="card-heart ${likedIds.includes(p.id) ? 'liked' : ''}" data-id="${p.id}">❤️</button>
              <button class="card-request-btn" data-id="${p.id}">📩 Хүсэлт илгээх</button>
            </div>
            <div class="card-body">
              <p class="card-brand">${p.brand.toUpperCase()}</p>
              <h3 class="card-name">${p.item_name}</h3>
              <div class="rating">
                <span class="rating-stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span>
                <span class="rating-count">${p.rating} (${p.review_count})</span>
              </div>
              <div class="card-footer">
                <div>
                  <p class="price-lbl">Өдөрт</p>
                  <strong class="card-price">${p.price}</strong>
                </div>
                <a class="card-link" href="/public/html/product.html?id=${p.id}">Харах →</a>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="featured-cta">
        <a href="/public/html/browse.html" class="btn-secondary">
          Бүх каталог →
        </a>
      </div>
    `;
  }

  attachEventListeners() {
    // Heart button listeners
    this.querySelectorAll('.card-heart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const nowLiked = this.toggleLiked(id);
        if (nowLiked) {
          btn.classList.add('liked');
        } else {
          btn.classList.remove('liked');
        }
      });
    });

    // Request button listeners
    this.querySelectorAll('.card-request-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const product = this.products.find(p => p.id === id);
        if (product && typeof window.openRequestModal === 'function') {
          window.openRequestModal(product);
        }
      });
    });

    // Product card click listeners
    this.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        const id = card.dataset.id;
        location.href = `/public/html/product.html?id=${id}`;
      });
    });
  }
}

customElements.define('featured-products', FeaturedProducts);
export default FeaturedProducts;