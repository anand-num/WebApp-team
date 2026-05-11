import './product-card.js';

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
      const card = document.createElement('product-card');
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