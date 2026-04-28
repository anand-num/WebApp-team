/* ══════════════════════════════════════════════════════════
   RENTFIT — request-modal.js
   Түрээсийн хүсэлтийн modal-ийн бүх үйлдэл.

   NOTE: type="module" биш — HTML дахь onclick-аас дуудагдана
══════════════════════════════════════════════════════════ */

/* Одоо нээлттэй байгаа бүтээгдэхүүний мэдээлэл */
var _rmProduct = null;

/* ── Modal нээх ────────────────────────────────────────── */
function openRequestModal(product) {
  _rmProduct = product;

  /* Бүтээгдэхүүний үндсэн мэдээллийг modal-д тавина */
  var nameEl  = document.getElementById('rm-name');
  var brandEl = document.getElementById('rm-brand');
  var priceEl = document.getElementById('rm-price');
  var emojiEl = document.getElementById('rm-emoji');

  if (nameEl)  { nameEl.textContent  = product.item_name || product.name || '—'; }
  if (brandEl) { brandEl.textContent = product.brand || '—'; }
  if (priceEl) {
    var price = parseInt(String(product.price || product.basePrice || 0).replace(/[^0-9]/g, ''), 10) || 0;
    priceEl.textContent = price.toLocaleString() + '₮/өдөр';
  }
  if (emojiEl) { emojiEl.textContent = product.emoji || '👗'; }

  /* Хэмжээний товчнуудыг бүтээгдэхүүний хэмжээнүүдээр дүүргэнэ */
  var sizes   = Array.isArray(product.sizes) ? product.sizes
              : (product.size ? [product.size] : ['XS', 'S', 'M', 'L']);
  var rmSizes = document.getElementById('rmSizes');
  if (rmSizes) {
    rmSizes.innerHTML = sizes.map(function(s) {
      return '<button type="button" onclick="pickRmSize(\'' + s + '\')" data-s="' + s + '">' + s + '</button>';
    }).join('');
    /* Эхний хэмжээг анхдагчаар сонгоно */
    document.getElementById('rmSize').value = sizes[0];
    var firstBtn = rmSizes.querySelector('button');
    if (firstBtn) { firstBtn.classList.add('sel'); }
  }

  /* Огнооны талбаруудыг цэвэрлэнэ */
  document.getElementById('rmFrom').value        = '';
  document.getElementById('rmTo').value          = '';
  document.getElementById('rmDays').textContent  = '0 өдөр';
  document.getElementById('rmTotal').textContent = '0₮';
  document.getElementById('rmComment').value     = '';

  /* Modal харуулна */
  document.getElementById('reqModal').classList.add('open');
}

/* ── Modal хаах ────────────────────────────────────────── */
function closeQM() {
  document.getElementById('reqModal').classList.remove('open');
}

/* ── Хэмжээ сонгох ─────────────────────────────────────── */
function pickRmSize(size) {
  document.getElementById('rmSize').value = size;
  /* Сонгогдсон товч дээр 'sel' класс нэмнэ, бусдаасаа хасна */
  document.querySelectorAll('#rmSizes button').forEach(function(btn) {
    btn.classList.toggle('sel', btn.getAttribute('data-s') === size);
  });
}

/* ── Нийт дүн тооцоолох ────────────────────────────────── */
function calcRmTotal() {
  if (!_rmProduct) { return; }

  var price = parseInt(String(_rmProduct.price || _rmProduct.basePrice || 0).replace(/[^0-9]/g, ''), 10) || 0;
  var from  = document.getElementById('rmFrom').value;
  var to    = document.getElementById('rmTo').value;

  if (!from || !to) {
    document.getElementById('rmDays').textContent  = '0 өдөр';
    document.getElementById('rmTotal').textContent = '0₮';
    return;
  }

  /* Хоёр огнооны зөрүүг өдрөөр тооцно */
  var diff = new Date(to) - new Date(from);
  var days = Math.max(1, Math.round(diff / 86400000));

  document.getElementById('rmDays').textContent  = days + ' өдөр';
  document.getElementById('rmTotal').textContent = (days * price).toLocaleString() + '₮';
}

/* ── Хүсэлт илгээх ─────────────────────────────────────── */
function submitRequest() {
  var from    = document.getElementById('rmFrom').value;
  var to      = document.getElementById('rmTo').value;
  var size    = document.getElementById('rmSize').value;
  var comment = document.getElementById('rmComment').value.trim();

  /* Огнооны шалгалт */
  if (!from || !to) {
    alert('Эхлэх болон дуусах огноог сонгоно уу.');
    return;
  }
  if (new Date(to) <= new Date(from)) {
    alert('Дуусах огноо эхлэх огноогоос хойш байх ёстой.');
    return;
  }

  var days  = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000));
  var price = parseInt(String(_rmProduct ? (_rmProduct.price || _rmProduct.basePrice || 0) : 0).replace(/[^0-9]/g, ''), 10) || 0;

  /* Зургийн замыг нормчилно — зөвхөн файлын нэр байвал бүтэн замд хөрвүүлнэ */
  var rawImg = _rmProduct ? (_rmProduct.img_src || _rmProduct.img || '') : '';
  var img    = rawImg.startsWith('/') ? rawImg : (rawImg ? '/public/source/' + rawImg : '');

  /* Хүсэлтийн объект үүсгэнэ */
  var request = {
    id        : Date.now(),
    productId : _rmProduct ? _rmProduct.id   : null,
    name      : _rmProduct ? (_rmProduct.item_name || _rmProduct.name || '') : '',
    brand     : _rmProduct ? (_rmProduct.brand || '') : '',
    img       : img,
    emoji     : _rmProduct ? (_rmProduct.emoji || '👗') : '👗',
    size      : size,
    startDate : from,
    endDate   : to,
    days      : days,
    price     : price * days,
    comment   : comment,
    status    : 'pending',
    createdAt : new Date().toISOString(),
  };

  /* localStorage-д хадгална — myRentals массивд push хийнэ */
  var saved = JSON.parse(localStorage.getItem('myRentals') || '[]');
  saved.push(request);
  localStorage.setItem('myRentals', JSON.stringify(saved));

  closeQM();

  /* Амжилтын мэдэгдэл */
  var toast = document.getElementById('req-toast');
  if (toast) {
    toast.textContent = '✓ Хүсэлт амжилттай илгээгдлээ!';
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
  } else {
    alert('✓ Хүсэлт амжилттай илгээгдлээ!');
  }
}
