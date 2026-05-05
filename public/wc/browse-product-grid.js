/* ════════════════════════════════════════════════════════════
   RENTFIT — browse-components.js
   Simple product card components for browse/catalog pages
   
   Uses existing HTML template structure from browse.html
   No Shadow DOM, no complexity, just straightforward JS
════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Parse price string to number
 * "150,000₮" → 150000
 */
function parsePrice(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Format number to currency
 * 150000 → "150,000₮"
 */
function formatPrice(num) {
  return Number(num).toLocaleString() + '₮';
}

/**
 * Toggle product in liked list
 */
function toggleLiked(productId) {
  const LIKED_KEY = 'rf_liked';
  let likedIds = [];
  
  try {
    likedIds = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
  } catch (e) {
    likedIds = [];
  }

  const index = likedIds.indexOf(productId);
  if (index === -1) {
    likedIds.push(productId);
  } else {
    likedIds.splice(index, 1);
  }

  localStorage.setItem(LIKED_KEY, JSON.stringify(likedIds));
  return index === -1; // Returns true if was added
}

/**
 * Check if product is in liked list
 */
function isLiked(productId) {
  const LIKED_KEY = 'rf_liked';
  try {
    const likedIds = JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    return likedIds.indexOf(productId) !== -1;
  } catch (e) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────
// BROWSE PRODUCT CARD COMPONENT
// ─────────────────────────────────────────────────────────

/**
 * Simple product card for browse page
 * 
 * Usage:
 * <browse-product-card
 *   id="1"
 *   brand="Valentino"
 *   name="Evening Gown"
 *   price="150,000₮"
 *   rating="4.5"
 *   review-count="12"
 *   image="/public/source/dress.jpg"
 *   status="NEW"
 *   sizes='["S", "M", "L"]'
 * ></browse-product-card>
 */
class BrowseProductCard extends HTMLElement {
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
          
          <button class="card-heart" aria-label="Add to liked">❤</button>
          
          <button class="card-request-btn">📩 Хүсэлт илгээх</button>
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

      heartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const nowLiked = toggleLiked(this.productId);
        heartBtn.classList.toggle('liked', nowLiked);
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

        // Build product object for modal
        const product = {
          id: this.productId,
          brand: this.brand,
          item_name: this.name,
          price: this.price,
          img_src: this.image.replace('/public/source/', ''),
          sizes: this.sizes,
          rating: this.rating,
          review_count: this.reviewCount
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
customElements.define('browse-product-card', BrowseProductCard);

// ─────────────────────────────────────────────────────────
// BROWSE PRODUCT GRID COMPONENT
// ─────────────────────────────────────────────────────────

/**
 * Grid container that loads products from JSON and creates cards
 * 
 * Usage:
 * <browse-product-grid
 *   json-url="/public/json/product.json"
 * ></browse-product-grid>
 */
class BrowseProductGrid extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.filteredProducts = [];
  }

  connectedCallback() {
    const jsonUrl = this.getAttribute('json-url') || '/public/json/product.json';
    this.loadProducts(jsonUrl);
  }

  /**
   * Load products from JSON file
   */
  async loadProducts(jsonUrl) {
    try {
      const response = await fetch(jsonUrl);
      this.products = await response.json();
      this.filteredProducts = this.products;
      this.render();
    } catch (error) {
      console.error('Failed to load products:', error);
      this.innerHTML = '<p style="color: red;">Failed to load products</p>';
    }
  }

  /**
   * Render product cards in grid
   */
  render() {
    // Clear container
    this.innerHTML = '';

    // Create grid
    const grid = document.createElement('div');
    grid.className = 'pg'; // Use existing CSS class

    // Create card for each product
    this.filteredProducts.forEach((product) => {
      const card = document.createElement('browse-product-card');
      card.setAttribute('id', product.id);
      card.setAttribute('brand', product.brand);
      card.setAttribute('name', product.item_name);
      card.setAttribute('price', product.price);
      card.setAttribute('rating', product.rating);
      card.setAttribute('review-count', product.review_count);
      card.setAttribute('image', `/public/source/${product.img_src}`);
      card.setAttribute('status', product.status || '');
      
      if (product.sizes) {
        card.setAttribute('sizes', JSON.stringify(product.sizes));
      }

      grid.appendChild(card);
    });

    this.appendChild(grid);
  }

  /**
   * Filter products by category
   */
  filterByCategory(category) {
    if (category === 'All' || !category) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => p.category === category);
    }
    this.render();
  }

  /**
   * Filter products by size
   */
  filterBySize(size) {
    if (size === 'All' || !size) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p => 
        Array.isArray(p.sizes) && p.sizes.includes(size)
      );
    }
    this.render();
  }

  /**
   * Filter products by price
   */
  filterByPrice(maxPrice) {
    this.filteredProducts = this.products.filter(p => 
      parsePrice(p.price) <= maxPrice
    );
    this.render();
  }

  /**
   * Search products
   */
  search(query) {
    if (!query) {
      this.filteredProducts = this.products;
    } else {
      const q = query.toLowerCase();
      this.filteredProducts = this.products.filter(p => 
        p.item_name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    this.render();
  }

  /**
   * Sort products
   */
  sort(sortType) {
    if (sortType === 'price-asc') {
      this.filteredProducts.sort((a, b) => 
        parsePrice(a.price) - parsePrice(b.price)
      );
    } else if (sortType === 'price-desc') {
      this.filteredProducts.sort((a, b) => 
        parsePrice(b.price) - parsePrice(a.price)
      );
    } else if (sortType === 'rating') {
      this.filteredProducts.sort((a, b) => b.rating - a.rating);
    } else {
      // 'new' - keep original order
      this.filteredProducts = [...this.products];
    }
    this.render();
  }

  /**
   * Get filtered product count
   */
  getCount() {
    return this.filteredProducts.length;
  }
}

// Register component
customElements.define('browse-product-grid', BrowseProductGrid);

// ─────────────────────────────────────────────────────────
// HELPER: Wire up filters to grid
// ─────────────────────────────────────────────────────────

/**
 * Connect filter controls to browse grid
 * 
 * Usage:
 * wireBrowseFilters('browse-product-grid')
 */
function wireBrowseFilters(gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  // Category filter
  document.querySelectorAll('input[name="cat"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      grid.filterByCategory(e.target.value);
      updateProductCount(grid.getCount());
    });
  });

  // Size filter
  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      grid.filterBySize(e.target.value);
      updateProductCount(grid.getCount());
    });
  });

  // Price filter
  const priceRange = document.querySelector('.price-range');
  if (priceRange) {
    priceRange.addEventListener('input', (e) => {
      grid.filterByPrice(parseInt(e.target.value, 10));
      updateProductCount(grid.getCount());
    });
  }

  // Search
  const searchInput = document.getElementById('srchInp');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      grid.search(e.target.value.trim());
      updateProductCount(grid.getCount());
    });
  }

  // Sort
  const sortSelect = document.getElementById('sortSel');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      grid.sort(e.target.value);
    });
  }

  // Reset filters
  const resetBtn = document.querySelector('.flt-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      grid.filteredProducts = grid.products;
      grid.render();
      updateProductCount(grid.getCount());
      
      // Reset all inputs
      document.querySelector('input[name="cat"][value="All"]').checked = true;
      document.querySelector('input[name="size"][value="All"]').checked = true;
      document.getElementById('srchInp').value = '';
      document.getElementById('sortSel').value = 'new';
      priceRange.value = 500000;
    });
  }
}

/**
 * Update product count display
 */
function updateProductCount(count) {
  const countEl = document.getElementById('catInfo');
  if (countEl) {
    countEl.textContent = `${count} бараа олдлоо`;
  }
}

// ─────────────────────────────────────────────────────────
// INITIALIZE ON PAGE LOAD
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log('Browse components loaded');
  
  // Wire up filters if grid exists
  const grid = document.querySelector('browse-product-grid');
  if (grid) {
    wireBrowseFilters('browse-product-grid');
  }
});