/* ══════════════════════════════════════════════════════════
   cart-side.js — Web Component
   Sliding cart sidebar: shows approved items from rf_cart,
   lets user remove items and go to checkout.
══════════════════════════════════════════════════════════ */

const CART_STORE = 'rf_cart';
const GRADIENTS = [
  'linear-gradient(135deg,#0a2010,#1a4020)',
  'linear-gradient(135deg,#1a0a20,#3a1040)',
  'linear-gradient(135deg,#200a0a,#401020)',
  'linear-gradient(135deg,#0a1520,#1a3040)',
  'linear-gradient(135deg,#1a1a0a,#3a3010)',
];

class CartSide extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.isOpen = false;
  }

  connectedCallback() {
    this.loadProducts();
    this.render();
    this.setupListeners();
  }

  loadProducts() {
    fetch('/http://localhost:5000/api/products')
      .then(r => r.json())
      .then(data => { this.products = data; })
      .catch(() => {});
  }

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(CART_STORE)) || [];
    } catch (e) {
      return [];
    }
  }

  saveItems(items) {
    localStorage.setItem(CART_STORE, JSON.stringify(items));
  }

  formatPrice(n) {
    return Number(n).toLocaleString() + '₮';
  }

  enrichItem(item) {
    const product = this.products.find(p => p.id === item.id);
    if (!product) return item;
    return {
      ...item,
      name: product.item_name,
      brand: product.brand,
      emoji: product.emoji || item.emoji || '👗',
      img: product.img_src || item.img,
    };
  }

  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = this.getItems().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  toggle() {
    const side = this.querySelector('.cart-side');
    const overlay = this.querySelector('.cart-overlay');
    if (!side) return;

    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.renderCartContent();
    }
    
    side.classList.toggle('open', this.isOpen);
    if (overlay) overlay.classList.toggle('open', this.isOpen);
  }

  close() {
    const side = this.querySelector('.cart-side');
    const overlay = this.querySelector('.cart-overlay');
    this.isOpen = false;
    if (side) side.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  renderCartContent() {
    const wrap = this.querySelector('#cartItemsWrap');
    const foot = this.querySelector('#cartFoot');
    if (!wrap) return;

    const items = this.getItems();

    if (items.length === 0) {
      wrap.innerHTML = '<p class="cs-empty">Зөвшөөрөгдсөн бараа байхгүй байна</p>';
      if (foot) foot.innerHTML = '';
      this.updateBadge();
      return;
    }

    wrap.innerHTML = items.map(raw => {
      const item = this.enrichItem(raw);
      const grad = GRADIENTS[(item.id || 0) % GRADIENTS.length];
      const emoji = item.emoji || '👗';
      const days = item.selectedDays || 1;
      const total = (item.basePrice || 0) * days;

      const figHTML = item.img
        ? `<figure class="ci-fig"><img src="/public/source/${item.img}" alt="${item.name || ''}" loading="lazy"></figure>`
        : `<figure class="ci-fig" style="background:${grad}">${emoji}</figure>`;

      const dateLine = (item.startDate && item.endDate)
        ? `<p class="ci-dates">📅 ${item.startDate} → ${item.endDate} (${days} өдөр)</p>`
        : '';

      return `
        <article class="ci">
          ${figHTML}
          <section class="ci-info">
            <p class="ci-name">${item.name || ''}</p>
            <p class="ci-meta">${item.brand || ''} · ${item.size || ''} · ${this.formatPrice(item.basePrice)}/өдөр</p>
            ${dateLine}
            <p class="ci-status">✅ Зөвшөөрөгдсөн</p>
            <p class="ci-total">${this.formatPrice(total)}</p>
            <button class="ci-rm" data-id="${item.id}">✕ Хасах</button>
          </section>
        </article>
      `;
    }).join('');

    const subtotal = items.reduce((sum, item) => {
      return sum + (item.basePrice || 0) * (item.selectedDays || 1);
    }, 0);
    const advance = Math.round(subtotal * 0.3);

    if (foot) {
      foot.innerHTML = `
        <footer class="cs-foot">
          <dl class="cs-totals">
            <dt>Түрээсийн дүн</dt><dd>${this.formatPrice(subtotal)}</dd>
            <dt class="cs-muted">Урьдчилгаа (30%)</dt><dd class="cs-muted">${this.formatPrice(advance)}</dd>
          </dl>
          <p class="cs-grand"><span>Нийт</span><strong>${this.formatPrice(subtotal + advance)}</strong></p>
          <button class="btn-g cs-pay-btn" onclick="location.href='/public/html/cart.html'">💳 Төлбөр төлөх →</button>
        </footer>
      `;
    }

    this.updateBadge();
    this.setupRemoveButtons();
  }

  setupRemoveButtons() {
    const removeBtns = this.querySelectorAll('.ci-rm');
    removeBtns.forEach(btn => {
      btn.removeEventListener('click', this.handleRemove);
      btn.addEventListener('click', this.handleRemove.bind(this));
    });
  }

  handleRemove(e) {
    const id = parseInt(e.target.dataset.id);
    const items = this.getItems();
    this.saveItems(items.filter(i => i.id !== id));
    this.renderCartContent();
  }

  setupListeners() {
  
    const cartToggle = document.querySelector('[data-cart-toggle]');
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
    }

    // Close button
    const closeBtn = this.querySelector('.cart-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Overlay click
    const overlay = this.querySelector('.cart-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  render() {
    this.innerHTML = `
      <!-- Cart sidebar overlay -->
      <div class="cart-overlay" id="cartOverlay"></div>

      <!-- Cart sidebar -->
      <aside class="cart-side" id="cartSide" aria-label="Таны сагс">
        <header class="cart-side-hd">
          <h2>Таны сагс</h2>
          <button class="cart-close" aria-label="Хаах">✕</button>
        </header>
        <section class="cart-items-wrap" id="cartItemsWrap" aria-live="polite"></section>
        <div id="cartFoot"></div>
      </aside>
    `;
  }
}

// Register the component
customElements.define('cart-side', CartSide);

// Make toggleCart available globally for onclick handlers
window.toggleCart = () => {
  const cart = document.querySelector('cart-side');
  if (cart && cart.toggle) {
    cart.toggle();
  }
};