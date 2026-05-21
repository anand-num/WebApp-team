/* ══════════════════════════════════════════════════════════
   cart-side.js — Web Component
   Хажуугийн сагсны панел.
   localStorage-аас зөвшөөрөгдсөн барааг уншиж харуулна,
   бараа хасах болон төлбөр төлөх боломжтой.

   Хэрэглэх: <cart-side></cart-side>
   Нээх/хаах: window.toggleCart() эсвэл [data-cart-toggle] товч
══════════════════════════════════════════════════════════ */

// ── Тогтмол утгууд ────────────────────────────────────────

/** localStorage-д сагсны мэдээллийг хадгалах түлхүүр */
const CART_STORE = 'rf_cart';

/**
 * Зургийн URL байхгүй тохиолдолд картын арын фон болох градиентүүд.
 * Бараа ID-аар эргэлдэнэ.
 */
const GRADIENTS = [
  'linear-gradient(135deg,#0a2010,#1a4020)',
  'linear-gradient(135deg,#1a0a20,#3a1040)',
  'linear-gradient(135deg,#200a0a,#401020)',
  'linear-gradient(135deg,#0a1520,#1a3040)',
  'linear-gradient(135deg,#1a1a0a,#3a3010)',
];

// ── Компонент ─────────────────────────────────────────────

class CartSide extends HTMLElement {
  constructor() {
    super();
    /** @type {Array} JSON файлаас ачааллагдсан бүх бүтээгдэхүүн */
    this.products = [];
    /** @type {boolean} Панел нээлттэй эсэх */
    this.isOpen = false;
  }

  connectedCallback() {
    this.loadProducts();
    this.render();
    this.setupListeners();
  }

  // ── Мэдээлэл ──────────────────────────────────────────────

  /**
   * Бүтээгдэхүүний мэдээллийг JSON файлаас ачаална.
   * Амжилтгүй болвол алдаагаа чимээгүй орхино (сагс дутуу мэдээлэлтэй харагдана).
   */
  loadProducts() {
    fetch('/public/json/product.json')
      .then(r => r.json())
      .then(data => { this.products = data; })
      .catch(() => {});
  }

  /**
   * localStorage-аас сагсны барааг уншина.
   * @returns {Array} Сагсны барааны жагсаалт (алдаа гарвал хоосон массив)
   */
  getItems() {
    try {
      return JSON.parse(localStorage.getItem(CART_STORE)) || [];
    } catch {
      return [];
    }
  }

  /**
   * Сагсны барааг localStorage-д хадгална.
   * @param {Array} items - Хадгалах барааны жагсаалт
   */
  saveItems(items) {
    localStorage.setItem(CART_STORE, JSON.stringify(items));
  }

  // ── Туслах функцууд ────────────────────────────────────────

  /**
   * Тоог мөнгөн тэмдэгтийн формат руу хөрвүүлнэ.
   * @param {number} n - Тоо
   * @returns {string} "150,000₮" гэх мэт форматтай мөр
   */
  formatPrice(n) {
    return Number(n).toLocaleString() + '₮';
  }

  /**
   * Сагсны барааг JSON файлын бүрэн мэдээллээр баяжуулна.
   * Зураг, нэр, брэнд гэх мэт дутуу талбаруудыг нөхнө.
   * @param {Object} item - Сагсны бараа
   * @returns {Object} Баяжуулсан бараа
   */
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

  /**
   * Навигацийн сагсны тоог шинэчилнэ.
   * Тоо 0 бол badge нуугдана.
   */
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = this.getItems().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // ── Нээх / хаах ───────────────────────────────────────────

  /** Панелийг нээх эсвэл хаана (toggle). */
  toggle() {
    const side = this.querySelector('.cart-side');
    const overlay = this.querySelector('.cart-overlay');
    if (!side) return;

    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.renderCartContent(); // Нээхэд агуулгыг шинэчилнэ
    }

    side.classList.toggle('open', this.isOpen);
    if (overlay) overlay.classList.toggle('open', this.isOpen);
  }

  /** Панелийг хаана. */
  close() {
    const side = this.querySelector('.cart-side');
    const overlay = this.querySelector('.cart-overlay');
    this.isOpen = false;
    if (side) side.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  // ── Агуулга рендерлэх ─────────────────────────────────────

  /**
   * Сагсны барааны жагсаалт болон нийт дүнг HTML-ээр шинэчилнэ.
   * Хоосон бол мессеж харуулна.
   */
  renderCartContent() {
    const wrap = this.querySelector('#cartItemsWrap');
    const foot = this.querySelector('#cartFoot');
    if (!wrap) return;

    const items = this.getItems();

    // Хоосон сагс
    if (items.length === 0) {
      wrap.innerHTML = '<p class="cs-empty">Зөвшөөрөгдсөн бараа байхгүй байна</p>';
      if (foot) foot.innerHTML = '';
      this.updateBadge();
      return;
    }

    // Бараа бүрийн картыг бүтээнэ
    wrap.innerHTML = items.map(raw => {
      const item = this.enrichItem(raw);
      const grad = GRADIENTS[(item.id || 0) % GRADIENTS.length];
      const emoji = item.emoji || '👗';
      const days = item.selectedDays || 1;
      const total = (item.basePrice || 0) * days;

      // Зураг байвал img, байхгүй бол emoji + арын фон
      const figHTML = item.img
        ? `<figure class="ci-fig"><img src="/public/source/${item.img}" alt="${item.name || ''}" loading="lazy"></figure>`
        : `<figure class="ci-fig" style="background:${grad}">${emoji}</figure>`;

      // Огноо байвал дэлгэрэнгүй шугам нэмнэ
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

    // Нийт дүн тооцоолол
    const subtotal = items.reduce(
      (sum, item) => sum + (item.basePrice || 0) * (item.selectedDays || 1),
      0
    );
    const advance = Math.round(subtotal * 0.3); // 30% урьдчилгаа

    // Хөл хэсэг: нийт дүн + төлбөр товч
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

  // ── Үйл явдлын listener-үүд ───────────────────────────────

  /**
   * "Хасах" товчнуудад listener бүртгэнэ.
   * Давхардсан listener-ийг арилгахын тулд эхлээд removeEventListener дуудна.
   */
  setupRemoveButtons() {
    this.querySelectorAll('.ci-rm').forEach(btn => {
      btn.removeEventListener('click', this.handleRemove);
      btn.addEventListener('click', this.handleRemove.bind(this));
    });
  }

  /**
   * Хасах товч дарагдсан үед сагснаас барааг устгана.
   * @param {MouseEvent} e - Click event (data-id attribute-аас ID уншина)
   */
  handleRemove(e) {
    const id = parseInt(e.target.dataset.id);
    const items = this.getItems();
    this.saveItems(items.filter(i => i.id !== id));
    this.renderCartContent();
  }

  /**
   * Бүх listener-ийг бүртгэнэ:
   * - [data-cart-toggle] товч → нээх/хаах
   * - .cart-close товч → хаах
   * - .cart-overlay → хаах
   * - Escape товч → хаах
   */
  setupListeners() {
    // Навигацийн сагс товч
    const cartToggle = document.querySelector('[data-cart-toggle]');
    if (cartToggle) {
      cartToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    }

    // Хаах товч (× дотор)
    const closeBtn = this.querySelector('.cart-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Overlay дарах үед хаах
    const overlay = this.querySelector('.cart-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }

    // Escape товч дарах үед хаах
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  // ── HTML бүтэц ────────────────────────────────────────────

  /**
   * Компонентын суурь HTML-ийг бүтээнэ.
   * Агуулга (барааны жагсаалт) нь renderCartContent()-ээр дүүргэгдэнэ.
   */
  render() {
    this.innerHTML = `
      <!-- Overlay: панел нээлттэй үед ар талыг бүрхэнэ -->
      <div class="cart-overlay" id="cartOverlay"></div>

      <!-- Хажуугийн панел -->
      <aside class="cart-side" id="cartSide" aria-label="Таны сагс">
        <header class="cart-side-hd">
          <h2>Таны сагс</h2>
          <button class="cart-close" aria-label="Хаах">✕</button>
        </header>
        <!-- aria-live: агуулга өөрчлөгдөхөд screen reader мэдэгдэнэ -->
        <section class="cart-items-wrap" id="cartItemsWrap" aria-live="polite"></section>
        <div id="cartFoot"></div>
      </aside>
    `;
  }
}

// ── Бүртгэл ───────────────────────────────────────────────

customElements.define('cart-side', CartSide);

/**
 * Глобал товчлол: HTML onclick-аас дуудах боломжтой.
 * Жишээ: <button onclick="toggleCart()">Сагс</button>
 */
window.toggleCart = () => {
  const cart = document.querySelector('cart-side');
  if (cart) cart.toggle();
};
