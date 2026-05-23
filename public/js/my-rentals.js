/* ══════════════════════════════════════════════════════════
   my-rentals.js — MongoDB хувилбар (Ажиллаж буй API-тай холбогдох)
══════════════════════════════════════════════════════════ */

const API = 'http://localhost:3000/api';

// ── Өгөгдөл ──────────────────────────────────────────────
var rentals = [];
var userListings = [];
var publishRequests = [];
var currentListingFilter = 'all';
var selectedImageFile = null;
var selectedImagePreview = '';

// ── DB-с өгөгдөл татах ────────────────────────────────────

async function loadRentalsFromDB() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return [];
  var user;
  try { user = JSON.parse(raw); } catch (_) { return []; }
  if (!user?.user_id) return [];

  try {
    var res = await fetch(`${API}/users/${user.user_id}/rentals`);
    if (!res.ok) return [];
    var data = await res.json();
    console.log('✅ Rentals loaded:', data.length);
    return data;
  } catch (e) {
    console.error('Rentals татаж чадсангүй:', e);
    return [];
  }
}

async function loadListingsFromDB() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return [];
  var user;
  try { user = JSON.parse(raw); } catch (_) { return []; }
  if (!user?.user_id) return [];

  try {
    var res = await fetch(`${API}/users/${user.user_id}/listings`);
    if (!res.ok) return [];
    var data = await res.json();
    return data;
  } catch (e) {
    console.error('Listings татаж чадсангүй:', e);
    return [];
  }
}

async function loadPublishRequestsFromDB() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return [];
  var user;
  try { user = JSON.parse(raw); } catch (_) { return []; }
  if (!user?.user_id) return [];

  try {
    var res = await fetch(`${API}/users/${user.user_id}/publish-requests`);
    if (!res.ok) return [];
    var data = await res.json();
    return data;
  } catch (e) {
    console.error('Publish requests татаж чадсангүй:', e);
    return [];
  }
}

function getImgHtml(img, fallbackName) {
  if (!img) return '<div class="p-order-emoji">👗</div>';
  var src = img.startsWith('http') || img.startsWith('data:') ? img : '/public/source/' + img;
  return '<img class="p-order-img" src="' + src + '" alt="' + fallbackName + '" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'"><div class="p-order-emoji" style="display:none">👗</div>';
}

// ── Image Upload ──────────────────────────────────────────

function setupImageUpload() {
  var uploadArea = document.getElementById('image-upload-area');
  var fileInput = document.getElementById('listing-image-input');
  var previewImg = document.getElementById('preview-image');
  var placeholder = document.getElementById('upload-placeholder');
  var removeBtn = document.getElementById('btn-remove-image');

  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener('click', function() {
    fileInput.click();
  });

  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) handleImageFile(e.target.files[0]);
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      selectedImageFile = null;
      selectedImagePreview = '';
      previewImg.style.display = 'none';
      placeholder.style.display = 'block';
      removeBtn.style.display = 'none';
      fileInput.value = '';
    });
  }
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Зөвхөн зураг оруулна уу!', 'red');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Зураг 5MB-аас бага байх ёстой!', 'red');
    return;
  }

  selectedImageFile = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    selectedImagePreview = e.target.result;
    var previewImg = document.getElementById('preview-image');
    var placeholder = document.getElementById('upload-placeholder');
    var removeBtn = document.getElementById('btn-remove-image');

    previewImg.src = selectedImagePreview;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

// ── Notification ──────────────────────────────────────────

async function loadAndShowNotifications() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }
  if (!user?.user_id) return;

  try {
    var res = await fetch(`${API}/users/${user.user_id}/notifications`);
    if (!res.ok) return;
    var notifs = await res.json();
    renderNotifBadge(notifs);
    renderNotifPopup(notifs);
  } catch (e) {
    console.error('Notification татаж чадсангүй:', e);
  }
}

function renderNotifBadge(notifs) {
  var unread = notifs.filter(function(n) { return !n.read; }).length;
  var badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (unread > 0) {
    badge.textContent = unread;
    badge.removeAttribute('hidden');
  } else {
    badge.setAttribute('hidden', '');
  }
}

function renderNotifPopup(notifs) {
  var list = document.getElementById('notif-popup-list');
  if (!list) return;

  if (!notifs || notifs.length === 0) {
    list.innerHTML = '<div class="notif-empty">Мэдэгдэл байхгүй</div>';
    return;
  }

  list.innerHTML = notifs.map(function(n) {
    return '<div class="notif-item ' + (n.read ? 'read' : 'unread') + '">' +
      '<div class="notif-msg">' + n.message + '</div>' +
      '<div class="notif-time">' + (n.createdAt ? new Date(n.createdAt).toLocaleDateString('mn-MN') : '') + '</div>' +
      '</div>';
  }).join('');
}

async function markAllRead() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }

  try {
    await fetch(`${API}/users/${user.user_id}/notifications/read`, {
      method: 'PUT'
    });
    var badge = document.getElementById('notif-badge');
    if (badge) badge.setAttribute('hidden', '');
    showToast('Бүгдийг уншсан болголоо ✓', 'green');
  } catch (e) {
    console.error(e);
  }
}

function toggleInfoPopup() {
  var popup = document.getElementById('info-popup');
  var overlay = document.getElementById('info-overlay');
  if (!popup) return;
  var isOpen = popup.classList.contains('open');
  if (isOpen) {
    popup.classList.remove('open');
    overlay.classList.remove('open');
  } else {
    popup.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeInfoPopup() {
  var popup = document.getElementById('info-popup');
  var overlay = document.getElementById('info-overlay');
  if (popup) popup.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ── Таб солих ─────────────────────────────────────────────

function setupTabs() {
  var tabButtons = document.querySelectorAll('.ptab');
  tabButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      tabButtons.forEach(function(btn) { btn.classList.remove('active'); });
      var panels = ['panel-notif', 'panel-history', 'panel-listings'];
      panels.forEach(function(id) {
        var p = document.getElementById(id);
        if (p) p.setAttribute('hidden', '');
      });
      button.classList.add('active');
      var target = document.getElementById(button.getAttribute('aria-controls'));
      if (target) target.removeAttribute('hidden');
    });
  });
}

// ── Идэвхтэй захиалгууд (Active Rentals) ───────────────────

function renderActiveRentals() {
  var container = document.getElementById('active-list');
  if (!container) {
    console.log('active-list container not found');
    return;
  }

  // Filter for active rentals (paid status)
  var activeItems = rentals.filter(function(r) {
    return r.status === 'paid';
  });

  console.log('Active rentals to render:', activeItems.length);

  if (activeItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Идэвхтэй захиалга байхгүй</p></div>';
    return;
  }

  container.innerHTML = activeItems.map(function(r) {
    // Calculate days left
    var daysLeft = '';
    if (r.expires_at) {
      var end = new Date(r.expires_at);
      var now = new Date();
      var diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      daysLeft = diff > 0
        ? '<span class="days-left green">' + diff + ' өдөр үлдсэн</span>'
        : '<span class="days-left red">Хугацаа дууссан</span>';
    }

    var actionBtn = '<button class="btn-sm success btn-confirm" data-id="' + r.rental_id + '">Хүргэлт баталгаажуулах ✓</button>';

    var imgHtml = getImgHtml(r.img, r.name);

    return '<div class="p-order" data-rental-id="' + r.rental_id + '">' +
      imgHtml +
      '<div class="p-order-info">' +
      '<p class="p-order-name">' + (r.name || 'Бүтээгдэхүүн') + '</p>' +
      '<p class="p-order-meta">' + (r.brand || '') + ' · ' + (r.size || 'M') + ' · ' + (r.starts_at || '—') + ' – ' + (r.expires_at || '—') + '</p>' +
      daysLeft +
      '</div>' +
      '<strong class="p-order-total">' + fmt(r.total_price || r.price) + '</strong>' +
      '<div class="p-order-right">' +
      '<span class="p-order-status" style="color:#27ae60;font-weight:600;">Төлөгдсөн</span>' +
      actionBtn +
      '</div>' +
      '</div>';
  }).join('');

  document.querySelectorAll('.btn-confirm').forEach(function(btn) {
    btn.addEventListener('click', function() { 
      console.log('Confirm button clicked for ID:', btn.getAttribute('data-id'));
      confirmDelivery(btn.getAttribute('data-id')); 
    });
  });
}

// ── Өмнөх захиалгууд (History Rentals) ──────────────────────

function renderHistoryRentals() {
  var container = document.getElementById('history-list');
  if (!container) return;

  // Filter for completed/done rentals
  var historyItems = rentals.filter(function(r) {
    return r.status === 'done' || r.status === 'completed' || r.status === 'returned' || r.status === 'cancelled';
  });

  console.log('History rentals to render:', historyItems.length);

  if (historyItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🕐</div><p>Захиалгын түүх байхгүй</p></div>';
    return;
  }

  container.innerHTML = historyItems.map(function(r) {
    var imgHtml = getImgHtml(r.img, r.name);

    // Add review button only for 'done' status
    var reviewBtn = '';
    if (r.status === 'done' && !r.reviewed) {
      reviewBtn = '<button class="btn-sm success btn-review" data-id="' + r.rental_id + '">★ Сэтгэгдэл бичих</button>';
    }

    return '<div class="p-order">' +
      imgHtml +
      '<div class="p-order-info">' +
      '<p class="p-order-name">' + (r.name || 'Бүтээгдэхүүн #' + r.product_id) + '</p>' +
      '<p class="p-order-meta">' + (r.brand || '') + ' · ' + (r.size || 'M') + ' · ' + (r.starts_at || '—') + ' – ' + (r.expires_at || '—') + '</p>' +
      '</div>' +
      '<strong class="p-order-total">' + fmt(r.total_price || r.price) + '</strong>' +
      '<div class="p-order-right">' +
      '<span class="p-order-status" style="color:#95a5a6;font-weight:600;">Дууссан</span>' +
      reviewBtn +
      '</div>' +
      '</div>';
  }).join('');

  document.querySelectorAll('.btn-review').forEach(function(btn) {
    btn.addEventListener('click', function() { 
      openReviewModal(btn.getAttribute('data-id')); 
    });
  });
}
// ── Миний зарууд ──────────────────────────────────────────

function renderListings(filter) {
  filter = filter || 'all';
  currentListingFilter = filter;

  var container = document.getElementById('listings-list');
  if (!container) return;

  var filtered = filter === 'all'
    ? userListings
    : userListings.filter(function(l) { return l.status === filter; });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Зар байхгүй байна</p></div>';
    return;
  }

  container.innerHTML = filtered.map(function(l) {
    var color = l.status === 'published' ? '#27ae60' : (l.status === 'rejected' ? '#e74c3c' : '#f39c12');
    var label = l.status === 'published' ? '✅ Нийтлэгдсэн' : (l.status === 'rejected' ? '❌ Буцаагдсан' : '⏳ Хүлээгдэж буй');
    var imgHtml = getImgHtml(l.img_src, l.item_name);

    return '<div class="p-order">' +
      imgHtml +
      '<div class="p-order-info">' +
      '<p class="p-order-name">' + (l.item_name || l.name) + '</p>' +
      '<p class="p-order-meta">' + (l.price || '') + '/өдөр · ' + (l.sizes ? l.sizes.join(', ') : '') + '</p>' +
      '</div>' +
      '<div class="p-order-right">' +
      '<span class="p-order-status" style="color:' + color + ';font-weight:600;">' + label + '</span>' +
      '<button class="btn-sm outline">Засах</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

function renderPublishRequests() {
  var container = document.getElementById('publish-requests-list');
  var section = document.getElementById('publish-requests-section');
  if (!container) return;

  if (!publishRequests || publishRequests.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  if (section) section.style.display = 'block';

  container.innerHTML = publishRequests.map(function(req) {
    var color = req.status === 'pending' ? '#f39c12' : (req.status === 'approved' ? '#27ae60' : '#e74c3c');
    var label = req.status === 'pending' ? '⏳ Хүлээгдэж буй' : (req.status === 'approved' ? '✅ Баталгаажсан' : '❌ Буцаагдсан');
    var imgHtml = getImgHtml(req.img, req.name);

    return '<div class="p-order">' +
      imgHtml +
      '<div class="p-order-info">' +
      '<p class="p-order-name">' + (req.name || '') + '</p>' +
      '<p class="p-order-meta">' + (req.brand || '') + ' · ' + (req.price || '') + '</p>' +
      '</div>' +
      '<div class="p-order-right">' +
      '<span class="p-order-status" style="color:' + color + ';font-weight:600;">' + label + '</span>' +
      '</div>' +
      '</div>';
  }).join('');
}

function setupListingTabs() {
  document.querySelectorAll('.ltab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.ltab').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderListings(btn.getAttribute('data-status'));
    });
  });
}

// ── Захиалгын үйлдлүүд ────────────────────────────────────

async function updateRentalStatus(rentalId, status) {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }
  if (!user?.user_id) return;

  try {
    await fetch(`${API}/users/${user.user_id}/rentals/${rentalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    });
  } catch (e) {
    console.error('Rental status update error:', e);
  }
}

async function confirmDelivery(id) {
  console.log('Confirming delivery for rental:', id);
  await updateRentalStatus(id, 'active');
  rentals = await loadRentalsFromDB();
  renderActiveRentals();
  renderHistoryRentals();
  updateStats();
  showToast('Хүргэлт баталгаажлаа!', 'green');
}

function updateStats() {
  var activeCount = rentals.filter(function(r) {
    return r.status === 'paid';
  }).length;

  var el1 = document.getElementById('stat-active');
  var el2 = document.getElementById('stat-total');
  var el3 = document.getElementById('stat-listings');
  if (el1) el1.textContent = activeCount;
  if (el2) el2.textContent = rentals.length;
  if (el3) el3.textContent = userListings.length;
}

// ── Сэтгэгдэл modal ───────────────────────────────────────

var selectedStars = 0;
var currentReviewId = null;

function openReviewModal(id) {
  currentReviewId = id;
  selectedStars = 0;
  updateStarDisplay();
  var c = document.getElementById('review-comment');
  if (c) c.value = '';
  document.getElementById('review-modal').classList.add('open');
}

function closeReviewModal() {
  document.getElementById('review-modal').classList.remove('open');
}

function updateStarDisplay() {
  document.querySelectorAll('.star-btn').forEach(function(btn, i) {
    i < selectedStars ? btn.classList.add('filled') : btn.classList.remove('filled');
  });
}

function setupStarButtons() {
  document.querySelectorAll('.star-btn').forEach(function(btn, i) {
    btn.addEventListener('click', function() {
      selectedStars = i + 1;
      updateStarDisplay();
    });
  });
}


async function submitReview() {
  var comment = document.getElementById('review-comment').value.trim();
  if (selectedStars === 0) { showToast('Одны үнэлгээ сонгоно уу!', 'red'); return; }
  if (!comment) { showToast('Сэтгэгдэл бичнэ үү!', 'red'); return; }

  var raw = localStorage.getItem('rf_user');
  if (!raw) { showToast('Нэвтэрсэн байх шаардлагатай!', 'red'); return; }
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }
  if (!user?.user_id) return;

  try {
    const response = await fetch(`${API}/users/${user.user_id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rental_id: currentReviewId,
        rating: selectedStars,
        comment: comment
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }

    // Update local data
    var r = rentals.find(function(x) { return x.rental_id === currentReviewId; });
    if (r) { 
      r.reviewed = true;
      r.review_rating = selectedStars;
      r.review_comment = comment;
    }

    closeReviewModal();
    renderHistoryRentals();
    showToast('Сэтгэгдэл амжилттай илгээгдлээ! ★', 'green');
    
  } catch (error) {
    console.error('Review submit error:', error);
    showToast('Сэтгэгдэл илгээхэд алдаа гарлаа!', 'red');
  }
}

function setupModalClose() {
  var modal = document.getElementById('review-modal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeReviewModal();
    });
  }
}

// ── Зар нэмэх форм ────────────────────────────────────────

function setupListingForm() {
  var addBtn = document.getElementById('btn-add-listing');
  var formWrap = document.getElementById('listing-form-wrap');
  var cancelBtn = document.getElementById('btn-cancel-listing');
  var submitBtn = document.getElementById('btn-submit-listing');

  if (!addBtn || !formWrap) return;

  addBtn.addEventListener('click', function() {
    formWrap.removeAttribute('hidden');
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      formWrap.setAttribute('hidden', '');
      resetListingForm();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', submitPublishRequest);
  }
}

function resetListingForm() {
  document.getElementById('l-name').value = '';
  document.getElementById('l-brand').value = '';
  document.getElementById('l-price').value = '';
  document.getElementById('l-size').value = '';
  document.getElementById('l-desc').value = '';
  document.getElementById('l-category').value = 'Cosplay';

  selectedImageFile = null;
  selectedImagePreview = '';
  var previewImg = document.getElementById('preview-image');
  var placeholder = document.getElementById('upload-placeholder');
  var removeBtn = document.getElementById('btn-remove-image');
  if (previewImg) previewImg.style.display = 'none';
  if (placeholder) placeholder.style.display = 'block';
  if (removeBtn) removeBtn.style.display = 'none';
  document.getElementById('listing-image-input').value = '';
}

async function submitPublishRequest() {
  var name = document.getElementById('l-name').value.trim();
  var brand = document.getElementById('l-brand').value.trim();
  var price = document.getElementById('l-price').value.trim();
  var size = document.getElementById('l-size').value.trim();
  var desc = document.getElementById('l-desc').value.trim();
  var category = document.getElementById('l-category').value;

  if (!name || !brand || !price) {
    showToast('Бүх * талбарыг бөглөнө үү!', 'red');
    return;
  }
  if (!selectedImageFile) {
    showToast('Зураг оруулна уу!', 'red');
    return;
  }

  var raw = localStorage.getItem('rf_user');
  if (!raw) { showToast('Нэвтэрсэн байх шаардлагатай!', 'red'); return; }
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }
  if (!user?.user_id) return;

  try {
    showToast('Зураг upload хийж байна...', '');

    var formData = new FormData();
    formData.append('image', selectedImageFile);

    var uploadRes = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      showToast('Зураг upload хийж чадсангүй!', 'red');
      return;
    }

    var uploadData = await uploadRes.json();
    var imgFilename = uploadData.url;

    var requestData = {
      name: name,
      brand: brand,
      price: price,
      size: size || 'S/M/L',
      description: desc,
      category: category,
      img: imgFilename
    };

    var res = await fetch(`${API}/users/${user.user_id}/publish-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!res.ok) {
      showToast('Илгээхэд алдаа гарлаа!', 'red');
      return;
    }

    var result = await res.json();

    publishRequests.push(result.request || result);

    document.getElementById('listing-form-wrap').setAttribute('hidden', '');
    resetListingForm();
    renderPublishRequests();
    showToast('Зар илгээгдлээ! Admin хянаж баталгаажуулна.', 'green');

  } catch (e) {
    console.error('Publish request error:', e);
    showToast('Сүлжээний алдаа!', 'red');
  }
}

// ── Профайл ачаалах ───────────────────────────────────────

function loadUserProfile() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var u;
  try { u = JSON.parse(raw); } catch (_) { return; }
  if (!u) return;

  var name = u.full_name || u.username || 'Хэрэглэгч';
  var email = u.email || '';
  var phone = u.phone || '';

  var av = document.getElementById('profile-av');
  if (av) av.textContent = (name.charAt(0) || '?').toUpperCase();

  var nameEl = document.getElementById('profile-name');
  var emailEl = document.getElementById('profile-email');
  var metaEl = document.getElementById('profile-meta');
  if (nameEl) nameEl.textContent = name;
  if (emailEl) emailEl.textContent = email;
  if (metaEl) metaEl.textContent = '📞 ' + (phone || '—') + ' · 📍 Улаанбаатар';
}

// ── Тусламжийн функцүүд ───────────────────────────────────

function fmt(n) {
  if (!n) return '0₮';
  if (typeof n === 'string') n = parseInt(n.replace(/[^0-9]/g, '')) || 0;
  return Number(n).toLocaleString() + '₮';
}

function showToast(msg, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast';
  if (type) toast.classList.add(type);
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ── CSS inject ────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById('my-rentals-styles')) return;

  var style = document.createElement('style');
  style.id = 'my-rentals-styles';
  style.textContent = `
    .notif-icon-btn {
      position: relative; background: none; border: none;
      cursor: pointer; font-size: 1.2rem; padding: 4px;
    }
    .notif-badge {
      position: absolute; top: -4px; right: -4px;
      background: red; color: white; border-radius: 99px;
      font-size: 10px; padding: 1px 5px; font-weight: 600;
    }
    .notif-overlay {
      display: none; position: fixed; inset: 0; z-index: 99;
    }
    .notif-overlay.open { display: block; }
    .notif-popup {
      display: none; position: fixed; top: 80px; left: 50%;
      transform: translateX(-50%); width: 340px; max-width: 90vw;
      background: var(--bg, #fff); border: 1px solid var(--border, #eee);
      border-radius: 12px; z-index: 100;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden;
    }
    .notif-popup.open { display: block; }
    .notif-popup-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; border-bottom: 1px solid var(--border, #eee);
      font-weight: 600;
    }
    .notif-popup-list { max-height: 300px; overflow-y: auto; }
    .notif-item {
      padding: 12px 16px; border-bottom: 1px solid var(--border, #eee);
    }
    .notif-item.unread { background: var(--bg-accent, #f9f6f1); }
    .notif-msg { font-size: .85rem; margin-bottom: 4px; }
    .notif-time { font-size: .7rem; color: var(--muted, #999); }
    .notif-empty { padding: 24px; text-align: center; color: var(--muted, #999); }
    .listing-tabs {
      display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .ltab {
      padding: 6px 14px; border-radius: 99px;
      border: 1px solid var(--border, #eee);
      background: none; cursor: pointer; font-size: .8rem;
    }
    .ltab.active {
      background: var(--gold, #c9a84c); color: #fff;
      border-color: var(--gold, #c9a84c);
    }
    .days-left {
      display: inline-block; font-size: .75rem; margin-top: 4px;
      padding: 2px 8px; border-radius: 99px;
    }
    .days-left.green { background: #e6f9ee; color: #1a7a3c; }
    .days-left.red { background: #fde8e8; color: #b91c1c; }
    .image-upload-area {
      border: 2px dashed var(--border);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
    }
    .p-order-img {
      object-fit: cover;
      width: 60px;
      height: 60px;
      border-radius: 8px;
    }
    .p-order-emoji {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: var(--bg-accent);
      border-radius: 8px;
      font-size: 1.5rem;
    }
  `;
  document.head.appendChild(style);
}

// ── Эхлүүлэх ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Loading my-rentals page...');
  
  injectStyles();

  rentals = await loadRentalsFromDB();
  userListings = await loadListingsFromDB();
  publishRequests = await loadPublishRequestsFromDB();

  console.log('Final rentals count:', rentals.length);

  loadUserProfile();
  setupTabs();
  setupImageUpload();
  renderActiveRentals();
  renderHistoryRentals();
  renderListings('all');
  renderPublishRequests();
  setupListingTabs();
  updateStats();
  setupStarButtons();
  setupModalClose();
  setupListingForm();
  loadAndShowNotifications();

  // Handle image load errors
  document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('p-order-img')) {
      e.target.style.display = 'none';
      var emoji = document.createElement('div');
      emoji.className = 'p-order-emoji';
      emoji.textContent = '👗';
      e.target.parentNode.insertBefore(emoji, e.target.nextSibling);
    }
  }, true);
});