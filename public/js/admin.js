/* ═══════════════════════════════════════════════════
   RentFit Admin Panel — admin.js
   ═══════════════════════════════════════════════════ */

/* ── STATE ── */
const DB = {
  adminLoggedIn: false,
  products: [],
  productsLoaded: false,
  orders: [],
  users: [],
  usersLoaded: false,
  search: '',
  filter: 'all',
};

/* ── CONSTANTS ── */
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CATS = [
  { v: 'all',         l: 'Бүгд' },
  { v: 'dress',       l: 'Гоёлын' },
  { v: 'traditional', l: 'Монгол дэл' },
  { v: 'costume',     l: 'Костюм' },
  { v: 'business',    l: 'Бизнес' },
  { v: 'casual',      l: 'Өдөр тутмын' },
];

/* ── UTILS ── */
function $(id) { return document.getElementById(id); }

let toastTimer;
function toast(msg, type = '') {
  const el = $('toast');
  el.innerHTML = (type === 'green' ? '✓ ' : type === 'red' ? '✕ ' : '') + msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

function nav(page) { window.location.hash = page; }

function imgSrc(src) { return '../json/' + src; }

/* ── LOAD DATA ── */
async function loadData() {
  await Promise.all([loadProducts(), loadUsers()]);
}

async function loadProducts() {
  if (DB.productsLoaded) return;
  try {
    const res = await fetch('../json/product.json');
    if (!res.ok) throw new Error('fetch failed');
    const raw = await res.json();
    DB.products = raw.map((p, i) => ({
      id: i + 1,
      brand: (p.brand || '').replace(/_/g, ' '),
      name: (p.item_name || '').replace(/_/g, ' '),
      publisher: p.publisher || '',
      rating: p.rating || 0,
      reviews: p.review_count || 0,
      price: p.price || '',
      pricePeriod: p.price_period || '',
      status: (p.status || 'standard').toLowerCase(),
      img: p.img_src || '',
      category: guessCategory(p.item_name || '', p.brand || ''),
      sizes: p.sizes || ['S', 'M', 'L'],
    }));
    DB.productsLoaded = true;
  } catch (e) {
    console.warn('Could not load product.json:', e.message);
    DB.productsLoaded = true;
  }
}

async function loadUsers() {
  if (DB.usersLoaded) return;
  try {
    const res = await fetch('../json/users.json');
    if (!res.ok) throw new Error('fetch failed');
    const raw = await res.json();
    DB.users = raw.map((u, i) => ({
      id: u.id || i + 1,
      name: u.name || u.username || u.full_name || '—',
      email: u.email || '—',
      phone: u.phone || u.phone_number || '—',
      orders: u.orders || u.order_count || 0,
      status: (u.status || 'active').toLowerCase(),
      role: u.role || 'user',
      createdAt: u.created_at || u.createdAt || '',
    }));
    DB.usersLoaded = true;
  } catch (e) {
    console.warn('Could not load users.json:', e.message);
    DB.usersLoaded = true;
  }
}

function guessCategory(name, brand) {
  const n = (name + ' ' + brand).toLowerCase();
  if (/deel|mongol|queen|olimpic|male_cost/.test(n)) return 'traditional';
  if (/dress|gown|ballroom|tango|wedding|kimono|violet|evergarden|anna|blue/.test(n)) return 'dress';
  if (/costume|bear|disney/.test(n)) return 'costume';
  return 'dress';
}

/* ── ROUTER ── */
window.addEventListener('hashchange', render);
window.addEventListener('load', render);

async function render() {
  const hash = window.location.hash.slice(1) || 'login';
  const [page, ...params] = hash.split('/');
  if (page === 'login' || page === '') {
    renderLogin();
    return;
  }
  if (page === 'admin') {
    await loadData();
    renderAdmin(params[0] || 'dashboard', params[1]);
    return;
  }
  renderLogin();
}

/* ══════════════════════════════════════════
   LOGIN
══════════════════════════════════════════ */
function renderLogin() {
  $('app').innerHTML = `
    <div class="login-page page">
      <div class="login-bg"></div>
      <div class="login-grid"></div>
      <div class="login-card">
        <div class="login-logo">Rent<em>Fit</em></div>
        <div class="login-sub">ADMIN PANEL &bull; УДИРДЛАГЫН САМБАР</div>
        <div id="loginErr"></div>
        <div class="form-group" style="margin-bottom:14px">
          <label>Хэрэглэгчийн нэр</label>
          <input id="a_user" value="admin" autocomplete="username">
        </div>
        <div class="form-group" style="margin-bottom:20px">
          <label>Нууц үг</label>
          <input type="password" id="a_pass" id="a_pass" autocomplete="current-password">
        </div>
        <button class="btn btn-gold" style="width:100%;justify-content:center;padding:13px" id="loginBtn">
          Нэвтрэх &rarr;
        </button>
        <div class="login-hint"><strong>Туршилт:</strong> admin / rentfit2025</div>
      </div>
    </div>`;

  $('a_pass').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
  });
  $('loginBtn').addEventListener('click', doLogin);
  setTimeout(() => { const p = $('a_pass'); if (p) p.focus(); }, 50);
}

function doLogin() {
  const user = $('a_user').value;
  const pass = $('a_pass').value;
  if (user === 'admin' && pass === 'rentfit2025') {
    DB.adminLoggedIn = true;
    nav('admin/dashboard');
  } else {
    $('loginErr').innerHTML = '<div class="error-msg">Буруу нэр эсвэл нууц үг</div>';
  }
}

/* ══════════════════════════════════════════
   ADMIN SHELL
══════════════════════════════════════════ */
function renderAdmin(sub, param) {
  if (!DB.adminLoggedIn) { nav('login'); return; }

  const pending = DB.products.filter(p => p.status === 'pending').length;

  const sidebar = `
    <div class="admin-side">
      <div class="side-logo">
        <div class="wordmark">Rent<em>Fit</em></div>
        <div class="tagline">Admin Panel</div>
      </div>
      <div class="side-section">
        <div class="side-section-label">Үндсэн</div>
        <nav class="side-nav">
          <a id="nav-dashboard" class="${sub === 'dashboard' ? 'active' : ''}">
            <span class="ico">&#9672;</span> Dashboard
          </a>
          <a id="nav-products" class="${['products','add','edit'].includes(sub) ? 'active' : ''}">
            <span class="ico">&#9673;</span> Бүтээгдэхүүн
            ${pending ? `<span class="badge">${pending}</span>` : ''}
          </a>
          <a id="nav-orders" class="${sub === 'orders' ? 'active' : ''}">
            <span class="ico">&#9676;</span> Захиалга
          </a>
          <a id="nav-users" class="${sub === 'users' ? 'active' : ''}">
            <span class="ico">&#9678;</span> Хэрэглэгч
          </a>
        </nav>
      </div>
      <div class="side-footer">
        <nav class="side-nav">
          <a id="nav-logout">
            <span class="ico">&#8867;</span> Гарах
          </a>
        </nav>
      </div>
    </div>`;

  let content = '';
  if (sub === 'dashboard') content = pageDashboard();
  else if (sub === 'products') content = pageProducts();
  else if (sub === 'add') content = pageAdd();
  else if (sub === 'edit') content = pageEdit(param);
  else if (sub === 'orders') content = pageOrders();
  else if (sub === 'users') content = pageUsers();
  else content = pageDashboard();

  $('app').innerHTML = `
    <div class="page">
      <div class="admin-layout">
        ${sidebar}
        <div class="admin-content">${content}</div>
      </div>
    </div>`;

  /* Bind sidebar nav */
  bindNav('nav-dashboard', () => { DB.search = ''; nav('admin/dashboard'); });
  bindNav('nav-products',  () => { DB.search = ''; nav('admin/products'); });
  bindNav('nav-orders',    () => { DB.search = ''; nav('admin/orders'); });
  bindNav('nav-users',     () => { DB.search = ''; nav('admin/users'); });
  bindNav('nav-logout', () => {
    DB.adminLoggedIn = false;
    nav('login');
    toast('Амжилттай гарлаа');
  });

  /* Bind page-specific buttons */
  bindPageEvents(sub);
}

function bindNav(id, fn) {
  const el = $(id);
  if (el) el.addEventListener('click', fn);
}

/* ══════════════════════════════════════════
   PAGE EVENT BINDING
══════════════════════════════════════════ */
function bindPageEvents(sub) {
  if (sub === 'dashboard') bindDashboardEvents();
  else if (sub === 'products') bindProductsEvents();
  else if (sub === 'add') bindAddEvents();
  else if (sub === 'edit') bindEditEvents();
  else if (sub === 'users') bindUsersEvents();
}

function bindDashboardEvents() {
  const seeAll = document.getElementById('btn-see-all');
  if (seeAll) seeAll.addEventListener('click', () => nav('admin/products'));

  document.querySelectorAll('[data-approve]').forEach(btn => {
    btn.addEventListener('click', () => approveP(btn.dataset.approve));
  });
  document.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', () => rejectP(btn.dataset.reject));
  });
}

function bindProductsEvents() {
  const addBtn = document.getElementById('btn-add-product');
  if (addBtn) addBtn.addEventListener('click', () => nav('admin/add'));

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      DB.search = this.value;
      renderAdmin('products');
    });
  }

  const filterSelect = document.getElementById('filter-select');
  if (filterSelect) {
    filterSelect.addEventListener('change', function () {
      DB.filter = this.value;
      renderAdmin('products');
    });
  }

  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => nav('admin/edit/' + btn.dataset.edit));
  });
  document.querySelectorAll('[data-approve]').forEach(btn => {
    btn.addEventListener('click', () => approveP(btn.dataset.approve));
  });
  document.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', () => rejectP(btn.dataset.reject));
  });
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteP(btn.dataset.delete));
  });
}

function bindAddEvents() {
  const saveBtn = document.getElementById('btn-save-new');
  if (saveBtn) saveBtn.addEventListener('click', saveNew);

  const cancelBtn = document.getElementById('btn-cancel-add');
  if (cancelBtn) cancelBtn.addEventListener('click', () => nav('admin/products'));
}

function bindEditEvents() {
  const saveBtn = document.getElementById('btn-save-edit');
  if (saveBtn) saveBtn.addEventListener('click', () => saveEdit(saveBtn.dataset.id));

  const cancelBtn = document.getElementById('btn-cancel-edit');
  if (cancelBtn) cancelBtn.addEventListener('click', () => nav('admin/products'));
}

/* ══════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════ */
function pageDashboard() {
  const total   = DB.products.length;
  const active  = DB.products.filter(p => p.status !== 'pending' && p.status !== 'rejected').length;
  const pending = DB.products.filter(p => p.status === 'pending').length;

  const months = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р'];
  const bars   = [28, 45, 38, 62, 74, 55, 80];
  const maxBar = Math.max(...bars);

  const pendingRows = DB.products.filter(p => p.status === 'pending').slice(0, 5);

  const dateStr = new Date().toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>RentFit</span> / <span>Dashboard</span></div>
        <h1>Ерөнхий тойм</h1>
      </div>
      <span style="font-size:.72rem;color:var(--muted);align-self:center">${dateStr}</span>
    </div>
    <div class="content-body">

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">&#9673;</div>
          <div class="label">Нийт бараа</div>
          <div class="value">${total}</div>
          <div class="delta">&#8593; ${active} идэвхтэй</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#9672;</div>
          <div class="label">Хүлээгдэж буй</div>
          <div class="value gold">${pending}</div>
          <div class="delta warn">&#9203; Баталгаажуулах шаардлагатай</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#9676;</div>
          <div class="label">Захиалга</div>
          <div class="value">${DB.orders.length}</div>
          <div class="delta">${DB.orders.length ? '&#8593; Нийт' : '&mdash; Байхгүй'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">&#9678;</div>
          <div class="label">Хэрэглэгч</div>
          <div class="value">${DB.users.length}</div>
          <div class="delta">&#8593; ${DB.users.length} бүртгэлтэй</div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3>Сарын түрээсийн статистик</h3>
          <div class="chart-legend"><span>Түрээс</span></div>
        </div>
        <div class="chart-bars">
          ${bars.map((h, i) => `
            <div class="chart-bar-wrap">
              <div class="chart-bar" style="height:${(h / maxBar) * 100}%">
                <div class="chart-bar-tooltip">${h}</div>
              </div>
              <span class="chart-bar-lbl">${months[i]}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="table-card">
        <div class="table-head">
          <h3>Хүлээгдэж буй бараанууд</h3>
          <button class="btn btn-ghost btn-sm" id="btn-see-all">Бүгдийг харах &rarr;</button>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Бараа</th>
            <th>Ангилал</th>
            <th>Үнэ</th>
            <th>Үйлдэл</th>
          </tr></thead>
          <tbody>
            ${pendingRows.length
              ? pendingRows.map(p => `
                <tr>
                  <td><div class="prod-cell">
                    <img class="prod-thumb" src="${imgSrc(p.img)}" alt="${p.name}" loading="lazy"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <div class="prod-thumb-placeholder" style="display:none">&#128247;</div>
                    <div>
                      <div class="prod-name">${p.name}</div>
                      <div class="prod-brand">${p.brand}</div>
                    </div>
                  </div></td>
                  <td>${CATS.find(c => c.v === p.category)?.l || p.category}</td>
                  <td><span class="price-cell">${p.price}</span></td>
                  <td><div class="actions">
                    <button class="btn btn-success btn-sm" data-approve="${p.id}">&#10003; Зөвшөөрөх</button>
                    <button class="btn btn-danger btn-sm" data-reject="${p.id}">&#10005;</button>
                  </div></td>
                </tr>`).join('')
              : `<tr><td colspan="4">
                   <div class="empty-state">
                     <span class="empty-icon">&#10003;</span>
                     Хүлээгдэж буй бараа байхгүй
                   </div>
                 </td></tr>`
            }
          </tbody>
        </table>
      </div>

    </div>`;
}

/* ══════════════════════════════════════════
   PRODUCTS PAGE
══════════════════════════════════════════ */
function pageProducts() {
  let filtered = [...DB.products];

  if (DB.search) {
    const q = DB.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.publisher || '').toLowerCase().includes(q)
    );
  }

  if (DB.filter !== 'all') {
    filtered = filtered.filter(p => p.status === DB.filter);
  }

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>RentFit</span> / <span>Бүтээгдэхүүн</span></div>
        <h1>Бүтээгдэхүүн</h1>
      </div>
      <button class="btn btn-gold" id="btn-add-product">+ Нэмэх</button>
    </div>
    <div class="content-body">
      <div class="table-card">
        <div class="table-head">
          <h3>Бүх бараа <span style="font-size:.72rem;color:var(--muted);font-weight:400">(${filtered.length})</span></h3>
          <div class="table-toolbar">
            <div class="search-wrap">
              <input class="search-input" id="search-input" placeholder="Хайх..." value="${DB.search}">
            </div>
            <select class="filter-select" id="filter-select">
              <option value="all"      ${DB.filter === 'all'      ? 'selected' : ''}>Бүгд</option>
              <option value="premium"  ${DB.filter === 'premium'  ? 'selected' : ''}>Premium</option>
              <option value="standard" ${DB.filter === 'standard' ? 'selected' : ''}>Standard</option>
              <option value="pending"  ${DB.filter === 'pending'  ? 'selected' : ''}>Хүлээгдэж</option>
              <option value="rejected" ${DB.filter === 'rejected' ? 'selected' : ''}>Татгалзсан</option>
            </select>
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Бараа</th>
            <th>Нийтэлсэн</th>
            <th>Рэйтинг</th>
            <th>Үнэ</th>
            <th>Статус</th>
            <th>Үйлдэл</th>
          </tr></thead>
          <tbody>
            ${filtered.length
              ? filtered.map(p => `
                <tr>
                  <td><div class="prod-cell">
                    <img class="prod-thumb" src="${imgSrc(p.img)}" alt="${p.name}" loading="lazy"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <div class="prod-thumb-placeholder" style="display:none">&#128247;</div>
                    <div>
                      <div class="prod-name">${p.name}</div>
                      <div class="prod-brand">${p.brand}</div>
                    </div>
                  </div></td>
                  <td style="color:rgba(255,255,255,.5)">${p.publisher || '&mdash;'}</td>
                  <td>
                    <div class="rating-row">
                      <span class="stars">${'&#9733;'.repeat(Math.floor(p.rating))}</span>
                      <span class="rating-num">${p.rating.toFixed(1)}</span>
                      <span class="review-count">(${p.reviews})</span>
                    </div>
                  </td>
                  <td>
                    <div class="price-cell">${p.price}</div>
                    <div class="price-period">${p.pricePeriod}</div>
                  </td>
                  <td><span class="badge ${p.status}">${
                    p.status === 'premium'  ? 'Premium'    :
                    p.status === 'standard' ? 'Standard'   :
                    p.status === 'pending'  ? 'Хүлээгдэж' : 'Татгалзсан'
                  }</span></td>
                  <td><div class="actions">
                    <button class="btn-icon" data-edit="${p.id}" title="Засах">&#9998;</button>
                    ${p.status === 'pending' ? `
                      <button class="btn btn-success btn-sm" data-approve="${p.id}">&#10003;</button>
                      <button class="btn btn-danger btn-sm" data-reject="${p.id}">&#10005;</button>` : ''}
                    <button class="btn-icon" data-delete="${p.id}" title="Устгах">&#128465;</button>
                  </div></td>
                </tr>`).join('')
              : `<tr><td colspan="6">
                   <div class="empty-state">
                     <span class="empty-icon">&#128269;</span>
                     Тохирох бараа олдсонгүй
                   </div>
                 </td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   ADD PRODUCT PAGE
══════════════════════════════════════════ */
function pageAdd() {
  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>Бүтээгдэхүүн</span> / <span>Нэмэх</span></div>
        <h1>Шинэ бараа нэмэх</h1>
      </div>
    </div>
    <div class="content-body">
      <div class="form-card">
        <div class="form-grid">
          <div class="form-group"><label>Брэнд *</label><input id="af_brand"></div>
          <div class="form-group"><label>Бараанлы нэр *</label><input id="af_name"></div>
          <div class="form-group full"><label>Тайлбар *</label><textarea id="af_desc"></textarea></div>
          <div class="form-group">
            <label>Ангилал *</label>
            <select id="af_cat">
              <option value="">&mdash; Сонгох &mdash;</option>
              ${CATS.filter(c => c.v !== 'all').map(c =>
                `<option value="${c.v}">${c.l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Нийтэлсэн</label><input id="af_publisher"></div>
          <div class="form-group"><label>Үнэ (1 өдөр) *</label><input id="af_price" placeholder="45,000&#8366;"></div>
          <div class="form-group">
            <label>Статус</label>
            <select id="af_status">
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div class="form-group"><label>Зургийн нэр</label><input id="af_img" placeholder="filename.jpg"></div>
          <div class="form-group full">
            <label>Размер</label>
            <div class="size-checks">
              ${SIZES.map(s =>
                `<input type="checkbox" class="size-check" id="sz_${s}" value="${s}">
                 <label class="size-label" for="sz_${s}">${s}</label>`).join('')}
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-gold" id="btn-save-new">Хадгалах</button>
          <button class="btn btn-ghost" id="btn-cancel-add">Болих</button>
        </div>
      </div>
    </div>`;
}

function saveNew() {
  const brand     = $('af_brand').value.trim();
  const name      = $('af_name').value.trim();
  const desc      = $('af_desc').value.trim();
  const cat       = $('af_cat').value;
  const publisher = $('af_publisher').value.trim();
  const price     = $('af_price').value.trim();
  const status    = $('af_status').value;
  const img       = $('af_img').value.trim();
  const sizes     = SIZES.filter(s => document.getElementById('sz_' + s)?.checked);

  if (!brand || !name || !cat || !price) {
    toast('Заавал талбаруудыг бөглөнө үү', 'red');
    return;
  }

  const newId = DB.products.length ? Math.max(...DB.products.map(p => p.id)) + 1 : 1;
  DB.products.push({
    id: newId,
    brand, name, desc,
    category: cat,
    publisher,
    price,
    pricePeriod: 'өдрөөс',
    status,
    img,
    sizes: sizes.length ? sizes : ['S', 'M', 'L'],
    rating: 0,
    reviews: 0,
  });

  toast('Амжилттай нэмэгдлээ ✓', 'green');
  nav('admin/products');
}

/* ══════════════════════════════════════════
   EDIT PRODUCT PAGE
══════════════════════════════════════════ */
function pageEdit(id) {
  const p = DB.products.find(x => x.id == id);
  if (!p) {
    return '<div class="content-body"><p style="color:var(--muted)">Бараа олдсонгүй</p></div>';
  }

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>Бүтээгдэхүүн</span> / <span>Засах</span></div>
        <h1>${p.name}</h1>
      </div>
    </div>
    <div class="content-body">
      <div class="form-card">
        <div class="form-grid">
          <div class="form-group"><label>Брэнд</label><input id="ef_brand" value="${p.brand}"></div>
          <div class="form-group"><label>Нэр</label><input id="ef_name" value="${p.name}"></div>
          <div class="form-group full"><label>Тайлбар</label><textarea id="ef_desc">${p.desc || ''}</textarea></div>
          <div class="form-group">
            <label>Ангилал</label>
            <select id="ef_cat">
              ${CATS.filter(c => c.v !== 'all').map(c =>
                `<option value="${c.v}" ${p.category === c.v ? 'selected' : ''}>${c.l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Нийтэлсэн</label><input id="ef_publisher" value="${p.publisher || ''}"></div>
          <div class="form-group"><label>Үнэ</label><input id="ef_price" value="${p.price}"></div>
          <div class="form-group">
            <label>Статус</label>
            <select id="ef_status">
              <option value="standard" ${p.status === 'standard' ? 'selected' : ''}>Standard</option>
              <option value="premium"  ${p.status === 'premium'  ? 'selected' : ''}>Premium</option>
              <option value="pending"  ${p.status === 'pending'  ? 'selected' : ''}>Хүлээгдэж</option>
              <option value="rejected" ${p.status === 'rejected' ? 'selected' : ''}>Татгалзсан</option>
            </select>
          </div>
          <div class="form-group"><label>Зургийн нэр</label><input id="ef_img" value="${p.img || ''}"></div>
          <div class="form-group full">
            <label>Размер</label>
            <div class="size-checks">
              ${SIZES.map(s =>
                `<input type="checkbox" class="size-check" id="esz_${s}" value="${s}"
                        ${(p.sizes || []).includes(s) ? 'checked' : ''}>
                 <label class="size-label" for="esz_${s}">${s}</label>`).join('')}
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-gold" id="btn-save-edit" data-id="${p.id}">Хадгалах</button>
          <button class="btn btn-ghost" id="btn-cancel-edit">Болих</button>
        </div>
      </div>
    </div>`;
}

function saveEdit(id) {
  const p = DB.products.find(x => x.id == id);
  if (!p) return;

  p.brand     = $('ef_brand').value;
  p.name      = $('ef_name').value;
  p.desc      = $('ef_desc').value;
  p.category  = $('ef_cat').value;
  p.publisher = $('ef_publisher').value;
  p.price     = $('ef_price').value;
  p.status    = $('ef_status').value;
  p.img       = $('ef_img').value;
  p.sizes     = SIZES.filter(s => document.getElementById('esz_' + s)?.checked);

  toast('Хадгалагдлаа ✓', 'green');
  nav('admin/products');
}

/* ══════════════════════════════════════════
   PRODUCT ACTIONS
══════════════════════════════════════════ */
function approveP(id) {
  const p = DB.products.find(x => x.id == id);
  if (p) {
    p.status = 'standard';
    toast(`"${p.name}" зөвшөөрөгдлөө ✓`, 'green');
  }
  const hash = window.location.hash;
  renderAdmin(hash.includes('dashboard') ? 'dashboard' : 'products');
}

function rejectP(id) {
  const p = DB.products.find(x => x.id == id);
  if (p) {
    p.status = 'rejected';
    toast('Татгалзагдлаа', 'red');
  }
  const hash = window.location.hash;
  renderAdmin(hash.includes('dashboard') ? 'dashboard' : 'products');
}

function deleteP(id) {
  if (!confirm('Энэ барааг устгах уу?')) return;
  DB.products = DB.products.filter(x => x.id != id);
  toast('Устгагдлаа');
  renderAdmin('products');
}

function bindUsersEvents() {
  const input = document.getElementById('users-search-input');
  if (input) {
    input.addEventListener('input', function () {
      DB.search = this.value;
      renderAdmin('users');
    });
  }
}

/* ══════════════════════════════════════════
   ORDERS PAGE
══════════════════════════════════════════ */
function pageOrders() {
  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>RentFit</span> / <span>Захиалга</span></div>
        <h1>Захиалга</h1>
      </div>
    </div>
    <div class="content-body">
      <div class="table-card">
        <div class="table-head"><h3>Нийт захиалга</h3></div>
        <table class="data-table">
          <thead><tr>
            <th>Дугаар</th>
            <th>Хэрэглэгч</th>
            <th>Бараа</th>
            <th>Нийт</th>
            <th>Огноо</th>
            <th>Статус</th>
          </tr></thead>
          <tbody>
            <tr><td colspan="6">
              <div class="empty-state">
                <span class="empty-icon">&#128230;</span>
                Захиалга байхгүй байна
              </div>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   USERS PAGE
══════════════════════════════════════════ */
function pageUsers() {
  const filtered = DB.users.filter(u => {
    if (!DB.search) return true;
    const q = DB.search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q)
    );
  });

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>RentFit</span> / <span>Хэрэглэгч</span></div>
        <h1>Хэрэглэгч</h1>
      </div>
    </div>
    <div class="content-body">
      <div class="table-card">
        <div class="table-head">
          <h3>Нийт хэрэглэгч
            <span style="font-size:.72rem;color:var(--muted);font-weight:400">(${filtered.length})</span>
          </h3>
          <div class="table-toolbar">
            <div class="search-wrap">
              <input class="search-input" id="users-search-input" placeholder="Хайх..." value="${DB.search}">
            </div>
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Нэр</th>
            <th>И-мэйл</th>
            <th>Утас</th>
            <th>Захиалга</th>
            <th>Роль</th>
            <th>Статус</th>
          </tr></thead>
          <tbody>
            ${filtered.length
              ? filtered.map(u => `
                <tr>
                  <td>
                    <div style="font-weight:600;color:white">${u.name}</div>
                    ${u.createdAt ? `<div style="font-size:.65rem;color:var(--text3);margin-top:2px">${u.createdAt}</div>` : ''}
                  </td>
                  <td style="color:rgba(255,255,255,.5)">${u.email}</td>
                  <td style="color:rgba(255,255,255,.5)">${u.phone}</td>
                  <td>
                    <span style="font-family:'Space Mono',monospace;font-size:.75rem">${u.orders}</span>
                  </td>
                  <td>
                    <span style="font-size:.7rem;color:var(--text3);text-transform:capitalize">${u.role}</span>
                  </td>
                  <td>
                    <span class="badge ${u.status === 'active' ? 'active' : 'rejected'}">
                      ${u.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </td>
                </tr>`).join('')
              : `<tr><td colspan="6">
                   <div class="empty-state">
                     <span class="empty-icon">&#128269;</span>
                     Хэрэглэгч олдсонгүй
                   </div>
                 </td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>`;
}