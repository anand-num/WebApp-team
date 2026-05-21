/* ══════════════════════════════════════════════════════════
   browse-product-grid.js — Web Component
   Бүтээгдэхүүний grid контейнер.
   JSON файлаас бараануудыг ачаалж, <product-card>-уудыг үүсгэнэ.
   Шүүлт, хайлт, эрэмбэлэлтийг дэмжинэ.

   Хэрэглэх:
   <browse-product-grid json-url="/public/json/product.json"></browse-product-grid>
══════════════════════════════════════════════════════════ */

// parsePrice-ийг product-card.js-ээс авна (module-ийн side-effect ч бүртгэлийг хийнэ)
import { parsePrice } from './product-card.js';

// ── Компонент ─────────────────────────────────────────────

class BrowseProductGrid extends HTMLElement {
  constructor() {
    super();
    /** @type {Array} JSON файлаас ачааллагдсан бүх бараа */
    this.products = [];
    /** @type {Array} Одоогийн шүүлтэнд тохирсон бараа (рендерлэгдэх) */
    this.filteredProducts = [];
  }

  connectedCallback() {
    const jsonUrl = this.getAttribute('json-url') || '/public/json/product.json';
    this.loadProducts(jsonUrl);
  }

  // ── Мэдээлэл ──────────────────────────────────────────────

  /**
   * JSON файлаас бүтээгдэхүүний жагсаалтыг ачаална.
   * @param {string} jsonUrl - Файлын зам
   */
  async loadProducts(jsonUrl) {
    try {
      const response = await fetch(jsonUrl);
      this.products = await response.json();
      this.filteredProducts = this.products; // Анхандаа бүгдийг харуулна
      this.render();
    } catch (error) {
      console.error('Бараа ачаалах амжилтгүй:', error);
      this.innerHTML = '<p style="color:red;">Бараа ачаалах амжилтгүй</p>';
    }
  }

  // ── Рендерлэх ─────────────────────────────────────────────

  /**
   * filteredProducts дахь бараа бүрт <product-card> үүсгэж grid-д нэмнэ.
   */
  render() {
    this.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'pg'; // browse.css дахь grid layout class

    this.filteredProducts.forEach(product => {
      const card = document.createElement('product-card');
      card.setAttribute('id',           product.id);
      card.setAttribute('brand',        product.brand);
      card.setAttribute('name',         product.item_name);
      card.setAttribute('price',        product.price);
      card.setAttribute('rating',       product.rating);
      card.setAttribute('review-count', product.review_count);
      card.setAttribute('image',        `/public/source/${product.img_src}`);
      card.setAttribute('status',       product.status || '');
      if (product.sizes) {
        card.setAttribute('sizes', JSON.stringify(product.sizes));
      }
      grid.appendChild(card);
    });

    this.appendChild(grid);
  }

  // ── Шүүлтүүр ──────────────────────────────────────────────

  /**
   * Ангиллаар шүүнэ.
   * @param {string} category - Ангилал ('All' бол бүгдийг харуулна)
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
   * Размараар шүүнэ.
   * @param {string} size - Размар ('All' бол бүгдийг харуулна)
   */
  filterBySize(size) {
    if (size === 'All' || !size) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(
        p => Array.isArray(p.sizes) && p.sizes.includes(size)
      );
    }
    this.render();
  }

  /**
   * Дээд үнээр шүүнэ.
   * @param {number} maxPrice - Дээд үнийн хязгаар (₮)
   */
  filterByPrice(maxPrice) {
    this.filteredProducts = this.products.filter(
      p => parsePrice(p.price) <= maxPrice
    );
    this.render();
  }

  /**
   * Нэр болон брэндэд хайлт хийнэ.
   * @param {string} query - Хайлтын үг (хоосон бол бүгдийг харуулна)
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
   * Барааг эрэмбэлнэ.
   * @param {'price-asc'|'price-desc'|'rating'|'new'} sortType
   */
  sort(sortType) {
    switch (sortType) {
      case 'price-asc':
        this.filteredProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case 'price-desc':
        this.filteredProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      default: // 'new' — анхны дарааллыг сэргээнэ
        this.filteredProducts = [...this.products];
    }
    this.render();
  }

  /**
   * Одоогийн шүүлтэнд тохирсон барааны тоог буцаана.
   * @returns {number}
   */
  getCount() {
    return this.filteredProducts.length;
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('browse-product-grid', BrowseProductGrid);

// ── Шүүлтийн холболт ──────────────────────────────────────

/**
 * HTML дахь шүүлтийн элементүүдийг grid компонентод холбоно.
 * browse.html дуусч ачааллагдсан үед автоматаар дуудагдана.
 * @param {string} gridSelector - CSS selector, жишээ: 'browse-product-grid'
 */
function wireBrowseFilters(gridSelector) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;

  // Ангиллын radio товчнууд
  document.querySelectorAll('input[name="cat"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      grid.filterByCategory(e.target.value);
      updateProductCount(grid.getCount());
    });
  });

  // Размарын radio товчнууд
  document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      grid.filterBySize(e.target.value);
      updateProductCount(grid.getCount());
    });
  });

  // Үнийн range slider
  const priceRange = document.querySelector('.price-range');
  if (priceRange) {
    priceRange.addEventListener('input', (e) => {
      grid.filterByPrice(parseInt(e.target.value, 10));
      updateProductCount(grid.getCount());
    });
  }

  // Хайлтын талбар
  const searchInput = document.getElementById('srchInp');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      grid.search(e.target.value.trim());
      updateProductCount(grid.getCount());
    });
  }

  // Эрэмбэлэх dropdown
  const sortSelect = document.getElementById('sortSel');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      grid.sort(e.target.value);
    });
  }

  // Шүүлтийг цэвэрлэх товч
  const resetBtn = document.querySelector('.flt-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      grid.filteredProducts = grid.products;
      grid.render();
      updateProductCount(grid.getCount());

      // Бүх шүүлтийн оролтуудыг анхны байдалд оруулна
      document.querySelector('input[name="cat"][value="All"]').checked = true;
      document.querySelector('input[name="size"][value="All"]').checked = true;
      document.getElementById('srchInp').value = '';
      document.getElementById('sortSel').value = 'new';
      priceRange.value = 500000;
    });
  }
}

/**
 * Олдсон барааны тоог дэлгэцэнд шинэчилнэ.
 * @param {number} count
 */
function updateProductCount(count) {
  const countEl = document.getElementById('catInfo');
  if (countEl) {
    countEl.textContent = `${count} бараа олдлоо`;
  }
}

// ── Эхлүүлэх ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // browse-product-grid байгаа хуудсуудад шүүлтийг холбоно
  if (document.querySelector('browse-product-grid')) {
    wireBrowseFilters('browse-product-grid');
  }
});
