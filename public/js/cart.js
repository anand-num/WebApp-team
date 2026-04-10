/* ══════════════════════════════════════════════════════════
   RENTFIT — cart.js
   Multi-step checkout page
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

const cart = new Cart();

const DELIVERY  = 3000;
const DEPOSIT_R = 0.30;

const DURATIONS = [
  { days: 1, mult: 1   },
  { days: 3, mult: 1.5 },
  { days: 7, mult: 2.5 },
];

function fmt(n) { return Number(n).toLocaleString() + '₮'; }

function priceFor(base, days) {
  const d = DURATIONS.find(o => o.days === days) || DURATIONS[0];
  return Math.round(base * d.mult);
}

// ── CartPage class ───────────────────────────────────────
class CartPage {
  #currentStep  = 0;
  #promoDiscount = 0;
  #promoCodes   = [];
  #quickId;

  constructor() {
    this.#quickId  = parseInt(new URLSearchParams(location.search).get('quick'), 10) || null;
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

  // ── Active items (full cart or just quick-buy item) ──
  getActiveItems() {
    const items = cart.getItems();
    return this.#quickId ? items.filter(i => i.id === this.#quickId) : items;
  }

  // ── Seed demo data if cart empty ─────────────────────
  async seedIfEmpty() {
    if (cart.getItems().length) return;
    try {
      const r = await fetch('/public/json/product.json');
      const products = await r.json();
      const seeds = [products[6], products[4]];
      cart.save(seeds.map(p => ({
        id:           p.id,
        name:         p.item_name,
        brand:        p.brand,
        img:          p.img_src,
        size:         Array.isArray(p.sizes) ? p.sizes[0] : p.sizes,
        basePrice:    parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0,
        selectedDays: 1,
      })));
    } catch (e) { console.warn('[cart] seed failed', e); }
  }

  // ── Stepper ──────────────────────────────────────────
  updateStepper(idx) {
    this.stepEls.forEach((el, i) => {
      el.classList.remove('on', 'done');
      if (i < idx)  el.classList.add('done');
      if (i === idx) el.classList.add('on');
    });
  }

  // ── Step navigation ──────────────────────────────────
  showStep(idx) {
    this.#currentStep = idx;
    const ALL_IDS = ['first-step', 'second-step', 'third-step', 'fourth-step'];

    this.tabs.forEach(c => c.classList.remove('active'));
    document.getElementById(ALL_IDS[idx]).classList.add('active');

    if (idx < 3) {
      this.updateStepper(idx);
      this.stepperEl.style.display = '';
      this.receiptEl.style.display = '';
    }

    switch (idx) {
      case 0:
        this.backBtn.style.display = ''; this.backBtn.textContent = '← КАТАЛОГ';
        this.backBtn.onclick = () => { location.href = '/public/html/browse.html'; };
        this.nextBtn.style.display = ''; this.nextBtn.textContent = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;
      case 1:
        this.backBtn.style.display = ''; this.backBtn.textContent = '← БУЦАХ';
        this.backBtn.onclick = () => this.showStep(0);
        this.nextBtn.style.display = ''; this.nextBtn.textContent = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;
      case 2:
        this.backBtn.style.display = ''; this.backBtn.textContent = '← БУЦАХ';
        this.backBtn.onclick = () => this.showStep(1);
        this.nextBtn.style.display = ''; this.nextBtn.textContent = 'ЗАХИАЛАХ →';
        break;
      case 3:
        this.backBtn.style.display   = 'none';
        this.nextBtn.style.display   = 'none';
        this.receiptEl.style.display = 'none';
        this.stepperEl.style.display = 'none';
        break;
    }
  }

  // ── Receipt ──────────────────────────────────────────
  updateReceipt(items) {
    const sub     = items.reduce((s, it) => s + priceFor(it.basePrice, it.selectedDays), 0);
    const del     = items.length ? DELIVERY : 0;
    const deposit = Math.round(sub * DEPOSIT_R);
    const total   = Math.max(0, sub + del + deposit - this.#promoDiscount);
    if (this.$subtotal) this.$subtotal.textContent = fmt(sub);
    if (this.$delivery) this.$delivery.textContent = fmt(del);
    if (this.$deposit)  this.$deposit.textContent  = fmt(deposit);
    if (this.$total)    this.$total.textContent    = fmt(total);
  }

  // ── Cart item HTML ────────────────────────────────────
  #buildItemHTML(item, idx) {
    const p1 = item.basePrice, p3 = Math.round(p1 * 1.5), p7 = Math.round(p1 * 2.5);
    const sel = item.selectedDays;
    return `
    <article class="product-card">
      <figure class="card-visual" style="background:linear-gradient(135deg,#1a1714,#2d2520)">
        <img src="/public/source/${item.img}" alt="${item.name}">
      </figure>
      <section class="card-body">
        <p class="card-brand">${item.brand}</p>
        <h2 class="card-name">${item.name}</h2>
        <p class="card-meta">Хэмжээ: <strong>${item.size}</strong></p>
        <fieldset class="cart-dur-opts">
          <legend class="sr-only">Түрээсийн хугацаа</legend>
          <label class="cart-dur-btn${sel===1?' sel':''}">
            <input type="radio" name="dur-${idx}" value="1" data-idx="${idx}"${sel===1?' checked':''}>
            <span class="dur-days">1 өдөр</span><span class="dur-price">${fmt(p1)}</span>
          </label>
          <label class="cart-dur-btn${sel===3?' sel':''}">
            <input type="radio" name="dur-${idx}" value="3" data-idx="${idx}"${sel===3?' checked':''}>
            <span class="dur-days">3 өдөр</span><span class="dur-price">${fmt(p3)}</span>
          </label>
          <label class="cart-dur-btn${sel===7?' sel':''}">
            <input type="radio" name="dur-${idx}" value="7" data-idx="${idx}"${sel===7?' checked':''}>
            <span class="dur-days">7 өдөр</span><span class="dur-price">${fmt(p7)}</span>
          </label>
        </fieldset>
      </section>
      <footer class="card-footer">
        <strong class="price price--large">${fmt(priceFor(p1, sel))}</strong>
        <a href="#" class="card-remove" data-idx="${idx}">Хасах</a>
      </footer>
    </article>`;
  }

  // ── Render cart step ──────────────────────────────────
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

    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.innerHTML = this.#buildItemHTML(item, idx);
      this.cartList.appendChild(li);
    });

    // Duration radio
    this.cartList.querySelectorAll('.cart-dur-btn input').forEach(radio => {
      radio.addEventListener('change', () => {
        const itemId = items[parseInt(radio.dataset.idx, 10)].id;
        const all = cart.getItems();
        const entry = all.find(c => c.id === itemId);
        if (entry) entry.selectedDays = parseInt(radio.value, 10);
        cart.save(all);
        this.renderCart();
      });
    });

    // Remove button
    this.cartList.querySelectorAll('.card-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemId = items[parseInt(btn.dataset.idx, 10)].id;
        cart.remove(itemId);
        this.renderCart();
      });
    });

    this.updateReceipt(items);
  }

  // ── Form validation ───────────────────────────────────
  validateForm() {
    let ok = true;
    ['d-name', 'd-phone', 'd-address'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.value.trim()) { el.classList.add('input-error'); ok = false; }
      else                    el.classList.remove('input-error');
    });
    return ok;
  }

  // ── Confirmation step ─────────────────────────────────
  buildConfirmation() {
    const items  = this.getActiveItems();
    const listEl = document.getElementById('confirm-item-list');
    const addrEl = document.getElementById('confirm-delivery-info');
    const payEl  = document.getElementById('confirm-payment');

    if (listEl) {
      listEl.innerHTML = items.map(it => `
        <article class="confirm-item">
          <figure class="confirm-item-fig" style="background:linear-gradient(135deg,#1a1714,#2d2520)">
            <img src="/public/source/${it.img}" alt="${it.name}">
          </figure>
          <section class="confirm-item-info">
            <h3>${it.name}</h3>
            <p>${it.size} · ${it.selectedDays} өдөр</p>
          </section>
          <strong class="confirm-item-price">${fmt(priceFor(it.basePrice, it.selectedDays))}</strong>
        </article>`).join('');
    }

    if (addrEl) {
      const v = id => document.getElementById(id)?.value || '—';
      addrEl.innerHTML = `
        <p><strong>${v('d-name')}</strong> · <span>${v('d-phone')}</span></p>
        <p>${v('d-address')}</p>
        <p>📅 ${v('d-date')} · ${v('d-time')}</p>
        <p>📝 ${document.getElementById('d-note')?.value || 'Байхгүй'}</p>`;
    }

    if (payEl) {
      const checked = document.querySelector('input[name="payment"]:checked');
      payEl.textContent = { cash: 'Бэлэн мөнгө', transfer: 'Банкны шилжүүлэг', qpay: 'QPay' }[checked?.value] || '—';
    }
  }

  // ── Place order ───────────────────────────────────────
  placeOrder() {
    const orderId = 'RF-' + Math.floor(100000 + Math.random() * 900000);
    const el = document.getElementById('order-id');
    if (el) el.textContent = orderId;
    if (this.#quickId) cart.remove(this.#quickId);
    else               cart.clear();
  }

  // ── Promo code ────────────────────────────────────────
  async loadPromoCodes() {
    try {
      const r = await fetch('/public/json/promocode.json');
      if (r.ok) this.#promoCodes = await r.json();
    } catch (_) {}
  }

  applyPromo() {
    const input = document.getElementById('promo-code');
    const msgEl = document.getElementById('promo-msg');
    if (!input || input.disabled) return;

    const code  = input.value.trim().toUpperCase();
    const promo = this.#promoCodes.find(p => p.code === code);

    const showErr = (msg) => {
      input.style.borderColor = 'var(--red)';
      if (msgEl) { msgEl.textContent = msg; msgEl.style.color = 'var(--red)'; }
      input.focus();
    };

    if (!promo) return showErr('Промо код хүчингүй байна.');

    const today = new Date().toISOString().slice(0, 10);
    if (promo.starts_at > today)  return showErr('Промо код идэвхжээгүй байна.');
    if (promo.expires_at < today) return showErr('Промо кодын хугацаа дууссан байна.');

    const sub = this.getActiveItems().reduce((s, it) => s + priceFor(it.basePrice, it.selectedDays), 0);
    this.#promoDiscount = Math.round(sub * promo.discount);

    if (this.$discRow) this.$discRow.style.display = '';
    if (this.$discAmt) this.$discAmt.textContent   = '-' + fmt(this.#promoDiscount);

    input.style.borderColor = 'var(--green)';
    input.disabled = true;
    if (msgEl) { msgEl.textContent = promo.description + ' хэрэглэгдлээ ✓'; msgEl.style.color = 'var(--green)'; }

    this.updateReceipt(this.getActiveItems());
  }

  // ── Wire up all interactions ──────────────────────────
  setupListeners() {
    ['d-name', 'd-phone', 'd-address'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', function () {
        if (this.value.trim()) this.classList.remove('input-error');
      });
    });

    document.querySelector('.receipt-promo-row button')?.addEventListener('click', () => this.applyPromo());
    document.getElementById('promo-code')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.applyPromo();
    });

    this.nextBtn.addEventListener('click', () => {
      if (this.#currentStep === 0) {
        if (!this.getActiveItems().length) return;
        this.showStep(1);
      } else if (this.#currentStep === 1) {
        if (!this.validateForm()) return;
        this.buildConfirmation();
        this.showStep(2);
      } else if (this.#currentStep === 2) {
        this.placeOrder();
        this.showStep(3);
      }
    });

    document.querySelector('.confirm-edit-btn')?.addEventListener('click', e => {
      e.preventDefault(); this.showStep(1);
    });

    document.querySelector('.order-success .btn-primary')?.addEventListener('click', () => {
      location.href = '/public/html/browse.html';
    });
  }

  // ── Boot ─────────────────────────────────────────────
  async init() {
    await Promise.all([this.seedIfEmpty(), this.loadPromoCodes()]);
    this.setupListeners();
    this.showStep(0);
    this.renderCart();
  }
}

new CartPage().init();
