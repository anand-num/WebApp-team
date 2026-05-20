import './product-card.js';

// ─────────────────────────────────────────────────────────
// BROWSE PRODUCT GRID COMPONENT
// ─────────────────────────────────────────────────────────

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

  async loadProducts(jsonUrl) {
    try {
      const response = await fetch(jsonUrl);
      this.products = await response.json();
      this.filteredProducts = [...this.products];
      this.render();
      
      // ✅ READ CATEGORY FROM URL AFTER PRODUCTS LOAD
      this.applyFiltersFromUrl();
      
    } catch (error) {
      console.error('Failed to load products:', error);
      this.innerHTML = '<p style="color: red;">Failed to load products</p>';
    }
  }

  // ✅ NEW METHOD: Read filters from URL
  applyFiltersFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');
    
    console.log('Applying filter from URL. Category:', category);
    
    if (category && category !== 'All') {
      this.filterByCategory(category);
      
      // Also update the sidebar radio button to match
      setTimeout(() => {
        const radio = document.querySelector(`input[name="cat"][value="${category}"]`);
        if (radio) {
          radio.checked = true;
          console.log('Updated sidebar radio for:', category);
        }
      }, 100);
    } else {
      console.log('No category filter in URL, showing all products');
    }
  }

  render() {
    this.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'pg';

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

  filterByCategory(category) {
    console.log('Filtering by category:', category);
    
    if (category === 'All' || !category) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p => {
        console.log('Product category:', p.category, 'Looking for:', category);
        return p.category === category;
      });
    }
    
    console.log('Filtered products count:', this.filteredProducts.length);
    this.render();
    this.updateProductCount();
  }

  filterBySize(size) {
    if (size === 'All' || !size) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p => 
        Array.isArray(p.sizes) && p.sizes.includes(size)
      );
    }
    this.render();
    this.updateProductCount();
  }

  filterByPrice(maxPrice) {
    this.filteredProducts = this.products.filter(p => 
      this.parsePrice(p.price) <= maxPrice
    );
    this.render();
    this.updateProductCount();
  }

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
    this.updateProductCount();
  }

  sort(sortType) {
    if (sortType === 'price-asc') {
      this.filteredProducts.sort((a, b) => 
        this.parsePrice(a.price) - this.parsePrice(b.price)
      );
    } else if (sortType === 'price-desc') {
      this.filteredProducts.sort((a, b) => 
        this.parsePrice(b.price) - this.parsePrice(a.price)
      );
    } else if (sortType === 'rating') {
      this.filteredProducts.sort((a, b) => b.rating - a.rating);
    } else {
      this.filteredProducts = [...this.products];
    }
    this.render();
  }

  getCount() {
    return this.filteredProducts.length;
  }

  updateProductCount() {
    const countEl = document.getElementById('catInfo');
    if (countEl) {
      countEl.textContent = `${this.getCount()} бараа олдлоо`;
    }
  }

  parsePrice(price) {
    if (typeof price === 'number') return price;
    return parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0;
  }
}

customElements.define('browse-product-grid', BrowseProductGrid);

// ─────────────────────────────────────────────────────────
// WIRE UP SIDEBAR FILTERS
// ─────────────────────────────────────────────────────────

function wireBrowseFilters(gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  // Category filter
  document.querySelectorAll('input[name="cat"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const category = e.target.value;
      grid.filterByCategory(category);
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      if (category && category !== 'All') {
        url.searchParams.set('cat', category);
      } else {
        url.searchParams.delete('cat');
      }
      window.history.pushState({}, '', url);
    });
  });

  // Size filter
  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      grid.filterBySize(e.target.value);
    });
  });

  // Price filter
  const priceRange = document.querySelector('.price-range');
  if (priceRange) {
    priceRange.addEventListener('input', (e) => {
      grid.filterByPrice(parseInt(e.target.value, 10));
    });
  }

  // Search
  const searchInput = document.getElementById('srchInp');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      grid.search(e.target.value.trim());
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
      grid.filteredProducts = [...grid.products];
      grid.render();
      grid.updateProductCount();
      
      // Reset all inputs
      const allRadio = document.querySelector('input[name="cat"][value="All"]');
      if (allRadio) allRadio.checked = true;
      
      const allSizeRadio = document.querySelector('input[name="size"][value="All"]');
      if (allSizeRadio) allSizeRadio.checked = true;
      
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'new';
      if (priceRange) priceRange.value = 500000;
      
      // Clear URL
      const url = new URL(window.location.href);
      url.searchParams.delete('cat');
      window.history.pushState({}, '', url);
    });
  }
}

// ─────────────────────────────────────────────────────────
// INITIALIZE
// ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log('Browse components loaded');
  
  const grid = document.querySelector('browse-product-grid');
  if (grid) {
    wireBrowseFilters('browse-product-grid');
  }
});

document.querySelectorAll(".flt-ttl").forEach((targetFilter) => {
targetFilter.addEventListener("toggle",()=>{
    if(targetFilter.open){
      document.querySelectorAll("ttl").forEach((filter)=>{
        if(filter!==targetFilter) filter.removeAttribute("open");
      })
    }
  });
});