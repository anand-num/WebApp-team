/* ══════════════════════════════════════════════════════════
   my-rentals.js
   Профайл хуудасны бүх үйлдэл:
     1. Таб солих
     2. Хүргэлт баталгаажуулах
     3. Буцааж өгсөн гэж тэмдэглэх
     4. Хугацаа дууссан эсэхийг автомат шалгах
     5. Сэтгэгдэл бичих modal
     6. Зар нэмэх форм
══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════
   ЗАХИАЛГЫН ДАТА
   localStorage-д хадгалагдана — хуудас дахин
   нээхэд өөрчлөлтүүд хадгалагдсан байна.
══════════════════════════════════════════ */

var defaultRentals = [
  {
    id: 1,
    name: 'Харанхуй бизнес костюм',
    brand: 'Hugo Boss',
    size: 'S',
    img: '/public/source/mongol-deel.png',
    startDate: '2026-04-05',
    endDate: '2026-04-08',
    days: 3,
    price: 60000,
    status: 'delivery',   /* delivery = хүргэлтэнд явж байна */
    reviewed: false
  },
  {
    id: 2,
    name: 'Цэнхэр даашинз',
    brand: 'Belucci',
    size: 'XS',
    img: '/public/source/big-blue-dress.jpg',
    startDate: '2026-04-10',
    endDate: '2026-04-13',
    days: 3,
    price: 28000,
    status: 'pending',    /* pending = хүлээгдэж буй */
    reviewed: false
  },
  {
    id: 3,
    name: 'Хар кимоно',
    brand: 'Kishimori',
    size: 'M',
    img: '/public/source/kimono.jpg',
    startDate: '2026-03-15',
    endDate: '2026-03-18',
    days: 3,
    price: 45000,
    status: 'done',       /* done = дууссан */
    reviewed: false
  },
  {
    id: 4,
    name: 'Монгол хатны дээл',
    brand: 'Yalguun',
    size: 'M',
    img: '/public/source/mongolian-queen-deel.jpg',
    startDate: '2026-03-01',
    endDate: '2026-03-04',
    days: 3,
    price: 90000,
    status: 'done',
    reviewed: true        /* reviewed = сэтгэгдэл бичигдсэн */
  },
  {
    id: 5,
    name: 'Баавгайн маскот',
    brand: 'Temu',
    size: 'Нэг хэмжээ',
    img: '/public/source/bear-costume.jpg',
    startDate: '2026-02-14',
    endDate: '2026-02-15',
    days: 1,
    price: 10000,
    status: 'cancelled',  /* cancelled = цуцалсан */
    reviewed: false
  }
];

/* localStorage-аас дата унших */
function loadRentals() {
  var saved = localStorage.getItem('myRentals');
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultRentals;
}

/* localStorage-д дата хадгалах */
function saveRentals(rentals) {
  localStorage.setItem('myRentals', JSON.stringify(rentals));
}

var rentals = loadRentals();


/* ══════════════════════════════════════════
   СТАТУС ТЭМДЭГЛЭЛ
══════════════════════════════════════════ */

function statusLabel(status) {
  if (status === 'delivery')  { return 'Хүргэлтэнд'; }
  if (status === 'pending')   { return 'Хүлээгдэж буй'; }
  if (status === 'active')    { return 'Хүлээн авсан'; }
  if (status === 'overdue')   { return 'Хугацаа дууссан'; }
  if (status === 'done')      { return 'Дууссан'; }
  if (status === 'cancelled') { return 'Цуцалсан'; }
  return status;
}

function statusColor(status) {
  if (status === 'delivery')  { return 'green'; }
  if (status === 'pending')   { return 'yellow'; }
  if (status === 'accepted')  { return 'green'; }
  if (status === 'active')    { return 'green'; }
  if (status === 'overdue')   { return 'red'; }
  if (status === 'done')      { return 'gray'; }
  if (status === 'cancelled') { return 'red'; }
  return 'gray';
}


/* ══════════════════════════════════════════
   ТАБ СОЛИХ
══════════════════════════════════════════ */

function setupTabs() {
  var tabButtons = document.querySelectorAll('.ptab');

  tabButtons.forEach(function(button) {
    button.addEventListener('click', function() {

      /* Бүх товчноос active хасна */
      tabButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });

      /* Бүх панелийг нуух */
      var panels = ['panel-info', 'panel-active', 'panel-history', 'panel-listings'];
      panels.forEach(function(id) {
        var panel = document.getElementById(id);
        if (panel) { panel.setAttribute('hidden', ''); }
      });

      /* Дарагдсан товчинд active нэмнэ */
      button.classList.add('active');

      /* Тухайн панелийг харуулна */
      var targetId = button.getAttribute('aria-controls');
      var target = document.getElementById(targetId);
      if (target) { target.removeAttribute('hidden'); }
    });
  });
}

/* Кодоос таб дуудах */
function switchToTab(tabId) {
  var btn = document.getElementById(tabId);
  if (btn) { btn.click(); }
}


/* ══════════════════════════════════════════
   ИДЭВХТЭЙ ЗАХИАЛГУУДЫГ ЗУРАХ
══════════════════════════════════════════ */

function renderActiveRentals() {
  var container = document.getElementById('active-list');
  if (!container) { return; }

  var activeItems = rentals.filter(function(r) {
    return r.status === 'delivery' || r.status === 'pending'
        || r.status === 'active'   || r.status === 'overdue';
  });

  if (activeItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📦</div><p>Идэвхтэй захиалга байхгүй</p></div>';
    return;
  }

  container.innerHTML = activeItems.map(function(r) {
    var color = statusColor(r.status);
    var label = statusLabel(r.status);

    /* Аль товч харуулахыг статусаас тодорхойлно */
    var actionBtn = '';
    if (r.status === 'pending') {
      actionBtn = '<button class="btn-sm success btn-accept" data-id="' + r.id + '">✓ Хүсэлт зөвшөөрөх</button>';
    }
    if (r.status === 'delivery') {
      actionBtn = '<button class="btn-sm success btn-confirm" data-id="' + r.id + '">Хүргэлт баталгаажуулах ✓</button>';
    }
    if (r.status === 'active' || r.status === 'overdue') {
      actionBtn = '<button class="btn-sm danger btn-return" data-id="' + r.id + '">Буцааж өгсөн ✓</button>';
    }

    /* Зураг байвал img таг, байхгүй бол emoji харуулна */
    var thumbHtml = r.img
      ? '<img class="p-order-img" src="' + r.img + '" alt="' + r.name + '">'
      : '<div class="p-order-emoji">' + (r.emoji || '👗') + '</div>';

    return (
      '<div class="p-order">' +
        thumbHtml +
        '<div class="p-order-info">' +
          '<p class="p-order-name">' + r.name + '</p>' +
          '<p class="p-order-meta">' + r.brand + ' · ' + r.size + ' · ' + r.startDate + ' – ' + r.endDate + ' · ' + r.days + ' өдөр</p>' +
        '</div>' +
        '<strong class="p-order-total">' + fmt(r.price) + '</strong>' +
        '<div class="p-order-right">' +
          '<span class="p-order-status ' + color + '">' + label + '</span>' +
          actionBtn +
        '</div>' +
      '</div>'
    );
  }).join('');

  /* Товчнуудад click холбоно */
  document.querySelectorAll('.btn-accept').forEach(function(btn) {
    btn.addEventListener('click', function() {
      acceptRequest(parseInt(btn.getAttribute('data-id')));
    });
  });

  document.querySelectorAll('.btn-confirm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      confirmDelivery(parseInt(btn.getAttribute('data-id')));
    });
  });

  document.querySelectorAll('.btn-return').forEach(function(btn) {
    btn.addEventListener('click', function() {
      markReturned(parseInt(btn.getAttribute('data-id')));
    });
  });
}


/* ══════════════════════════════════════════
   ХҮСЭЛТ ЗӨВШӨӨРӨХ (нөгөө хэрэглэгч зөвшөөрнө)
   "pending" → "delivery", сагсанд автоматаар нэмнэ
══════════════════════════════════════════ */

function acceptRequest(id) {
  var rental = rentals.find(function(r) { return r.id === id; });
  if (!rental) { return; }

  /* Статусыг delivery болгоно — хүргэлтэнд явж байна */
  rental.status = 'delivery';
  saveRentals(rentals);

  /* Сагсанд автоматаар нэмнэ */
  addRentalToCart(rental);

  renderActiveRentals();
  updateStats();
  showToast('Хүсэлт зөвшөөрөгдлөө! Бараа сагсанд нэмэгдлээ. 🛍', 'green');
}

/* Rental объектыг rf_cart localStorage-д нэмнэ */
function addRentalToCart(rental) {
  var cartKey  = 'rf_cart';
  var cartItems;

  /* Одоо байгаа сагсыг уншина */
  try { cartItems = JSON.parse(localStorage.getItem(cartKey)) || []; }
  catch (e) { cartItems = []; }

  /* Аль хэдийн байгаа бол дахин нэмэхгүй */
  var alreadyIn = cartItems.some(function(i) { return i.id === rental.id; });
  if (alreadyIn) { return; }

  /* Rental-ийн мэдээллийг cart item хэлбэрт хөрвүүлнэ */
  cartItems.push({
    id          : rental.id,
    name        : rental.name,
    brand       : rental.brand,
    img         : rental.img || '',
    emoji       : rental.emoji || '👗',
    size        : rental.size,
    basePrice   : rental.price / (rental.days || 1),   /* өдрийн үнэ */
    selectedDays: rental.days || 1,
    startDate   : rental.startDate,
    endDate     : rental.endDate,
  });

  localStorage.setItem(cartKey, JSON.stringify(cartItems));
}


/* ══════════════════════════════════════════
   ХҮРГЭЛТ БАТАЛГААЖУУЛАХ
   "delivery" → "active"
══════════════════════════════════════════ */

function confirmDelivery(id) {
  var rental = rentals.find(function(r) { return r.id === id; });
  if (!rental) { return; }

  rental.status = 'active';
  saveRentals(rentals);
  renderActiveRentals();
  updateStats();
  showToast('Хүргэлт баталгаажлаа! Хувцасыг хүлээн авсан.', 'green');
}


/* ══════════════════════════════════════════
   БУЦААЖ ӨГСӨН
   "active" → "done", Түүх таб руу шилжинэ
══════════════════════════════════════════ */

function markReturned(id) {
  var rental = rentals.find(function(r) { return r.id === id; });
  if (!rental) { return; }

  rental.status = 'done';
  saveRentals(rentals);
  renderActiveRentals();
  renderHistoryRentals();
  updateStats();
  showToast('Буцааж өгснийг баталгаажлаа! Сэтгэгдэл бичиж болно.', 'green');
  switchToTab('tab-history');
}


/* ══════════════════════════════════════════
   ЗАХИАЛГЫН ТҮҮХИЙГ ЗУРАХ
══════════════════════════════════════════ */

function renderHistoryRentals() {
  var container = document.getElementById('history-list');
  if (!container) { return; }

  var historyItems = rentals.filter(function(r) {
    return r.status === 'done' || r.status === 'cancelled';
  });

  if (historyItems.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🕐</div><p>Захиалгын түүх байхгүй</p></div>';
    return;
  }

  container.innerHTML = historyItems.map(function(r) {
    var color = statusColor(r.status);
    var label = statusLabel(r.status);

    /* Дууссан бол сэтгэгдэл бичих товч харуулна */
    var reviewBtn = '';
    if (r.status === 'done' && !r.reviewed) {
      reviewBtn = '<button class="btn-sm success btn-review" data-id="' + r.id + '">★ Сэтгэгдэл бичих</button>';
    }
    if (r.status === 'done' && r.reviewed) {
      reviewBtn = '<span style="font-size:.7rem;color:var(--gold)">★ Бичигдсэн</span>';
    }

    return (
      '<div class="p-order">' +
        '<img class="p-order-img" src="' + r.img + '" alt="' + r.name + '">' +
        '<div class="p-order-info">' +
          '<p class="p-order-name">' + r.name + '</p>' +
          '<p class="p-order-meta">' + r.brand + ' · ' + r.size + ' · ' + r.startDate + ' – ' + r.endDate + '</p>' +
        '</div>' +
        '<strong class="p-order-total">' + fmt(r.price) + '</strong>' +
        '<div class="p-order-right">' +
          '<span class="p-order-status ' + color + '">' + label + '</span>' +
          reviewBtn +
        '</div>' +
      '</div>'
    );
  }).join('');

  /* Сэтгэгдэл бичих товчнуудад click холбоно */
  document.querySelectorAll('.btn-review').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openReviewModal(parseInt(btn.getAttribute('data-id')));
    });
  });
}


/* ══════════════════════════════════════════
   ХУГАЦАА ШАЛГАХ
   endDate < өнөөдөр бол "overdue" болгоно
══════════════════════════════════════════ */

function checkOverdue() {
  var today = new Date().toISOString().split('T')[0];
  var changed = false;

  rentals.forEach(function(r) {
    if (r.status === 'active' && r.endDate < today) {
      r.status = 'overdue';
      changed = true;
    }
  });

  if (changed) { saveRentals(rentals); }
}


/* ══════════════════════════════════════════
   СТАТИСТИК ШИНЭЧЛЭХ
══════════════════════════════════════════ */

function updateStats() {
  var activeCount = rentals.filter(function(r) {
    return r.status === 'delivery' || r.status === 'pending'
        || r.status === 'active'   || r.status === 'overdue';
  }).length;

  var el1 = document.getElementById('stat-active');
  var el2 = document.getElementById('stat-total');
  if (el1) { el1.textContent = activeCount; }
  if (el2) { el2.textContent = rentals.length; }
}


/* ══════════════════════════════════════════
   СЭТГЭГДЭЛ MODAL
   design.html-ийн .modal-ov / .modal-ov.open загварыг ашиглана
══════════════════════════════════════════ */

var selectedStars = 0;
var currentReviewId = null;

function openReviewModal(rentalId) {
  currentReviewId = rentalId;
  selectedStars = 0;
  updateStarDisplay();

  var commentField = document.getElementById('review-comment');
  if (commentField) { commentField.value = ''; }

  /* .open класс нэмэхэд CSS transition ажиллаж харагдана */
  document.getElementById('review-modal').classList.add('open');
}

function closeReviewModal() {
  document.getElementById('review-modal').classList.remove('open');
}

function updateStarDisplay() {
  var stars = document.querySelectorAll('.star-btn');
  stars.forEach(function(btn, index) {
    if (index < selectedStars) {
      btn.classList.add('filled');
    } else {
      btn.classList.remove('filled');
    }
  });
}

function setupStarButtons() {
  document.querySelectorAll('.star-btn').forEach(function(btn, index) {
    btn.addEventListener('click', function() {
      selectedStars = index + 1;   /* index 0–4 → үнэлгээ 1–5 */
      updateStarDisplay();
    });
  });
}

function submitReview() {
  var comment = document.getElementById('review-comment').value.trim();

  if (selectedStars === 0) { showToast('Одны үнэлгээ сонгоно уу!', 'red'); return; }
  if (!comment)            { showToast('Сэтгэгдэл бичнэ үү!', 'red'); return; }

  var rental = rentals.find(function(r) { return r.id === currentReviewId; });
  if (rental) {
    rental.reviewed = true;
    saveRentals(rentals);
  }

  closeReviewModal();
  renderHistoryRentals();
  showToast('Сэтгэгдэл амжилттай илгээгдлээ! ★', 'green');
}

/* Modal-ийн backdrop (хар хэсэг) дарахад хаана */
function setupModalClose() {
  var modal = document.getElementById('review-modal');
  modal.addEventListener('click', function(e) {
    /* e.target нь дарагдсан элемент.
       Modal өөрийг нь (backdrop) дарсан бол хаана. */
    if (e.target === modal) { closeReviewModal(); }
  });
}


/* ══════════════════════════════════════════
   ЗАР НЭМЭХ ФОРМ
══════════════════════════════════════════ */

function setupListingForm() {
  var addBtn    = document.getElementById('btn-add-listing');
  var formWrap  = document.getElementById('listing-form-wrap');
  var cancelBtn = document.getElementById('btn-cancel-listing');
  var submitBtn = document.getElementById('btn-submit-listing');

  if (!addBtn || !formWrap) { return; }

  addBtn.addEventListener('click', function() {
    formWrap.removeAttribute('hidden');
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      formWrap.setAttribute('hidden', '');
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      var name  = document.getElementById('l-name').value.trim();
      var brand = document.getElementById('l-brand').value.trim();
      var price = document.getElementById('l-price').value.trim();

      if (!name || !brand || !price) {
        showToast('Бүх * талбарыг бөглөнө үү!', 'red');
        return;
      }

      formWrap.setAttribute('hidden', '');
      showToast('Зар илгээгдлээ! Admin хянаж баталгаажуулна.', 'green');
    });
  }
}


/* ══════════════════════════════════════════
   ТУСЛАМЖИЙН ФУНКЦҮҮД
══════════════════════════════════════════ */

/* Тоог мөнгөний формат болгоно — 60000 → "60,000₮" */
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

/* design.html-ийн .toast / .toast.show загварыг ашиглана */
function showToast(msg, type) {
  var toast = document.getElementById('toast');
  if (!toast) { return; }

  toast.textContent = msg;
  toast.className = 'toast';            /* Өмнөх классуудыг цэвэрлэнэ */
  if (type) { toast.classList.add(type); }

  /* .show нэмэхэд CSS translateY(0) болж харагдана */
  toast.classList.add('show');

  /* 3 секундын дараа нуух */
  setTimeout(function() {
    toast.classList.remove('show');
  }, 3000);
}


/* ══════════════════════════════════════════
   ЭХЛҮҮЛЭХ
══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   LOGED-IN ХЭРЭГЛЭГЧИЙН МЭДЭЭЛЛИЙГ АЧААЛАХ
   rf_user (localStorage) -оос уншиж профайл
   болон формын утгуудыг бөглөнө.
══════════════════════════════════════════ */
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

document.addEventListener('DOMContentLoaded', function() {
  loadUserProfile();        /* Нэвтэрсэн хэрэглэгчийн мэдээллийг бөглөнө */
  checkOverdue();           /* Хугацаа дууссан захиалгуудыг шалгана */
  setupTabs();              /* Таб товчнуудыг тохируулна */
  renderActiveRentals();    /* Идэвхтэй захиалгуудыг зурна */
  renderHistoryRentals();   /* Захиалгын түүхийг зурна */
  updateStats();            /* Статистик тоонуудыг шинэчилнэ */
  setupStarButtons();       /* Одны товчнуудыг тохируулна */
  setupModalClose();        /* Modal backdrop хаах */
  setupListingForm();       /* Зар нэмэх форм */

  /* Hash-аар шууд таб нээх — dropdown линкүүдээс ирсэн үед */
  var hash = location.hash.replace('#', '');
  var hashMap = {
    info: 'tab-info', active: 'tab-active', history: 'tab-history',
    listings: 'tab-listings', incoming: 'tab-active', notifications: 'tab-info'
  };
  if (hashMap[hash]) { switchToTab(hashMap[hash]); }
});
