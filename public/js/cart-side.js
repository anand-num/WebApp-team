/* ══════════════════════════════════════════════════════════
   cart-side.js — Plain script (not module)
   Sliding cart sidebar: shows approved items from rf_cart,
   lets user remove items and go to checkout.
══════════════════════════════════════════════════════════ */

var CART_STORE = 'rf_cart';

/* ── Helpers ─────────────────────────────────────────── */

function csGetItems() {
  try { return JSON.parse(localStorage.getItem(CART_STORE)) || []; }
  catch (e) { return []; }
}

function csSave(items) {
  localStorage.setItem(CART_STORE, JSON.stringify(items));
}

function csFmt(n) {
  return Number(n).toLocaleString() + '₮';
}

var CS_GRADIENTS = [
  'linear-gradient(135deg,#0a2010,#1a4020)',
  'linear-gradient(135deg,#1a0a20,#3a1040)',
  'linear-gradient(135deg,#200a0a,#401020)',
  'linear-gradient(135deg,#0a1520,#1a3040)',
  'linear-gradient(135deg,#1a1a0a,#3a3010)',
];

var csProducts = [];

function csLoadProducts() {
  fetch('/public/json/product.json')
    .then(function(r) { return r.json(); })
    .then(function(data) { csProducts = data; })
    .catch(function() {});
}

function csEnrich(item) {
  var p = csProducts.find(function(p) { return p.id === item.id; });
  if (!p) return item;
  return Object.assign({}, item, {
    name : p.item_name,
    brand: p.brand,
    emoji: p.emoji  || item.emoji || '👗',
    img  : p.img_src || item.img,
  });
}

/* ── Toggle sidebar open / close ─────────────────────── */

function toggleCart() {
  var side    = document.getElementById('cartSide');
  var overlay = document.getElementById('cartOverlay');
  if (!side) return;

  var opening = !side.classList.contains('open');

  if (opening) {
    renderCartSide();          /* always refresh before opening */
  }

  side.classList.toggle('open', opening);
  if (overlay) overlay.classList.toggle('open', opening);
}

/* ── Build and inject sidebar content ───────────────── */

function renderCartSide() {
  var wrap = document.getElementById('cartItemsWrap');
  var foot = document.getElementById('cartFoot');
  if (!wrap) return;

  var items = csGetItems();

  /* ── Empty state ── */
  if (items.length === 0) {
    wrap.innerHTML = '<p class="cs-empty">Зөвшөөрөгдсөн бараа байхгүй байна</p>';
    if (foot) foot.innerHTML = '';
    updateCartBadge();
    return;
  }

  /* ── Item cards ── */
  wrap.innerHTML = items.map(function(raw) {
    var item  = csEnrich(raw);
    var grad  = CS_GRADIENTS[(item.id || 0) % CS_GRADIENTS.length];
    var emoji = item.emoji || '👗';
    var days  = item.selectedDays || 1;
    var total = (item.basePrice || 0) * days;

    var figHTML = item.img
      ? '<figure class="ci-fig"><img src="/public/source/' + item.img + '" alt="' + (item.name || '') + '" loading="lazy"></figure>'
      : '<figure class="ci-fig" style="background:' + grad + '">' + emoji + '</figure>';

    /* Date line only when both dates exist */
    var dateLine = (item.startDate && item.endDate)
      ? '<p class="ci-dates">📅 ' + item.startDate + ' → ' + item.endDate + ' (' + days + ' өдөр)</p>'
      : '';

    return (
      '<article class="ci">' +
        figHTML +
        '<section class="ci-info">' +
          '<p class="ci-name">'   + (item.name  || '') + '</p>' +
          '<p class="ci-meta">'   + (item.brand || '') + ' · ' + (item.size || '') + ' · ' + csFmt(item.basePrice) + '/өдөр</p>' +
          dateLine +
          '<p class="ci-status">✅ Зөвшөөрөгдсөн · ⚡</p>' +
          '<p class="ci-total">'  + csFmt(total) + '</p>' +
          '<button class="ci-rm" onclick="rmCartSide(' + item.id + ')">✕ Хасах</button>' +
        '</section>' +
      '</article>'
    );
  }).join('');

  /* ── Footer totals ── */
  var subtotal = items.reduce(function(sum, item) {
    return sum + (item.basePrice || 0) * (item.selectedDays || 1);
  }, 0);
  var advance = Math.round(subtotal * 0.3);

  if (foot) {
    foot.innerHTML =
      '<footer class="cs-foot">' +
        '<dl class="cs-totals">' +
          '<dt>Түрээсийн дүн</dt><dd>' + csFmt(subtotal) + '</dd>' +
          '<dt class="cs-muted">Урьдчилгаа (30%)</dt><dd class="cs-muted">' + csFmt(advance) + '</dd>' +
        '</dl>' +
        '<p class="cs-grand"><span>Нийт</span><strong>' + csFmt(subtotal + advance) + '</strong></p>' +
        '<button class="btn-g cs-pay-btn" onclick="location.href=\'/public/html/cart.html\'">💳 Төлбөр төлөх →</button>' +
      '</footer>';
  }

  updateCartBadge();
}

/* ── Remove one item ─────────────────────────────────── */

function rmCartSide(id) {
  csSave(csGetItems().filter(function(i) { return i.id !== id; }));
  renderCartSide();
}

/* ── Badge count on cart icon ────────────────────────── */

function updateCartBadge() {
  var badge = document.getElementById('cartBadge');
  if (!badge) return;
  var count = csGetItems().length;
  badge.textContent    = count;
  badge.style.display  = count > 0 ? 'flex' : 'none';
}

/* ── Wire cart icon click on page load ───────────────── */

document.addEventListener('DOMContentLoaded', function() {

  csLoadProducts();

  /* Intercept the cart icon — open sidebar instead of navigating */
  var cartIcon = document.querySelector('.cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', function(e) {
      e.preventDefault();
      toggleCart();
    });
  }

  /* Escape key closes sidebar */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var side = document.getElementById('cartSide');
      var overlay = document.getElementById('cartOverlay');
      if (side && side.classList.contains('open')) {
        side.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
      }
    }
  });

  /* Show initial badge count */
  updateCartBadge();
});
