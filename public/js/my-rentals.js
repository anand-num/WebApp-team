/* ══════════════════════════════════════════════════════════
   my-rentals.js — Зөвхөн DB хувилбар + Publish Requests + Image Upload
══════════════════════════════════════════════════════════ */

const API = 'http://localhost:3000/api';

// ── Өгөгдөл ──────────────────────────────────────────────
var rentals      = [];
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
    var res = await fetch(API + '/users/' + user.user_id + '/rentals');
    if (!res.ok) return [];
    var data = await res.json();
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
    var res = await fetch(API + '/users/' + user.user_id + '/listings');
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
    var res = await fetch(API + '/users/' + user.user_id + '/publish-requests');
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
  var src = img.startsWith('http') ? img : '/public/source/' + img;
  return '<img class="p-order-img" src="' + src + '" alt="' + fallbackName + '" data-fallback="emoji">';
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

  uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--gold)';
    uploadArea.style.background = 'var(--bg-accent)';
  });

  uploadArea.addEventListener('dragleave', function() {
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'transparent';
  });

  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'transparent';
    var files = e.dataTransfer.files;
    if (files.length > 0) handleImageFile(files[0]);
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

// ── Rental статус DB-д хадгалах ───────────────────────────

async function updateRentalStatus(rentalId, status) {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }
  if (!user?.user_id) return;

  try {
    await fetch(API + '/users/' + user.user_id + '/rentals/' + rentalId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status })
    });
  } catch (e) {
    console.error('Rental статус шинэчлэх алдаа:', e);
  }
}

// ── Notification ──────────────────────────────────────────

async function loadAndShowNotifications() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }
  if (!user?.user_id) return;

  try {
    var res = await fetch(API + '/users/' + user.user_id + '/notifications');
    if (!res.ok) return;
    var notifs = await res.json();
    renderNotifBadge(notifs);
    renderNotifPopup(notifs);
    showNotifOnLoad(notifs);
  } catch (e) {
    console.error('Notification татаж чадсангүй:', e);
  }
}

function renderNotifBadge(notifs) {
  var unread = notifs.filter(function(n) { return !n.read; }).length;
  var badge  = document.getElementById('notif-badge');
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

function showNotifOnLoad(notifs) {
  var unread = notifs.filter(function(n) { return !n.read; });
  if (unread.length > 0) {
    setTimeout(function() { toggleNotifPopup(); }, 800);
  }
}

function toggleInfoPopup() {
  var popup   = document.getElementById('info-popup');
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
  var popup   = document.getElementById('info-popup');
  var overlay = document.getElementById('info-overlay');
  if (popup)   popup.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function closeNotifPopup() {
  var popup   = document.getElementById('notif-popup');
  var overlay = document.getElementById('notif-overlay');
  if (popup)   popup.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

async function markAllRead() {
  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }

  try {
    await fetch(API + '/users/' + user.user_id + '/notifications/read', {
      method: 'PUT'
    });
    var badge = document.getElementById('notif-badge');
    if (badge) badge.setAttribute('hidden', '');
    document.querySelectorAll('.notif-item').forEach(function(i) {
      i.classList.remove('unread');
      i.classList.add('read');
    });
    showToast('Бүгдийг уншсан болголоо ✓', 'green');
  } catch (e) {
    console.error(e);
  }
}

// ── Статус тэмдэглэл ──────────────────────────────────────

function statusLabel(status) {
  var map = {
    delivery: 'Хүргэлтэнд',  pending:  'Хүлээгдэж буй',
    active:   'Хүлээн авсан', overdue:  'Хугацаа дууссан',
    done:     'Дууссан',      cancelled:'Цуцалсан'
  };
  return map[status] || status;
}

function statusColor(status) {
  var map = {
    delivery: 'green', pending:  'yellow',
    active:   'green', overdue:  'red',
    done:     'gray',  cancelled:'red'
  };
  return map[status] || 'gray';
}

function listingStatusLabel(status) {
  var map = {
    pending:   '⏳ Хүлээгдэж буй',
    published: '✅ Нийтлэгдсэн',
    rejected:  '❌ Буцаагдсан'
  };
  return map[status] || status;
}

function listingStatusColor(status) {
  var map = { pending: 'yellow', published: 'green', rejected: 'red' };
  return map[status] || 'gray';
}

function publishRequestStatusLabel(status) {
  var map = {
    pending:  '⏳ Хүлээгдэж буй',
    approved: '✅ Баталгаажсан',
    rejected: '❌ Буцаагдсан'
  };
  return map[status] || status;
}

function publishRequestStatusColor(status) {
  var map = { pending: 'yellow', approved: 'green', rejected: 'red' };
  return map[status] || 'gray';
}

// ── Таб солих ─────────────────────────────────────────────

function setupTabs() {
  var tabButtons = document.querySelectorAll('.ptab');
  tabButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      tabButtons.forEach(function(btn) { btn.classList.remove('active'); });
      ['panel-notif', 'panel-history', 'panel-listings'].forEach(function(id) {
        var p = document.getElementById(id);
        if (p) p.setAttribute('hidden', '');
      });
      button.classList.add('active');
      var target = document.getElementById(button.getAttribute('aria-controls'));
      if (target) target.removeAttribute('hidden');
    });
  });
}

function switchToTab(tabId) {
  var btn = document.getElementById(tabId);
  if (btn) btn.click();
}

// ── Идэвхтэй захиалгууд ───────────────────────────────────

function renderActiveRentals() {
  var container = document.getElementById('active-list');
  if (!container) return;

  var activeItems = rentals.filter(function(r) {
    return r.status === 'delivery' || r.status === 'pending' ||
           r.status === 'active'   || r.status === 'overdue';
  });

  if (activeItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Идэвхтэй захиалга байхгүй</p></div>';
    return;
  }

  container.innerHTML = activeItems.map(function(r) {
    var color = statusColor(r.status);
    var label = statusLabel(r.status);

    var daysLeft = '';
    if (r.status === 'active' || r.status === 'overdue') {
      var end  = new Date(r.endDate);
      var now  = new Date();
      var diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      daysLeft = diff > 0
        ? '<span class="days-left green">' + diff + ' өдөр үлдсэн</span>'
        : '<span class="days-left red">Хугацаа дууссан</span>';
    }

    var actionBtn = '';
    if (r.status === 'pending') {
      actionBtn = '<button class="btn-sm success btn-accept" data-id="' + r.id + '">✓ Зөвшөөрөх</button>';
    }
    if (r.status === 'delivery') {
      actionBtn = '<button class="btn-sm success btn-confirm" data-id="' + r.id + '">Хүргэлт баталгаажуулах ✓</button>';
    }
    if (r.status === 'active' || r.status === 'overdue') {
      actionBtn = '<button class="btn-sm danger btn-return" data-id="' + r.id + '">Буцааж өгсөн ✓</button>';
    }

    var imgHtml = getImgHtml(r.img, r.name);

    return '<div class="p-order">' +
      imgHtml +
      '<div class="p-order-info">' +
        '<p class="p-order-name">' + r.name + '</p>' +
        '<p class="p-order-meta">' + (r.brand || '') + ' · ' + (r.size || '') + ' · ' + r.startDate + ' – ' + r.endDate + ' · ' + (r.days || '') + ' өдөр</p>' +
        daysLeft +
      '</div>' +
      '<strong class="p-order-total">' + fmt(r.price) + '</strong>' +
      '<div class="p-order-right">' +
        '<span class="p-order-status ' + color + '">' + label + '</span>' +
        actionBtn +
      '</div>' +
      '</div>';
  }).join('');

  document.querySelectorAll('.btn-accept').forEach(function(btn) {
    btn.addEventListener('click', function() { acceptRequest(parseInt(btn.getAttribute('data-id'))); });
  });
  document.querySelectorAll('.btn-confirm').forEach(function(btn) {
    btn.addEventListener('click', function() { confirmDelivery(parseInt(btn.getAttribute('data-id'))); });
  });
  document.querySelectorAll('.btn-return').forEach(function(btn) {
    btn.addEventListener('click', function() { markReturned(parseInt(btn.getAttribute('data-id'))); });
  });
}

// ── Өмнөх захиалгууд ──────────────────────────────────────

function renderHistoryRentals() {
  var container = document.getElementById('history-list');
  if (!container) return;

  var historyItems = rentals.filter(function(r) {
    return r.status === 'done' || r.status === 'cancelled';
  });

  if (historyItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🕐</div><p>Захиалгын түүх байхгүй</p></div>';
    return;
  }

  container.innerHTML = historyItems.map(function(r) {
    var color  = statusColor(r.status);
    var label  = statusLabel(r.status);
    var reviewBtn = '';
    if (r.status === 'done' && !r.reviewed) {
      reviewBtn = '<button class="btn-sm success btn-review" data-id="' + r.id + '">★ Сэтгэгдэл бичих</button>';
    }
    if (r.status === 'done' && r.reviewed) {
      reviewBtn = '<span style="font-size:.7rem;color:var(--gold)">★ Бичигдсэн</span>';
    }

    var imgHtml = getImgHtml(r.img, r.name);

    return '<div class="p-order">' +
      imgHtml +
      '<div class="p-order-info">' +
        '<p class="p-order-name">' + r.name + '</p>' +
        '<p class="p-order-meta">' + (r.brand || '') + ' · ' + (r.size || '') + ' · ' + r.startDate + ' – ' + r.endDate + '</p>' +
      '</div>' +
      '<strong class="p-order-total">' + fmt(r.price) + '</strong>' +
      '<div class="p-order-right">' +
        '<span class="p-order-status ' + color + '">' + label + '</span>' +
        reviewBtn +
      '</div>' +
      '</div>';
  }).join('');

  document.querySelectorAll('.btn-review').forEach(function(btn) {
    btn.addEventListener('click', function() { openReviewModal(parseInt(btn.getAttribute('data-id'))); });
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
    var color = listingStatusColor(l.status);
    var label = listingStatusLabel(l.status);

    var imgHtml = getImgHtml(l.img, l.name);

    return '<div class="p-order">' +
      imgHtml +
      '<div class="p-order-info">' +
        '<p class="p-order-name">' + l.name + '</p>' +
        '<p class="p-order-meta">' + (l.price || '') + '/өдөр · ' + (l.size || '') + ' · 👁 ' + (l.views || 0) + ' үзэлт</p>' +
      '</div>' +
      '<div class="p-order-right">' +
        '<span class="p-order-status ' + color + '">' + label + '</span>' +
        '<button class="btn-sm outline">Засах</button>' +
      '</div>' +
      '</div>';
  }).join('');
}

// ── Publish Requests ──────────────────────────────────────

function renderPublishRequests() {
  var container = document.getElementById('publish-requests-list');
  var section   = document.getElementById('publish-requests-section');
  if (!container) return;

  if (!publishRequests || publishRequests.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  if (section) section.style.display = 'block';

  container.innerHTML = publishRequests.map(function(req) {
    var color = publishRequestStatusColor(req.status);
    var label = publishRequestStatusLabel(req.status);
    var imgHtml = getImgHtml(req.img, req.name);

    // Зөвхөн pending үед засах/устгах товч харуулна
    var actionBtns = '';
    if (req.status === 'pending') {
      actionBtns =
        '<button class="btn-sm outline btn-edit-req" data-id="' + req.request_id + '">✏️ Засах</button>' +
        '<button class="btn-sm danger btn-delete-req" data-id="' + req.request_id + '">🗑️ Устгах</button>';
    }

    return '<div class="p-order" id="req-' + req.request_id + '">' +
      imgHtml +
      '<div class="p-order-info">' +
        '<p class="p-order-name">' + req.name + '</p>' +
        '<p class="p-order-meta">' + (req.brand || '') + ' · ' + (req.price || '') + ' · ' + (req.size || '') + '</p>' +
        '<p style="font-size:0.7rem;color:var(--muted);">' +
          (req.createdAt ? new Date(req.createdAt).toLocaleDateString('mn-MN') : '') +
        '</p>' +
      '</div>' +
      '<div class="p-order-right" style="gap:6px;">' +
        '<span class="p-order-status ' + color + '">' + label + '</span>' +
        actionBtns +
      '</div>' +
      '</div>';
  }).join('');

  // Засах товч
  document.querySelectorAll('.btn-edit-req').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openEditRequestModal(btn.getAttribute('data-id'));
    });
  });

  // Устгах товч
  document.querySelectorAll('.btn-delete-req').forEach(function(btn) {
    btn.addEventListener('click', function() {
      deletePublishRequest(btn.getAttribute('data-id'));
    });
  });
}
function openEditRequestModal(requestId) {
  var req = publishRequests.find(function(r) { return r.request_id === requestId; });
  if (!req) return;

  // Modal байхгүй бол үүсгэх
  var existing = document.getElementById('edit-request-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id        = 'edit-request-modal';
  modal.className = 'modal-ov open';
  modal.innerHTML = `
    <div class="modal-card" style="max-width:480px;width:90%;">
      <button class="modal-x" onclick="document.getElementById('edit-request-modal').remove()">✕</button>
      <h3>✏️ Зар засах</h3>
      <div class="profile-form" style="margin-top:16px;">
        <div class="form-group">
          <label>Нэр *</label>
          <input type="text" id="edit-name" value="${req.name || ''}">
        </div>
        <div class="form-group">
          <label>Брэнд *</label>
          <input type="text" id="edit-brand" value="${req.brand || ''}">
        </div>
        <div class="form-group">
          <label>Үнэ *</label>
          <input type="text" id="edit-price" value="${req.price || ''}">
        </div>
        <div class="form-group">
          <label>Хэмжээ</label>
          <input type="text" id="edit-size" value="${req.size || ''}">
        </div>
        <div class="form-group">
          <label>Ангилал</label>
          <select id="edit-category" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);">
            <option value="Cosplay"     ${req.category==='Cosplay'     ?'selected':''}>Cosplay</option>
            <option value="Costume"     ${req.category==='Costume'     ?'selected':''}>Costume</option>
            <option value="Evening Wear"${req.category==='Evening Wear'?'selected':''}>Evening Wear</option>
            <option value="Cultural"    ${req.category==='Cultural'    ?'selected':''}>Cultural</option>
            <option value="Dance"       ${req.category==='Dance'       ?'selected':''}>Dance</option>
            <option value="Wedding"     ${req.category==='Wedding'     ?'selected':''}>Wedding</option>
            <option value="Other"       ${req.category==='Other'       ?'selected':''}>Бусад</option>
          </select>
        </div>
        <div class="form-group full">
          <label>Тайлбар</label>
          <textarea id="edit-desc" style="width:100%;min-height:80px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);">${req.description || ''}</textarea>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;">
        <button class="btn-g" onclick="saveEditRequest('${requestId}')">Хадгалах</button>
        <button class="btn-sm outline" onclick="document.getElementById('edit-request-modal').remove()">Болих</button>
      </div>
    </div>
  `;

  // Backdrop дарахад хаах
  modal.addEventListener('click', function(e) {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

async function saveEditRequest(requestId) {
  var name     = document.getElementById('edit-name').value.trim();
  var brand    = document.getElementById('edit-brand').value.trim();
  var price    = document.getElementById('edit-price').value.trim();
  var size     = document.getElementById('edit-size').value.trim();
  var desc     = document.getElementById('edit-desc').value.trim();
  var category = document.getElementById('edit-category').value;

  if (!name || !brand || !price) {
    showToast('Бүх * талбарыг бөглөнө үү!', 'red');
    return;
  }

  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }

  try {
    var res = await fetch(
      API + '/users/' + user.user_id + '/publish-request/' + requestId,
      {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, brand, price, size, description: desc, category })
      }
    );

    if (!res.ok) { showToast('Хадгалахад алдаа гарлаа!', 'red'); return; }

    // Local array шинэчлэх
    var req = publishRequests.find(function(r) { return r.request_id === requestId; });
    if (req) {
      req.name        = name;
      req.brand       = brand;
      req.price       = price;
      req.size        = size;
      req.description = desc;
      req.category    = category;
    }

    document.getElementById('edit-request-modal').remove();
    renderPublishRequests();
    showToast('Зар амжилттай засагдлаа ✓', 'green');

  } catch (e) {
    console.error('Edit error:', e);
    showToast('Сүлжээний алдаа!', 'red');
  }
}

async function deletePublishRequest(requestId) {
  if (!confirm('Энэ зарыг устгах уу?')) return;

  var raw = localStorage.getItem('rf_user');
  if (!raw) return;
  var user;
  try { user = JSON.parse(raw); } catch (_) { return; }

  try {
    var res = await fetch(
      API + '/users/' + user.user_id + '/publish-request/' + requestId,
      { method: 'DELETE' }
    );

    if (!res.ok) { showToast('Устгахад алдаа гарлаа!', 'red'); return; }

    // Local array-с хасах
    publishRequests = publishRequests.filter(function(r) {
      return r.request_id !== requestId;
    });

    renderPublishRequests();
    showToast('Зар устгагдлаа', 'green');

  } catch (e) {
    console.error('Delete error:', e);
    showToast('Сүлжээний алдаа!', 'red');
  }
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

function acceptRequest(id) {
  var r = rentals.find(function(x) { return x.id === id; });
  if (!r) return;
  r.status = 'delivery';
  updateRentalStatus(id, 'delivery');
  renderActiveRentals();
  updateStats();
  showToast('Хүсэлт зөвшөөрөгдлөө! 🛍', 'green');
}

function confirmDelivery(id) {
  var r = rentals.find(function(x) { return x.id === id; });
  if (!r) return;
  r.status = 'active';
  updateRentalStatus(id, 'active');
  renderActiveRentals();
  updateStats();
  showToast('Хүргэлт баталгаажлаа!', 'green');
}

function markReturned(id) {
  var r = rentals.find(function(x) { return x.id === id; });
  if (!r) return;
  r.status = 'done';
  updateRentalStatus(id, 'done');
  renderActiveRentals();
  renderHistoryRentals();
  updateStats();
  showToast('Буцааж өгснийг баталгаажлаа!', 'green');
  switchToTab('tab-history');
}

function checkOverdue() {
  var today = new Date().toISOString().split('T')[0];
  rentals.forEach(function(r) {
    if (r.status === 'active' && r.endDate < today) {
      r.status = 'overdue';
      updateRentalStatus(r.id, 'overdue');
    }
  });
}

function updateStats() {
  var activeCount = rentals.filter(function(r) {
    return r.status === 'delivery' || r.status === 'pending' ||
           r.status === 'active'   || r.status === 'overdue';
  }).length;

  var el1 = document.getElementById('stat-active');
  var el2 = document.getElementById('stat-total');
  var el3 = document.getElementById('stat-listings');
  if (el1) el1.textContent = activeCount;
  if (el2) el2.textContent = rentals.length;
  if (el3) el3.textContent = userListings.length;
}

// ── Сэтгэгдэл modal ───────────────────────────────────────

var selectedStars   = 0;
var currentReviewId = null;

function openReviewModal(id) {
  currentReviewId = id;
  selectedStars   = 0;
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

function submitReview() {
  var comment = document.getElementById('review-comment').value.trim();
  if (selectedStars === 0) { showToast('Одны үнэлгээ сонгоно уу!', 'red'); return; }
  if (!comment)            { showToast('Сэтгэгдэл бичнэ үү!', 'red');     return; }

  var r = rentals.find(function(x) { return x.id === currentReviewId; });
  if (r) { r.reviewed = true; }

  closeReviewModal();
  renderHistoryRentals();
  showToast('Сэтгэгдэл амжилттай илгээгдлээ! ★', 'green');
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
  var addBtn   = document.getElementById('btn-add-listing');
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
  var name     = document.getElementById('l-name').value.trim();
  var brand    = document.getElementById('l-brand').value.trim();
  var price    = document.getElementById('l-price').value.trim();
  var size     = document.getElementById('l-size').value.trim();
  var desc     = document.getElementById('l-desc').value.trim();
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

    // 1. Эхлээд зургийг upload хийх
    var formData = new FormData();
    formData.append('image', selectedImageFile);

    var uploadRes = await fetch(API + '/upload', {
      method: 'POST',
      body:   formData
    });

    if (!uploadRes.ok) {
      showToast('Зураг upload хийж чадсангүй!', 'red');
      return;
    }

    var uploadData = await uploadRes.json();
    var imgFilename = uploadData.url; // сервер хадгалсан нэр

    // 2. Publish request илгээх
    var requestData = {
      name:        name,
      brand:       brand,
      price:       Number(price).toLocaleString() + '₮',
      size:        size     || 'S/M/L',
      description: desc,
      category:    category,
      img:         imgFilename
    };

    var res = await fetch(API + '/users/' + user.user_id + '/publish-request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestData)
    });

    if (!res.ok) {
      showToast('Илгээхэд алдаа гарлаа!', 'red');
      return;
    }

    var result = await res.json();

    // 3. Local array-д нэмэх
    publishRequests.push(result);

    // 4. Form цэвэрлэх
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

  var name  = u.full_name || u.username || 'Хэрэглэгч';
  var email = u.email || '';
  var phone = u.phone || '';
  var city  = u.city  || 'Улаанбаатар';

  var av = document.getElementById('profile-av');
  if (av) av.textContent = (name.charAt(0) || '?').toUpperCase();

  var nameEl  = document.getElementById('profile-name');
  var emailEl = document.getElementById('profile-email');
  var metaEl  = document.getElementById('profile-meta');
  if (nameEl)  nameEl.textContent  = name;
  if (emailEl) emailEl.textContent = email;
  if (metaEl)  metaEl.textContent  = '📞 ' + (phone || '—') + ' · 📍 ' + city;

  var inpName  = document.getElementById('inp-name');
  var inpEmail = document.getElementById('inp-email');
  var inpPhone = document.getElementById('inp-phone');
  var inpCity  = document.getElementById('inp-city');
  if (inpName)  inpName.value  = name;
  if (inpEmail) inpEmail.value = email;
  if (inpPhone) inpPhone.value = phone;
  if (inpCity)  inpCity.value  = city;
}

// ── Тусламжийн функцүүд ───────────────────────────────────

function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

function showToast(msg, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = 'toast';
  if (type) toast.classList.add(type);
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ── CSS inject ────────────────────────────────────────────

function injectStyles() {
  var style = document.createElement('style');
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
    .notif-popup-header button {
      background: none; border: none; cursor: pointer; font-size: 1rem;
    }
    .notif-popup-list { max-height: 300px; overflow-y: auto; }
    .notif-item {
      padding: 12px 16px; border-bottom: 1px solid var(--border, #eee);
    }
    .notif-item.unread { background: var(--bg-accent, #f9f6f1); }
    .notif-msg  { font-size: .85rem; margin-bottom: 4px; }
    .notif-time { font-size: .7rem; color: var(--muted, #999); }
    .notif-empty { padding: 24px; text-align: center; color: var(--muted, #999); }
    .notif-popup-footer {
      padding: 10px 16px; border-top: 1px solid var(--border, #eee);
      text-align: center;
    }
    .notif-popup-footer button {
      background: none; border: none; cursor: pointer;
      font-size: .8rem; color: var(--muted, #999); text-decoration: underline;
    }
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
    .days-left.red   { background: #fde8e8; color: #b91c1c; }
    .image-upload-area:hover {
      border-color: var(--gold, #c9a84c) !important;
      background: var(--bg-accent, #f9f6f1) !important;
    }
    .p-order-img {
      object-fit: cover;
      width: 60px;
      height: 60px;
      border-radius: 8px;
    }
    .p-order-emoji {
      display: none;
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
  injectStyles();

  rentals      = await loadRentalsFromDB();
  userListings = await loadListingsFromDB();
  publishRequests = await loadPublishRequestsFromDB();

  loadUserProfile();
  checkOverdue();
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

  // Handle broken images globally
  document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('p-order-img')) {
      e.target.style.display = 'none';
      var emoji = document.createElement('div');
      emoji.className = 'p-order-emoji';
      emoji.textContent = '👗';
      e.target.parentNode.insertBefore(emoji, e.target.nextSibling);
    }
  }, true);

  var hash    = location.hash.replace('#', '');
  var hashMap = {
    info:     'tab-notif',
    history:  'tab-history',
    listings: 'tab-listings',
    active:   'tab-history',
    incoming: 'tab-history'
  };
  if (hashMap[hash]) switchToTab(hashMap[hash]);
});

window.addEventListener('load', function() {
  var params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') {
    setTimeout(function() {
      document.getElementById('tab-listings')?.click();
      setTimeout(function() {
        document.getElementById('btn-add-listing')?.click();
      }, 100);
    }, 300);
  }
});