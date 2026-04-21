/* ══════════════════════════════════════════════════════════
   RENTFIT — cart.js
   Олон алхамт захиалгын хуудас
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js модулиас Cart классыг импортлож нэг instance үүсгэнэ
const cart = new Cart();

// Барьцааны хувь — нийт үнийн 30%
const DEPOSIT_R = 0.30;

// Хүргэлтийн сонголтын төлөв — анхдагчаар "Биечлэн авах"
const bookState = { delivery: 'pickup' };

// Хүргэлтийн үнэ — сонгосон аргаас хамаарна
function getDeliveryCost() {
  if (bookState.delivery === 'hurd') return 5000; // HurD Express
  if (bookState.delivery === 'amar') return 3000; // Amar Express
  return 0; // Биечлэн авах — үнэгүй
}

// Тоог Монгол мөнгөний форматад хөрвүүлэх
// toLocaleString() — тоонд таслал нэмнэ (жш: 3000 → "3,000")
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

// ── CartPage класс ───────────────────────────────────────
class CartPage {
  // # тэмдэгт — private хувьсагч, зөвхөн энэ класс дотроос хандаж болно
  #currentStep   = 0;  // Одоогийн алхамын дугаар
  #promoDiscount = 0;  // Промо кодоор хасагдах дүн
  #promoCodes    = []; // Серверээс ачаалсан промо кодуудын жагсаалт
  #products      = []; // product.json-с ачаалсан бүтээгдэхүүний жагсаалт
  #quickId;            // URL-ээс авсан шуурхай худалдааны бүтээгдэхүүний ID

  constructor() {
    // URL-ийн "quick" параметрийг уншина — жш: cart.html?quick=42
    this.#quickId = parseInt(new URLSearchParams(location.search).get('quick'), 10) || null;

    // Хуудасны DOM элементүүдийг олж хадгална
    this.stepEls   = document.querySelectorAll('.cs');
    this.tabs      = document.querySelectorAll('[data-tab-content]');
    this.footer    = document.querySelector('.tab-footer');
    this.backBtn   = this.footer.querySelector('.btn-secondary');
    this.nextBtn   = this.footer.querySelector('.btn-primary');
    this.receiptEl = document.querySelector('.cart-receipt');
    this.stepperEl = document.querySelector('.co-steps');
    this.cartList  = document.getElementById('cart-item-list');
    this.$subtotal = document.getElementById('receipt-subtotal');
    this.$delivery = document.getElementById('receipt-delivery');
    this.$deposit  = document.getElementById('receipt-deposit');
    this.$discRow  = document.getElementById('receipt-discount-row');
    this.$discAmt  = document.getElementById('receipt-discount');
    this.$total    = document.getElementById('receipt-total-price');
  }

  // ── Идэвхтэй бараануудыг авах ────────────────────────
  getActiveItems() {
    const items = cart.getItems();
    // Шуурхай худалдаа байвал зөвхөн тухайн барааг харуулна
    return this.#quickId
      ? items.filter(function(i) { return i.id === this.#quickId; }.bind(this))
      : items;
  }

  // ── Сагс хоосон бол туршилтын мэдээлэл нэмэх ────────
  async seedIfEmpty() {
    if (cart.getItems().length) return;

    try {
      const r = await fetch('/public/json/product.json');
      const products = await r.json();
      const seeds = [products[6], products[4]];
      const today = new Date().toISOString().slice(0, 10);

      cart.save(seeds.map(function(p) {
        const days = 3;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        return {
          id          : p.id,
          name        : p.item_name,
          brand       : p.brand,
          img         : p.img_src,
          emoji       : p.emoji || '👗',
          size        : Array.isArray(p.sizes) ? p.sizes[0] : p.sizes,
          basePrice   : parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0,
          selectedDays: days,
          startDate   : today,
          endDate     : endDate.toISOString().slice(0, 10),
        };
      }));
    } catch (e) {
      console.warn('[cart] seed failed', e);
    }
  }

  // ── Stepper-ийн төлөвийг шинэчлэх ───────────────────
  updateStepper(idx) {
    this.stepEls.forEach(function(el, i) {
      el.classList.remove('on', 'done');
      if (i < idx)  { el.classList.add('done'); }
      if (i === idx) { el.classList.add('on'); }
    });
  }

  // ── Алхам харуулах ───────────────────────────────────
  showStep(idx) {
    this.#currentStep = idx;
    const ALL_IDS = ['first-step', 'second-step', 'third-step', 'fourth-step'];

    // Бүх алхмуудыг нуунэ
    this.tabs.forEach(function(c) { c.classList.remove('active'); });
    // Зөвхөн сонгосон алхмыг харуулна
    document.getElementById(ALL_IDS[idx]).classList.add('active');

    if (idx < 3) {
      this.updateStepper(idx);
      this.stepperEl.style.display = '';
      this.receiptEl.style.display = '';
    }

    switch (idx) {
      case 0: // Сагсны алхам
        this.backBtn.style.display = '';
        this.backBtn.textContent   = '← КАТАЛОГ';
        this.backBtn.onclick = function() { location.href = '/public/html/browse.html'; };
        this.nextBtn.style.display = '';
        this.nextBtn.textContent   = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;

      case 1: // Хүргэлтийн алхам
        this.backBtn.style.display = '';
        this.backBtn.textContent   = '← БУЦАХ';
        this.backBtn.onclick = function() { this.showStep(0); }.bind(this);
        this.nextBtn.style.display = '';
        this.nextBtn.textContent   = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;

      case 2: // Баталгаажуулах алхам
        this.backBtn.style.display = '';
        this.backBtn.textContent   = '← БУЦАХ';
        this.backBtn.onclick = function() { this.showStep(1); }.bind(this);
        this.nextBtn.style.display = '';
        this.nextBtn.textContent   = 'ЗАХИАЛАХ →';
        break;

      case 3: // Амжилттай захиалгын алхам
        this.backBtn.style.display   = 'none';
        this.nextBtn.style.display   = 'none';
        this.receiptEl.style.display = 'none';
        this.stepperEl.style.display = 'none';
        break;
    }
  }

  // ── Баримтыг шинэчлэх ───────────────────────────────
  updateReceipt(items) {
    // Нийт дүн = бараа бүрийн үнэ × өдрийн тооны нийлбэр
    const sub = items.reduce(function(s, it) {
      return s + (it.basePrice * (it.selectedDays || 1));
    }, 0);

    // Хүргэлтийн үнэ — сонгосон аргаас хамаарна
    const del = items.length ? getDeliveryCost() : 0;

    // Барьцааны дүн = нийт дүнгийн 30%
    const deposit = Math.round(sub * DEPOSIT_R);

    // Нийт = нийт дүн + хүргэлт + барьцаа − хөнгөлөлт
    const total = Math.max(0, sub + del + deposit - this.#promoDiscount);

    if (this.$subtotal) { this.$subtotal.textContent = fmt(sub); }
    if (this.$delivery) { this.$delivery.textContent = del === 0 ? 'Үнэгүй' : fmt(del); }
    if (this.$deposit)  { this.$deposit.textContent  = fmt(deposit); }
    if (this.$total)    { this.$total.textContent    = fmt(total); }
  }

  // ── Бараа бүрийн HTML үүсгэх (private) ──────────────
  #buildItemHTML(item) {
    // Бараа бүрт ялгаатай өнгийн фон — id-аас хамаарч сонгоно
    const gradients = [
      'linear-gradient(135deg,#0a2010,#1a4020)',
      'linear-gradient(135deg,#1a0a20,#2d1040)',
      'linear-gradient(135deg,#20100a,#401a0a)',
      'linear-gradient(135deg,#0a1020,#1a2040)',
      'linear-gradient(135deg,#10200a,#204010)',
    ];
    const grad      = gradients[item.id % gradients.length] || gradients[0];
    const emoji     = item.emoji || '👗';
    const days      = item.selectedDays || 1;
    const total     = item.basePrice * days;
    const startDate = item.startDate || '—';
    const endDate   = item.endDate   || '—';
    const imgSrc    = item.img ? '/public/source/' + item.img : null;

    const figureHTML = imgSrc
      ? `<figure class="card-visual"><img src="${imgSrc}" alt="${item.name}" loading="lazy"></figure>`
      : `<figure class="card-visual" style="background:${grad}"><span class="card-emoji">${emoji}</span></figure>`;

    return `
    <article class="product-card">
      ${figureHTML}
      <section class="card-body">
        <header class="card-header">
          <div class="card-title">
            <p class="card-brand">${item.brand}</p>
            <h2 class="card-name">${item.name}</h2>
          </div>
          <button class="card-remove"
            onclick="rmCart(${item.id});renderBooking('cart')"
            title="Хасах">✕</button>
        </header>
        <p class="card-meta">
          <span>Размер: <strong>${item.size}</strong></span>
          <span>Хугацаа: <strong>${days} өдөр</strong></span>
        </p>
        <p class="card-dates">📅 <span>${startDate}</span> → <span>${endDate}</span></p>
        <footer class="card-footer">
          <span class="card-price-breakdown">${fmt(item.basePrice)} × ${days} өдөр</span>
          <strong class="card-total-price">${fmt(total)}</strong>
        </footer>
      </section>
    </article>`;
  }

  // ── Сагсыг дэлгэцэнд харуулах ────────────────────────
  renderCart() {
    const items = this.getActiveItems();
    this.cartList.innerHTML = '';

    if (!items.length) {
      this.cartList.innerHTML = `
        <li class="cart-empty">
          <p>Таны сагс хоосон байна.</p>
          <a href="/public/html/browse.html" class="btn-primary">← Каталогруу очих</a>
        </li>`;
      this.updateReceipt([]);
      return;
    }

    items.forEach(function(item) {
      const li = document.createElement('li');
      li.innerHTML = this.#buildItemHTML(this.#enrich(item));
      this.cartList.appendChild(li);
    }.bind(this));

    this.updateReceipt(items);
  }

  // ── Хүргэлтийн арга сонгогдсон тул шалгах зүйл байхгүй
  validateForm() {
    return true;
  }

  // ── Баталгаажуулах алхамын агуулгыг үүсгэх ─────────
  buildConfirmation() {
    const items = this.getActiveItems();
    const gradients = [
      'linear-gradient(135deg,#0a2010,#1a4020)',
      'linear-gradient(135deg,#1a0a20,#2d1040)',
      'linear-gradient(135deg,#20100a,#401a0a)',
      'linear-gradient(135deg,#0a1020,#1a2040)',
      'linear-gradient(135deg,#10200a,#204010)',
    ];

    // Хүргэлтийн мэдээлэл
    const delRow = document.getElementById('sum-del-row');
    if (delRow) {
      const methods = {
        pickup: { name: 'Биечлэн авах', price: 'Үнэгүй', icon: '📍' },
        hurd  : { name: 'HurD Express', price: '5,000₮',  icon: '🚀' },
        amar  : { name: 'Amar Express', price: '3,000₮',  icon: '📦' },
      };
      const m = methods[bookState.delivery] || methods.pickup;
      delRow.innerHTML = `
        <p class="sum-del-method">
          <span class="sum-del-icon">${m.icon}</span>
          <span class="sum-del-text">
            <strong>${m.name}</strong>
            <em>${m.price}</em>
          </span>
        </p>`;
    }

    // Бараануудын жагсаалт
    const itemList = document.getElementById('sum-item-list');
    if (itemList) {
      itemList.innerHTML = items.map(this.#enrich.bind(this)).map(function(it) {
        const days = it.selectedDays || 1;
        const grad = gradients[it.id % gradients.length] || gradients[0];
        const dateHtml = it.startDate
          ? `<p class="sum-item-dates">📅 ${it.startDate} → ${it.endDate}</p>` : '';
        return `
          <li class="sum-item">
            <figure class="sum-item-fig" style="background:${grad}">${it.emoji || '👗'}</figure>
            <div class="sum-item-info">
              <p class="sum-item-name">${it.name}</p>
              <p class="sum-item-meta">${it.brand} · ${it.size} · ${days} өдөр</p>
              ${dateHtml}
            </div>
            <strong class="sum-item-price">${fmt(it.basePrice * days)}</strong>
          </li>`;
      }).join('');
    }
  }

  // ── Захиалга өгөх ─────────────────────────────────
  placeOrder() {
    const orderId = 'RF-' + Math.floor(100000 + Math.random() * 900000);
    const el = document.getElementById('order-id');
    if (el) { el.textContent = orderId; }

    if (this.#quickId) {
      cart.remove(this.#quickId);
    } else {
      cart.clear();
    }
  }

  // ── Промо кодуудыг серверээс ачаалах ────────────────
  async loadPromoCodes() {
    try {
      const r = await fetch('/public/json/promocode.json');
      if (r.ok) { this.#promoCodes = await r.json(); }
    } catch (_) {}
  }

  // ── Промо код хэрэглэх ──────────────────────────────
  applyPromo() {
    const input = document.getElementById('promo-code');
    const msgEl = document.getElementById('promo-msg');
    if (!input || input.disabled) return;

    const code  = input.value.trim().toUpperCase();
    const promo = this.#promoCodes.find(function(p) { return p.code === code; });

    const showErr = function(msg) {
      input.style.borderColor = 'var(--red)';
      if (msgEl) { msgEl.textContent = msg; msgEl.style.color = 'var(--red)'; }
      input.focus();
    };

    if (!promo) { return showErr('Промо код хүчингүй байна.'); }

    const today = new Date().toISOString().slice(0, 10);
    if (promo.starts_at > today)  { return showErr('Промо код идэвхжээгүй байна.'); }
    if (promo.expires_at < today) { return showErr('Промо кодын хугацаа дууссан байна.'); }

    const sub = this.getActiveItems().reduce(function(s, it) {
      return s + (it.basePrice * (it.selectedDays || 1));
    }, 0);

    this.#promoDiscount = Math.round(sub * promo.discount);

    if (this.$discRow) { this.$discRow.style.display = ''; }
    if (this.$discAmt) { this.$discAmt.textContent = '-' + fmt(this.#promoDiscount); }

    input.style.borderColor = 'var(--green)';
    input.disabled = true;
    if (msgEl) {
      msgEl.textContent = promo.description + ' хэрэглэгдлээ ✓';
      msgEl.style.color = 'var(--green)';
    }

    this.updateReceipt(this.getActiveItems());
  }

  // ── Бүх товчнуудын үйлдлийг холбох ─────────────────
  setupListeners() {
    // Промо кодын товч
    const promoBtn = document.querySelector('.receipt-promo-row button');
    if (promoBtn) {
      promoBtn.addEventListener('click', function() { this.applyPromo(); }.bind(this));
    }

    // Промо кодын input дээр Enter дарахад
    const promoInput = document.getElementById('promo-code');
    if (promoInput) {
      promoInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { this.applyPromo(); }
      }.bind(this));
    }

    // "Үргэлжлүүлэх / Захиалах" товч
    this.nextBtn.addEventListener('click', function() {
      if (this.#currentStep === 0) {
        if (!this.getActiveItems().length) return;
        this.showStep(1);
      } else if (this.#currentStep === 1) {
        this.buildConfirmation();
        this.showStep(2);
      } else if (this.#currentStep === 2) {
        this.placeOrder();
        this.showStep(3);
      }
    }.bind(this));

    // "Засах" товч — баталгаажуулах алхмаас хүргэлт рүү буцна
    const confirmEditBtn = document.querySelector('.confirm-edit-btn');
    if (confirmEditBtn) {
      confirmEditBtn.addEventListener('click', function(e) {
        e.preventDefault();
        this.showStep(1);
      }.bind(this));
    }

    // "Каталог руу очих" товч — амжилтын хуудас дээр
    const successBtn = document.querySelector('.order-success .btn-primary');
    if (successBtn) {
      successBtn.addEventListener('click', function() {
        location.href = '/public/html/browse.html';
      });
    }
  }

  // ── product.json ачаалах ─────────────────────────────
  async loadProducts() {
    try {
      const r = await fetch('/public/json/product.json');
      if (r.ok) { this.#products = await r.json(); }
    } catch (_) {}
  }

  // ── Сагсны item-ийг product.json-тай нэгтгэх ────────
  #enrich(item) {
    const p = this.#products.find(function(p) { return p.id === item.id; });
    if (!p) return item;
    return Object.assign({}, item, {
      name  : p.item_name,
      brand : p.brand,
      emoji : p.emoji  || item.emoji || '👗',
      img   : p.img_src || item.img,
    });
  }

  // ── Эхлүүлэх ────────────────────────────────────────
  async init() {
    await Promise.all([this.seedIfEmpty(), this.loadPromoCodes(), this.loadProducts()]);
    this.setupListeners();
    this.showStep(0);
    this.renderCart();
  }
}

// ── Глобал функцууд ──────────────────────────────────────
// ES module тул HTML дахь onclick-аас дуудахын тулд window-д нэмнэ
const page = new CartPage();

window.bookState     = bookState;
window.rmCart        = function(id) { cart.remove(id); };
window.renderBooking = function(type) {
  if (type === 'cart') { page.renderCart(); }
};

page.init();
