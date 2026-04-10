/* ══════════════════════════════════════════════════════════
   RENTFIT — CART  (cart.js)
══════════════════════════════════════════════════════════ */
'use strict';

// ── Constants ─────────────────────────────────────────────
const CART_KEY  = 'rf_cart';
const DELIVERY  = 3000;
const DEPOSIT_R = 0.30;

const DURATIONS = [
  { days: 1, mult: 1   },
  { days: 3, mult: 1.5 },
  { days: 7, mult: 2.5 },
];

// ── Helpers ───────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

function priceFor(base, days) {
  const d = DURATIONS.find(o => o.days === days) || DURATIONS[0];
  return Math.round(base * d.mult);
}

// ── Cart storage ──────────────────────────────────────────
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// ── Seed demo data if cart is empty ──────────────────────
async function maybeInitCart() {
  if (getCart().length) return;
  try {
    // Try both paths to handle different server roots
    let products = null;
    for (const path of ['/public/json/product.json', '../json/product.json']) {
      try {
        const r = await fetch(path);
        if (r.ok) { products = await r.json(); break; }
      } catch (_) {}
    }
    if (!products) return;
    const seeds = [products[6], products[4]];
    saveCart(seeds.map(p => ({
      id:           p.id,
      name:         p.item_name,
      brand:        p.brand,
      img:          p.img_src,
      size:         p.sizes[0],
      basePrice:    parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0,
      selectedDays: 1,
    })));
  } catch (e) {
    console.warn('[cart] seed failed', e);
  }
}

// ── DOM refs ──────────────────────────────────────────────
const stepEls     = document.querySelectorAll('.cs');
const tabContents = document.querySelectorAll('[data-tab-content]');
const footer      = document.querySelector('.tab-footer');
const backBtn     = footer.querySelector('.btn-secondary');
const nextBtn     = footer.querySelector('.btn-primary');
const receiptEl   = document.querySelector('.cart-receipt');
const stepperEl   = document.querySelector('.co-steps');
const cartList    = document.getElementById('cart-item-list');

const $subtotal   = document.getElementById('receipt-subtotal');
const $delivery   = document.getElementById('receipt-delivery');
const $deposit    = document.getElementById('receipt-deposit');
const $discRow    = document.getElementById('receipt-discount-row');
const $discAmt    = document.getElementById('receipt-discount');
const $total      = document.getElementById('receipt-total-price');

const ALL_IDS = ['first-step', 'second-step', 'third-step', 'fourth-step'];

// If ?quick=ID in URL, show only that product through the entire checkout
const quickId = parseInt(new URLSearchParams(location.search).get('quick'), 10) || null;

function getActiveItems() {
  const cart = getCart();
  if (quickId) return cart.filter(i => i.id === quickId);
  return cart;
}

let currentStep   = 0;
let promoDiscount = 0;

// ── Stepper ───────────────────────────────────────────────
function updateStepper(idx) {
  stepEls.forEach((el, i) => {
    el.classList.remove('on', 'done');
    if (i < idx)  el.classList.add('done');
    if (i === idx) el.classList.add('on');
  });
}

// ── Step navigation ───────────────────────────────────────
function showStep(idx) {
  currentStep = idx;

  tabContents.forEach(c => c.classList.remove('active'));
  document.getElementById(ALL_IDS[idx]).classList.add('active');

  // stepper + receipt visible on steps 0-2
  if (idx < 3) {
    updateStepper(idx);
    stepperEl.style.display = '';
    receiptEl.style.display = '';
  }

  switch (idx) {
    case 0:
      backBtn.style.display = '';
      backBtn.textContent   = '← КАТАЛОГ';
      backBtn.onclick       = () => { location.href = '/public/html/browse.html'; };
      nextBtn.style.display = '';
      nextBtn.textContent   = 'ҮРГЭЛЖЛҮҮЛЭХ →';
      break;

    case 1:
      backBtn.style.display = '';
      backBtn.textContent   = '← БУЦАХ';
      backBtn.onclick       = () => showStep(0);
      nextBtn.style.display = '';
      nextBtn.textContent   = 'ҮРГЭЛЖЛҮҮЛЭХ →';
      break;

    case 2:
      backBtn.style.display = '';
      backBtn.textContent   = '← БУЦАХ';
      backBtn.onclick       = () => showStep(1);
      nextBtn.style.display = '';
      nextBtn.textContent   = 'ЗАХИАЛАХ →';
      break;

    case 3:
      backBtn.style.display   = 'none';
      nextBtn.style.display   = 'none';
      receiptEl.style.display = 'none';
      stepperEl.style.display = 'none';
      break;
  }
}

// ── Receipt update ────────────────────────────────────────
function updateReceipt(items) {
  const sub     = items.reduce((s, it) => s + priceFor(it.basePrice, it.selectedDays), 0);
  const del     = items.length ? DELIVERY : 0;
  const deposit = Math.round(sub * DEPOSIT_R);
  const total   = Math.max(0, sub + del + deposit - promoDiscount);

  if ($subtotal) $subtotal.textContent = fmt(sub);
  if ($delivery) $delivery.textContent = fmt(del);
  if ($deposit)  $deposit.textContent  = fmt(deposit);
  if ($total)    $total.textContent    = fmt(total);
}

// ── Cart item HTML ────────────────────────────────────────
function buildItemHTML(item, idx) {
  const p1  = item.basePrice;
  const p3  = Math.round(p1 * 1.5);
  const p7  = Math.round(p1 * 2.5);
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
        <label class="cart-dur-btn${sel === 1 ? ' sel' : ''}">
          <input type="radio" name="dur-${idx}" value="1" data-idx="${idx}"${sel === 1 ? ' checked' : ''}>
          <span class="dur-days">1 өдөр</span><span class="dur-price">${fmt(p1)}</span>
        </label>
        <label class="cart-dur-btn${sel === 3 ? ' sel' : ''}">
          <input type="radio" name="dur-${idx}" value="3" data-idx="${idx}"${sel === 3 ? ' checked' : ''}>
          <span class="dur-days">3 өдөр</span><span class="dur-price">${fmt(p3)}</span>
        </label>
        <label class="cart-dur-btn${sel === 7 ? ' sel' : ''}">
          <input type="radio" name="dur-${idx}" value="7" data-idx="${idx}"${sel === 7 ? ' checked' : ''}>
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

// ── Render cart (Step 1) ──────────────────────────────────
function renderCart() {
  const items = getActiveItems();
  cartList.innerHTML = '';

  if (!items.length) {
    cartList.innerHTML = `
    <li class="cart-empty">
      <p>Таны сагс хоосон байна.</p>
      <a href="/public/html/browse.html" class="btn-primary">← Каталогруу очих</a>
    </li>`;
    updateReceipt([]);
    return;
  }

  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.innerHTML = buildItemHTML(item, idx);
    cartList.appendChild(li);
  });

  // Duration radio change — update by item ID so it works in quick-buy mode
  cartList.querySelectorAll('.cart-dur-btn input').forEach((radio) => {
    radio.addEventListener('change', function () {
      const itemId = items[parseInt(this.dataset.idx, 10)].id;
      const cart = getCart();
      const entry = cart.find(c => c.id === itemId);
      if (entry) entry.selectedDays = parseInt(this.value, 10);
      saveCart(cart);
      renderCart();
    });
  });

  // Remove item — remove by item ID
  cartList.querySelectorAll('.card-remove').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const itemId = items[parseInt(this.dataset.idx, 10)].id;
      saveCart(getCart().filter(c => c.id !== itemId));
      renderCart();
    });
  });

  updateReceipt(items);
}

// ── Form validation (Step 2) ──────────────────────────────
function validateForm() {
  const required = ['d-name', 'd-phone', 'd-address'];
  let ok = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.classList.add('input-error');
      ok = false;
    } else {
      el.classList.remove('input-error');
    }
  });
  return ok;
}

['d-name', 'd-phone', 'd-address'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', function () {
    if (this.value.trim()) this.classList.remove('input-error');
  });
});

// ── Build confirmation (Step 3) ───────────────────────────
function buildConfirmation() {
  const items  = getActiveItems();
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
    const name    = document.getElementById('d-name')?.value    || '—';
    const phone   = document.getElementById('d-phone')?.value   || '—';
    const address = document.getElementById('d-address')?.value || '—';
    const date    = document.getElementById('d-date')?.value    || '—';
    const time    = document.getElementById('d-time')?.value    || '—';
    const note    = document.getElementById('d-note')?.value    || 'Байхгүй';
    addrEl.innerHTML = `
      <p><strong>${name}</strong> · <span>${phone}</span></p>
      <p>${address}</p>
      <p>📅 ${date} · ${time}</p>
      <p>📝 ${note}</p>`;
  }

  if (payEl) {
    const checked = document.querySelector('input[name="payment"]:checked');
    const labels  = { cash: 'Бэлэн мөнгө', transfer: 'Банкны шилжүүлэг', qpay: 'QPay' };
    payEl.textContent = labels[checked?.value] || '—';
  }
}

// ── Place order & success (Step 4) ────────────────────────
function placeOrder() {
  const orderId = 'RF-' + Math.floor(100000 + Math.random() * 900000);
  const el = document.getElementById('order-id');
  if (el) el.textContent = orderId;
  if (quickId) {
    // quick-buy: only remove this one item from cart
    saveCart(getCart().filter(i => i.id !== quickId));
  } else {
    saveCart([]);
  }
}

// ── Promo code — loaded from promocode.json ───────────────
let promoCodes = [];

async function loadPromoCodes() {
  for (const path of ['/public/json/promocode.json', '../json/promocode.json']) {
    try {
      const r = await fetch(path);
      if (r.ok) { promoCodes = await r.json(); return; }
    } catch (_) {}
  }
}

function applyPromo() {
  const input  = document.getElementById('promo-code');
  const msgEl  = document.getElementById('promo-msg');
  if (!input || input.disabled) return;

  const code   = input.value.trim().toUpperCase();
  const promo  = promoCodes.find(p => p.code === code);

  if (promo) {
    const today = new Date().toISOString().slice(0, 10);
    if (promo.starts_at > today) {
      input.style.borderColor = 'var(--red)';
      if (msgEl) {
        msgEl.textContent = 'Промо код идэвхжээгүй байна.';
        msgEl.style.color = 'var(--red)';
      }
      input.focus();
      return;
    }
    if (promo.expires_at < today) {
      input.style.borderColor = 'var(--red)';
      if (msgEl) {
        msgEl.textContent = 'Промо кодын хугацаа дууссан байна.';
        msgEl.style.color = 'var(--red)';
      }
      input.focus();
      return;
    }

    const sub     = getActiveItems().reduce((s, it) => s + priceFor(it.basePrice, it.selectedDays), 0);
    promoDiscount = Math.round(sub * promo.discount);

    if ($discRow) $discRow.style.display = '';
    if ($discAmt) $discAmt.textContent   = '-' + fmt(promoDiscount);

    input.style.borderColor = 'var(--green)';
    input.disabled = true;

    if (msgEl) {
      msgEl.textContent = promo.description + ' хэрэглэгдлээ ✓';
      msgEl.style.color = 'var(--green)';
    }

    updateReceipt(getActiveItems());
  } else {
    input.style.borderColor = 'var(--red)';
    if (msgEl) {
      msgEl.textContent = 'Промо код хүчингүй байна.';
      msgEl.style.color = 'var(--red)';
    }
    input.focus();
  }
}

document.querySelector('.receipt-promo-row button')?.addEventListener('click', applyPromo);
document.getElementById('promo-code')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyPromo();
});

// ── Next / Continue button ────────────────────────────────
nextBtn.addEventListener('click', () => {
  if (currentStep === 0) {
    if (!getActiveItems().length) {
      // show hint if cart empty
      cartList.querySelector('.cart-empty p') &&
        (cartList.querySelector('.cart-empty p').style.color = 'var(--red)');
      return;
    }
    showStep(1);

  } else if (currentStep === 1) {
    if (!validateForm()) return;
    buildConfirmation();
    showStep(2);

  } else if (currentStep === 2) {
    placeOrder();
    showStep(3);
  }
});

// ── Confirm "Засах" → back to form ───────────────────────
document.querySelector('.confirm-edit-btn')?.addEventListener('click', e => {
  e.preventDefault();
  showStep(1);
});

// ── Order success → catalog ───────────────────────────────
document.querySelector('.order-success .btn-primary')?.addEventListener('click', () => {
  location.href = '/public/html/browse.html';
});

// ── Init ──────────────────────────────────────────────────
(async function init() {
  await Promise.all([maybeInitCart(), loadPromoCodes()]);
  showStep(0);
  renderCart();
}());
