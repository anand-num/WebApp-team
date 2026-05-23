/* ══════════════════════════════════════════════════════════
   RENTFIT — cart.js
   Олон алхамт захиалгын хуудас
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js модулиас Cart классыг импортлож нэг instance үүсгэнэ
const cart = new Cart();

// Хүргэлтийн сонголтын төлөв — анхдагчаар "Биечлэн авах"
const bookState = { delivery: 'pickup' };

// Хүргэлтийн үнэ — сонгосон аргаас хамаарна
function getDeliveryCost() {
  if (bookState.delivery === 'hurd') return 5000; // HurD Express
  if (bookState.delivery === 'amar') return 3000; // Amar Express
  return 0; // Биечлэн авах — үнэгүй
}

// Тоог Монгол мөнгөний форматад хөрвүүлэх
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

// ── CartPage класс ───────────────────────────────────────
class CartPage {
  #currentStep   = 0;
  #products      = [];
  #quickId;

  constructor() {
    this.#quickId = parseInt(new URLSearchParams(location.search).get('quick'), 10) || null;

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
    this.$total    = document.getElementById('receipt-total-price');
    this.tabTitle  = document.querySelector('.tab-title');
  }

  // ── Идэвхтэй бараануудыг авах (ASYNC) ─────────────────
  async getActiveItems() {
    const items = await cart.getItems();
    return this.#quickId
      ? items.filter(i => i.id == this.#quickId)
      : items;
  }

  updateStepper(idx) {
    this.stepEls.forEach(function(el, i) {
      el.classList.remove('on', 'done');
      if (i < idx)  { el.classList.add('done'); }
      if (i === idx) { el.classList.add('on'); }
    });
  }

  toggleSuccessMode(isSuccess) {
    const cartContainer = document.querySelector('.cart');
    if (cartContainer) {
      if (isSuccess) {
        cartContainer.classList.add('success-mode');
      } else {
        cartContainer.classList.remove('success-mode');
      }
    }
  }

  showStep(idx) {
    this.#currentStep = idx;
    const ALL_IDS = ['first-step', 'second-step', 'third-step', 'fourth-step'];

    this.tabs.forEach(function(c) { c.classList.remove('active'); });
    document.getElementById(ALL_IDS[idx]).classList.add('active');

    this.toggleSuccessMode(idx === 3);

    if (idx < 3) {
      this.updateStepper(idx);
      this.stepperEl.style.display = '';
      this.receiptEl.style.display = '';
      this.tabTitle.style.display = '';
    }

    switch (idx) {
      case 0:
        this.backBtn.style.display = '';
        this.backBtn.textContent   = '← КАТАЛОГ';
        this.backBtn.onclick = function() { location.href = '/public/html/browse.html'; };
        this.nextBtn.style.display = '';
        this.nextBtn.textContent   = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;

      case 1:
        this.backBtn.style.display = '';
        this.backBtn.textContent   = '← БУЦАХ';
        this.backBtn.onclick = function() { this.showStep(0); }.bind(this);
        this.nextBtn.style.display = '';
        this.nextBtn.textContent   = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;

      case 2:
        this.backBtn.style.display = '';
        this.backBtn.textContent   = '← БУЦАХ';
        this.backBtn.onclick = function() { this.showStep(1); }.bind(this);
        this.nextBtn.style.display = '';
        this.nextBtn.textContent   = 'ЗАХИАЛАХ →';
        break;

      case 3:
        this.backBtn.style.display   = 'none';
        this.nextBtn.style.display   = 'none';
        this.receiptEl.style.display = 'none';
        this.stepperEl.style.display = 'none';
        this.tabTitle.style.display = 'none';
        break;
    }
  }

  updateReceipt(items) {
    const sub = items.reduce(function(s, it) {
      return s + (it.basePrice * (it.selectedDays || 1));
    }, 0);

    const del = items.length ? getDeliveryCost() : 0;
    const total = sub + del;

    if (this.$subtotal) { this.$subtotal.textContent = fmt(sub); }
    if (this.$delivery) { this.$delivery.textContent = del === 0 ? 'Үнэгүй' : fmt(del); }
    if (this.$total)    { this.$total.textContent    = fmt(total); }
  }

  #buildItemHTML(item) {
    const gradients = [
      'linear-gradient(135deg,#0a2010,#1a4020)',
      'linear-gradient(135deg,#1a0a20,#2d1040)',
      'linear-gradient(135deg,#20100a,#401a0a)',
      'linear-gradient(135deg,#0a1020,#1a2040)',
      'linear-gradient(135deg,#10200a,#204010)',
    ];
    const grad      = gradients[(item.id || 0) % gradients.length] || gradients[0];
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
            <p class="card-brand">${item.brand || ''}</p>
            <h2 class="card-name">${item.name}</h2>
          </div>
          <button class="card-remove"
            onclick="rmCart('${item.cart_id || item.id}');renderBooking('cart')"
            title="Хасах">✕</button>
        </header>
        <p class="card-meta">
          <span>Размер: <strong>${item.size || 'M'}</strong></span>
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

  // ── Сагсыг дэлгэцэнд харуулах (ASYNC) ─────────────────
  async renderCart() {
    const items = await this.getActiveItems();
    this.cartList.innerHTML = '';

    if (!items.length) {
      this.cartList.innerHTML = `
        <li class="cart-empty">
          <div class="cart-empty-content">
            <p>Таны сагс хоосон байна.</p>
            <a href="/public/html/browse.html" class="btn-primary catalog-btn">← Каталогруу очих</a>
          </div>
        </li>`;
      this.updateReceipt([]);
      
      if (this.nextBtn) {
        this.nextBtn.disabled = true;
        this.nextBtn.style.opacity = '0.5';
        this.nextBtn.style.cursor = 'not-allowed';
      }
      return;
    }
    
    if (this.nextBtn) {
      this.nextBtn.disabled = false;
      this.nextBtn.style.opacity = '1';
      this.nextBtn.style.cursor = 'pointer';
    }

    items.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = this.#buildItemHTML(item);
      this.cartList.appendChild(li);
    });

    this.updateReceipt(items);
  }

  validateForm() {
    return true;
  }

  async buildConfirmation() {
    const items = await this.getActiveItems();
    const gradients = [
      'linear-gradient(135deg,#0a2010,#1a4020)',
      'linear-gradient(135deg,#1a0a20,#2d1040)',
      'linear-gradient(135deg,#20100a,#401a0a)',
      'linear-gradient(135deg,#0a1020,#1a2040)',
      'linear-gradient(135deg,#10200a,#204010)',
    ];

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

    const itemList = document.getElementById('sum-item-list');
    if (itemList) {
      itemList.innerHTML = items.map(it => {
        const days = it.selectedDays || 1;
        const grad = gradients[(it.id || 0) % gradients.length] || gradients[0];
        const dateHtml = it.startDate
          ? `<p class="sum-item-dates">📅 ${it.startDate} → ${it.endDate}</p>` : '';
        return `
          <li class="sum-item">
            <figure class="sum-item-fig" style="background:${grad}">${it.emoji || '👗'}</figure>
            <div class="sum-item-info">
              <p class="sum-item-name">${it.name}</p>
              <p class="sum-item-meta">${it.brand || ''} · ${it.size || 'M'} · ${days} өдөр</p>
              ${dateHtml}
            </div>
            <strong class="sum-item-price">${fmt(it.basePrice * days)}</strong>
          </li>`;
      }).join('');
    }
  }

  async placeOrder() {
    const orderId = 'RF-' + Math.floor(100000 + Math.random() * 900000);
    const el = document.getElementById('order-id');
    if (el) { el.textContent = orderId; }

    if (this.#quickId) {
      await cart.removeByProductId(this.#quickId);
    } else {
      await cart.checkout();
    }
  }

  setupListeners() {
    this.nextBtn.addEventListener('click', async () => {
      if (this.#currentStep === 0) {
        const items = await this.getActiveItems();
        if (!items.length) return;
        this.showStep(1);
      } else if (this.#currentStep === 1) {
        await this.buildConfirmation();
        this.showStep(2);
      } else if (this.#currentStep === 2) {
        await this.placeOrder();
        this.showStep(3);
      }
    });

    const confirmEditBtn = document.querySelector('.confirm-edit-btn');
    if (confirmEditBtn) {
      confirmEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showStep(1);
      });
    }

    const successBtn = document.querySelector('.order-success .btn-primary');
    if (successBtn) {
      successBtn.addEventListener('click', () => {
        location.href = '/public/html/browse.html';
      });
    }
  }

  async loadProducts() {
    // Only load products for enrichment, not for adding to cart
    try {
      const r = await fetch('http://localhost:3000/api/products');
      if (r.ok) { this.#products = await r.json(); }
    } catch (_) {}
  }

  async init() {
    await this.loadProducts(); // Only for product details enrichment
    this.setupListeners();
    this.showStep(0);
    await this.renderCart();
  }
}

const page = new CartPage();

window.bookState     = bookState;
window.rmCart        = async (id) => { 
  const success = await cart.remove(id);
  if (!success) {
    await cart.removeByProductId(id);
  }
  await page.renderCart(); 
};
window.renderBooking = async (type) => {
  if (type === 'cart') { await page.renderCart(); }
};

page.init();