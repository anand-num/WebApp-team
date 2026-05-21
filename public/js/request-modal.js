/* ══════════════════════════════════════════════════════════
   RENTFIT — request-modal.js
   Түрээсийн хүсэлтийн modal — CART-д хадгална
══════════════════════════════════════════════════════════ */

var _rmProduct = null;
var _currentUserId = null;

function getCurrentUser() {
  var user = localStorage.getItem('currentUser');
  if (user) {
    var userData = JSON.parse(user);
    _currentUserId = userData.user_id || userData.id;
    return userData;
  }
  return null;
}

function openRequestModal(product) {
  _rmProduct = product;
  
  var currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Та эхлээд нэвтрэх шаардлагатай');
    window.location.href = '/login.html';
    return;
  }

  var nameEl = document.getElementById('rm-name');
  var brandEl = document.getElementById('rm-brand');
  var priceEl = document.getElementById('rm-price');
  var emojiEl = document.getElementById('rm-emoji');

  if (nameEl) nameEl.textContent = product.item_name || product.name || '—';
  if (brandEl) brandEl.textContent = product.brand || '—';
  if (priceEl) {
    var price = parseInt(String(product.price || product.basePrice || 0).replace(/[^0-9]/g, ''), 10) || 0;
    priceEl.textContent = price.toLocaleString() + '₮/өдөр';
  }
  if (emojiEl) emojiEl.textContent = product.emoji || '👗';

  var sizes = Array.isArray(product.sizes) ? product.sizes
              : (product.size ? [product.size] : ['XS', 'S', 'M', 'L']);
  var rmSizes = document.getElementById('rmSizes');
  if (rmSizes) {
    rmSizes.innerHTML = sizes.map(function(s) {
      return '<button type="button" onclick="pickRmSize(\'' + s + '\')" data-s="' + s + '">' + s + '</button>';
    }).join('');
    document.getElementById('rmSize').value = sizes[0];
    var firstBtn = rmSizes.querySelector('button');
    if (firstBtn) firstBtn.classList.add('sel');
  }

  document.getElementById('rmFrom').value = '';
  document.getElementById('rmTo').value = '';
  document.getElementById('rmDays').textContent = '0 өдөр';
  document.getElementById('rmTotal').textContent = '0₮';

  document.getElementById('reqModal').classList.add('open');
}

function closeQM() {
  document.getElementById('reqModal').classList.remove('open');
}

function pickRmSize(size) {
  document.getElementById('rmSize').value = size;
  document.querySelectorAll('#rmSizes button').forEach(function(btn) {
    btn.classList.toggle('sel', btn.getAttribute('data-s') === size);
  });
}

function calcRmTotal() {
  if (!_rmProduct) return;

  var price = parseInt(String(_rmProduct.price || _rmProduct.basePrice || 0).replace(/[^0-9]/g, ''), 10) || 0;
  var from = document.getElementById('rmFrom').value;
  var to = document.getElementById('rmTo').value;

  if (!from || !to) {
    document.getElementById('rmDays').textContent = '0 өдөр';
    document.getElementById('rmTotal').textContent = '0₮';
    return;
  }

  var diff = new Date(to) - new Date(from);
  var days = Math.max(1, Math.round(diff / 86400000));

  document.getElementById('rmDays').textContent = days + ' өдөр';
  document.getElementById('rmTotal').textContent = (days * price).toLocaleString() + '₮';
}

/* ── CART-д хадгалах (SHOPPING CART) ─────────────────── */
async function submitRequest() {
  var from = document.getElementById('rmFrom').value;
  var to = document.getElementById('rmTo').value;
  var size = document.getElementById('rmSize').value;

  if (!from || !to) {
    alert('Эхлэх болон дуусах огноог сонгоно уу.');
    return;
  }
  if (new Date(to) <= new Date(from)) {
    alert('Дуусах огноо эхлэх огноогоос хойш байх ёстой.');
    return;
  }

  var currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Та эхлээд нэвтрэх шаардлагатай');
    return;
  }

  var days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000));
  var price = parseInt(String(_rmProduct ? (_rmProduct.price || _rmProduct.basePrice || 0) : 0).replace(/[^0-9]/g, ''), 10) || 0;
  var totalPrice = price * days;

  var cartData = {
    productId: _rmProduct.id || _rmProduct.product_id,
    startDate: from,
    endDate: to,
    days: days,
    size: size,
    totalPrice: totalPrice,
    dailyRate: price
  };

  try {
    // Add to CART (not directly to rented_items)
    const response = await fetch(`/api/users/${currentUser.user_id}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cartData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Алдаа гарлаа');
    }

    closeQM();

    var toast = document.getElementById('req-toast');
    if (toast) {
      toast.textContent = '✓ Сагсанд нэмэгдлээ!';
      toast.classList.add('show');
      setTimeout(function() { toast.classList.remove('show'); }, 3000);
    } else {
      alert('✓ Сагсанд нэмэгдлээ!');
    }

    // Show cart option
    if (confirm('Сагс руу очих уу?')) {
      window.location.href = '/cart.html';
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Алдаа гарлаа: ' + error.message);
  }
}