/* ══════════════════════════════════════════════════════════
   RENTFIT — request-modal.js
   Түрээсийн хүсэлтийн modal — Хэрэглэгчийн cart-д хадгална
   WITH DATE RESTRICTIONS (No past dates allowed)
══════════════════════════════════════════════════════════ */

var _rmProduct = null;
var _currentUserId = null;

// ✅ Helper function to open login modal (from auth.js)
function openLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.classList.add('open');
  }
}

// Get current user from localStorage (set during login)
function getCurrentUser() {
  var userJson = localStorage.getItem('rf_user');
  console.log('localStorage currentUser:', userJson);
  
  if (!userJson) {
    console.log('All localStorage keys:', Object.keys(localStorage));
    return null;
  }
  
  try {
    var userData = JSON.parse(userJson);
    _currentUserId = userData.user_id || userData.id || userData._id;
    console.log('Extracted user_id:', _currentUserId);
    
    if (!_currentUserId) {
      console.error('No user_id found in user data:', userData);
      return null;
    }
    
    return userData;
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
}

// Set minimum date to today for both date inputs
function setDateRestrictions() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const fromInput = document.getElementById('rmFrom');
  const toInput = document.getElementById('rmTo');
  
  if (fromInput) {
    fromInput.min = todayStr;
  }
  
  if (toInput) {
    toInput.min = todayStr;
  }
}

// Set end date minimum based on start date selection
function updateEndDateMin() {
  const fromInput = document.getElementById('rmFrom');
  const toInput = document.getElementById('rmTo');
  
  if (fromInput && fromInput.value) {
    toInput.min = fromInput.value;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    toInput.min = `${year}-${month}-${day}`;
  }
}

function openRequestModal(product) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Та эхлээд нэвтрэх шаардлагатай');
    openLoginModal(); // ✅ Opens the modal from auth.js
    return;
  }

  _rmProduct = product;

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

  // Reset date inputs
  document.getElementById('rmFrom').value = '';
  document.getElementById('rmTo').value = '';
  document.getElementById('rmDays').textContent = '0 өдөр';
  document.getElementById('rmTotal').textContent = '0₮';
  
  // Apply date restrictions to prevent past dates
  setDateRestrictions();

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
  
  // Update end date minimum when start date changes
  updateEndDateMin();

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

/* ── Add to Cart (Сагсанд нэмэх) ─────────────────────── */
async function submitRequest() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Та эхлээд нэвтрэх шаардлагатай');
    openLoginModal(); // ✅ Opens the modal from auth.js
    return;
  }
  
  var starts_at = document.getElementById('rmFrom').value;
  var expires_at = document.getElementById('rmTo').value;
  var size = document.getElementById('rmSize').value;

  // Date validation
  if (!starts_at || !expires_at) {
    alert('Эхлэх болон дуусах огноог сонгоно уу.');
    return;
  }
  if (new Date(expires_at) <= new Date(starts_at)) {
    alert('Дуусах огноо эхлэх огноогоос хойш байх ёстой.');
    return;
  }

  if (!_currentUserId) {
    alert('Хэрэглэгчийн ID олдсонгүй');
    openLoginModal(); // ✅ Try to login again
    return;
  }

  var product_id = _rmProduct.id || _rmProduct.product_id || _rmProduct.item_id;
  
  var cartData = {
    product_id: product_id,
    starts_at: starts_at,
    expires_at: expires_at,
    status: 'pending'
  };

  const API_BASE_URL = 'http://localhost:3000';
  const url = `${API_BASE_URL}/api/users/${_currentUserId}/cart/add`;
  
  console.log('Sending to API:', { url, data: cartData });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cartData)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('Server error response:', text);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Success:', result);
    
    closeQM();

    var toast = document.getElementById('req-toast');
    if (toast) {
      toast.textContent = '✓ Сагсанд нэмэгдлээ!';
      toast.classList.add('show');
      setTimeout(function() { toast.classList.remove('show'); }, 3000);
    } else {
      alert('✓ Сагсанд нэмэгдлээ!');
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Алдаа гарлаа: ' + error.message);
  }
}