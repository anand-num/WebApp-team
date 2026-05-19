import './product-card.js';
import '../js/filter.js';

// ─────────────────────────────────────────────────────────
// FILTER MANAGER - Central filter state management
// ─────────────────────────────────────────────────────────

class FilterManager {
  constructor() {
    this.grid = null;
    this.initialized = false;
  }

  init(gridElement) {
    this.grid = gridElement;
    this.initialized = true;
    
    // Read URL params and apply filters after products are loaded
    setTimeout(() => {
      this.readFiltersFromUrl();
    }, 100);
    
    // Listen for browser back/forward
    window.addEventListener('popstate', () => {
      this.readFiltersFromUrl();
    });
  }

  updateUrlParameter(key, value) {
    const url = new URL(window.location.href);
    
    if (value === null || value === undefined || value === '' || value === 'All') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    
    window.history.pushState({}, '', url);
  }

  readFiltersFromUrl() {
    if (!this.grid || !this.grid.products || this.grid.products.length === 0) {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // Apply category filter
    const category = urlParams.get('cat');
    if (category && category !== 'All') {
      this.grid.filterByCategory(category);
      this.syncSidebarRadio('cat', category);
      this.syncNavigationActive(category);
    } else {
      this.grid.filterByCategory('All');
      this.syncSidebarRadio('cat', 'All');
      this.syncNavigationActive(null);
    }
    
    // Apply size filter
    const size = urlParams.get('size');
    if (size && size !== 'All') {
      this.grid.filterBySize(size);
      this.syncSidebarRadio('size', size);
    } else {
      this.grid.filterBySize('All');
      this.syncSidebarRadio('size', 'All');
    }
    
    // Apply price filter
    const price = urlParams.get('price');
    if (price) {
      this.grid.filterByPrice(parseInt(price, 10));
      this.syncPriceSlider(price);
    }
    
    // Apply search
    const search = urlParams.get('search');
    if (search) {
      this.grid.search(search);
      this.syncSearchInput(search);
    }
    
    // Apply sort
    const sort = urlParams.get('sort');
    if (sort) {
      this.grid.sort(sort);
      this.syncSortSelect(sort);
    }
    
    this.updateProductCount();
  }

  setCategory(category) {
    this.updateUrlParameter('cat', category === 'All' ? null : category);
    if (this.grid) {
      this.grid.filterByCategory(category);
      this.syncSidebarRadio('cat', category);
      this.syncNavigationActive(category);
      this.updateProductCount();
    }
  }

  setSize(size) {
    this.updateUrlParameter('size', size === 'All' ? null : size);
    if (this.grid) {
      this.grid.filterBySize(size);
      this.syncSidebarRadio('size', size);
      this.updateProductCount();
    }
  }

  setPrice(price) {
    this.updateUrlParameter('price', price);
    if (this.grid) {
      this.grid.filterByPrice(price);
      this.updateProductCount();
    }
  }

  setSearch(search) {
    this.updateUrlParameter('search', search || null);
    if (this.grid) {
      this.grid.search(search);
      this.updateProductCount();
    }
  }

  setSort(sort) {
    this.updateUrlParameter('sort', sort);
    if (this.grid) {
      this.grid.sort(sort);
    }
  }

  resetAllFilters() {
    const url = new URL(window.location.href);
    url.searchParams.delete('cat');
    url.searchParams.delete('size');
    url.searchParams.delete('price');
    url.searchParams.delete('search');
    url.searchParams.delete('sort');
    window.history.pushState({}, '', url);
    
    if (this.grid) {
      this.grid.filteredProducts = this.grid.products;
      this.grid.render();
      
      // Reset UI elements
      this.syncSidebarRadio('cat', 'All');
      this.syncSidebarRadio('size', 'All');
      this.syncPriceSlider(500000);
      this.syncSearchInput('');
      this.syncSortSelect('new');
      this.syncNavigationActive(null);
      this.updateProductCount();
    }
  }

  syncSidebarRadio(name, value) {
    const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) radio.checked = true;
  }

  syncPriceSlider(price) {
    const priceRange = document.querySelector('.price-range');
    if (priceRange) priceRange.value = price;
    
    const priceValue = document.querySelector('.price-value');
    if (priceValue) priceValue.textContent = `${parseInt(price).toLocaleString()}₮`;
  }

  syncSearchInput(search) {
    const searchInput = document.getElementById('srchInp');
    if (searchInput) searchInput.value = search;
  }

  syncSortSelect(sort) {
    const sortSelect = document.getElementById('sortSel');
    if (sortSelect) sortSelect.value = sort;
  }

  syncNavigationActive(category) {
    const nav = document.querySelector('app-navigation');
    if (nav && typeof nav.highlightActiveCategory === 'function') {
      nav.highlightActiveCategory(category);
    }
  }

  updateProductCount() {
    const countEl = document.getElementById('catInfo');
    if (countEl && this.grid) {
      countEl.textContent = `${this.grid.getCount()} бараа олдлоо`;
    }
  }
}

// Create global filter manager instance
window.filterManager = new FilterManager();

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
      
      // Initialize filter manager after products are loaded
      window.filterManager.init(this);
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
      this.filteredProducts = [...this.products];
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
      this.filteredProducts = [...this.products];
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
      this.filteredProducts = [...this.products];
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
// HELPER: Parse price from string or number
// ─────────────────────────────────────────────────────────

function parsePrice(price) {
  if (typeof price === 'number') return price;
  return parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0;
}

// ─────────────────────────────────────────────────────────
// HELPER: Wire up filters to grid
// ─────────────────────────────────────────────────────────

/**
 * Connect filter controls to browse grid
 * This is kept for backward compatibility but now uses filterManager
 */
function wireBrowseFilters(gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  // Category filter - use filterManager
  document.querySelectorAll('input[name="cat"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      window.filterManager.setCategory(e.target.value);
    });
  });

  // Size filter - use filterManager
  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      window.filterManager.setSize(e.target.value);
    });
  });

  // Price filter - use filterManager
  const priceRange = document.querySelector('.price-range');
  if (priceRange) {
    priceRange.addEventListener('input', (e) => {
      window.filterManager.setPrice(parseInt(e.target.value, 10));
    });
  }

  // Search filter - use filterManager with debounce
  const searchInput = document.getElementById('srchInp');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.filterManager.setSearch(e.target.value.trim());
      }, 300);
    });
  }

  // Sort filter - use filterManager
  const sortSelect = document.getElementById('sortSel');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      window.filterManager.setSort(e.target.value);
    });
  }

  // Reset filters - use filterManager
  const resetBtn = document.querySelector('.flt-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.filterManager.resetAllFilters();
    });
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