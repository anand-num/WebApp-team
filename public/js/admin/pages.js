/* ╔══════════════════════════════════════════════════════════════╗
   ║  МОДУЛЬ: pages.js                                           ║
   ║  Зорилго: Хуудас бүрийн HTML үүсгэж, DOM-д тавина          ║
   ║                                                             ║
   ║  [ШАЛГУУР] HTML DOM ашиглан хуудасны агуулгаа сольдог       ║
   ║  [ШАЛГУУР] Өгөгдөлтэй ажиллах, дүрслэхдээ функцуудыг       ║
   ║            зохиомжилж ашигласан байх                        ║
   ╚══════════════════════════════════════════════════════════════╝ */

import { DB } from './store.js';
import { CATS, SIZES, STATUS_LABEL } from './constants.js';
import {
  filterProducts, filterUsers, getProductStats, getSizesSummary
} from './api.js';
import {
  applyPage, toast, nav, $, bindNav,
  productCellHTML, ratingCellHTML, emptyRowHTML
} from './ui.js';

/* ══════════════════════════════════════════
   LOGIN хуудас
   ▶ [ШАЛГУУР — DOM] applyPage() → #app innerHTML солино
══════════════════════════════════════════ */
export function renderLogin() {
  /* ▶ [ШАЛГУУР — HTML DOM] Хуудасны агуулгыг innerHTML-ээр солино */
  applyPage(`
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
          <input type="password" id="a_pass" autocomplete="current-password">
        </div>
        <button class="btn btn-gold"
                style="width:100%;justify-content:center;padding:13px"
                id="loginBtn">
          Нэвтрэх &rarr;
        </button>
        <div class="login-hint"><strong>Туршилт:</strong> admin / rentfit2025</div>
      </div>
    </div>`);

  $('a_pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  $('loginBtn').addEventListener('click', doLogin);
  setTimeout(() => $('a_pass')?.focus(), 50);
}

function doLogin() {
  if ($('a_user').value === 'admin' && $('a_pass').value === 'rentfit2025') {
    DB.adminLoggedIn = true;
    nav('admin/dashboard');
  } else {
    /* ▶ [ШАЛГУУР — HTML DOM] Алдааны мөрийг DOM-д бичнэ */
    $('loginErr').innerHTML = '<div class="error-msg">Буруу нэр эсвэл нууц үг</div>';
  }
}

/* ══════════════════════════════════════════
   ADMIN SHELL — sidebar + content
   ▶ [ШАЛГУУР — DOM] applyPage() → бүх layout солигдоно
══════════════════════════════════════════ */
export function renderAdmin(sub, param) {
  if (!DB.adminLoggedIn) { nav('login'); return; }

  /* ▶ [ШАЛГУУР 3 — filter] Pending/rejected тоог filter-ээр гаргана */
  const pendingCount  = DB.products.filter(p => p.status === 'pending').length;
  const rejectedCount = DB.products.filter(p => p.status === 'rejected').length;
  const prodSubs = ['products', 'pending', 'rejected', 'add', 'edit'];
  const isProdActive = prodSubs.includes(sub);

  const sidebar = buildSidebar(sub, isProdActive, pendingCount, rejectedCount);

  let content = '';
  if      (sub === 'dashboard') content = pageDashboard();
  else if (sub === 'products')  content = pageAllProducts();
  else if (sub === 'pending')   content = pagePending();
  else if (sub === 'rejected')  content = pageRejected();
  else if (sub === 'add')       content = pageAdd();
  else if (sub === 'edit')      content = pageEdit(param);
  else if (sub === 'orders')    content = pageOrders();
  else if (sub === 'users')     content = pageUsers();
  else                          content = pageDashboard();

  /* ▶ [ШАЛГУУР — HTML DOM] Бүх layout-ыг нэг innerHTML дуудалтаар солино */
  applyPage(`
    <div class="page">
      <div class="admin-layout">
        ${sidebar}
        <div class="admin-content">${content}</div>
      </div>
    </div>`);

  bindSidebarEvents(sub);
  bindPageEvents(sub);
}

/* ── Sidebar HTML үүсгэх функц ── */
function buildSidebar(sub, isProdActive, pendingCount, rejectedCount) {
  return `
    <div class="admin-side">
      <div class="side-logo">
        <div class="wordmark">Rent<em>Fit</em></div>
        <div class="tagline">Admin Panel</div>
      </div>
      <div class="side-section">
        <div class="side-section-label">Үндсэн</div>
        <nav class="side-nav">
          <a id="nav-dashboard" class="${sub==='dashboard'?'active':''}">
            <span class="ico">&#9672;</span> Dashboard
          </a>
          <a id="nav-products" class="${isProdActive?'active':''}">
            <span class="ico">&#9673;</span> Бүтээгдэхүүн
            ${pendingCount ? `<span class="badge">${pendingCount}</span>` : ''}
          </a>
          ${isProdActive ? `
          <div class="side-sub-group">
            <a id="nav-prod-all" class="${sub==='products'?'sub-active':''}">
              <span class="sub-dot"></span> Бүгд
              <span class="sub-count">${DB.products.length}</span>
            </a>
            <a id="nav-prod-pending" class="${sub==='pending'?'sub-active':''}">
              <span class="sub-dot pending"></span> Хүлээгдэж буй
              ${pendingCount
                ? `<span class="sub-count warn">${pendingCount}</span>`
                : '<span class="sub-count">0</span>'}
            </a>
            <a id="nav-prod-rejected" class="${sub==='rejected'?'sub-active':''}">
              <span class="sub-dot rejected"></span> Татгалзсан
              <span class="sub-count">${rejectedCount}</span>
            </a>
          </div>` : ''}
          <a id="nav-orders" class="${sub==='orders'?'active':''}">
            <span class="ico">&#9676;</span> Захиалга
          </a>
          <a id="nav-users" class="${sub==='users'?'active':''}">
            <span class="ico">&#9678;</span> Хэрэглэгч
          </a>
        </nav>
      </div>
      <div class="side-footer">
        <nav class="side-nav">
          <a id="nav-logout"><span class="ico">&#8867;</span> Гарах</a>
        </nav>
      </div>
    </div>`;
}

function bindSidebarEvents(sub) {
  const reset = () => { DB.search = ''; };
  bindNav('nav-dashboard',     () => { reset(); nav('admin/dashboard'); });
  bindNav('nav-products',      () => { reset(); nav('admin/products'); });
  bindNav('nav-prod-all',      () => { reset(); nav('admin/products'); });
  bindNav('nav-prod-pending',  () => { reset(); nav('admin/pending'); });
  bindNav('nav-prod-rejected', () => { reset(); nav('admin/rejected'); });
  bindNav('nav-orders',        () => { reset(); nav('admin/orders'); });
  bindNav('nav-users',         () => { reset(); nav('admin/users'); });
  bindNav('nav-logout', () => {
    DB.adminLoggedIn = false;
    nav('login');
    toast('Амжилттай гарлаа');
  });
}

/* ── Page-specific event binding dispatcher ── */
function bindPageEvents(sub) {
  if      (sub === 'dashboard') bindDashboardEvents();
  else if (sub === 'products')  bindAllProductsEvents();
  else if (sub === 'pending')   bindPendingEvents();
  else if (sub === 'rejected')  bindRejectedEvents();
  else if (sub === 'add')       bindAddEvents();
  else if (sub === 'edit')      bindEditEvents();
  else if (sub === 'users')     bindUsersEvents();
}

/* ── Shared: wire approve/reject/restore/delete/edit buttons ── */
function bindActionButtons() {
  document.querySelectorAll('[data-edit]').forEach(
    btn => btn.addEventListener('click', () => nav('admin/edit/' + btn.dataset.edit))
  );
  document.querySelectorAll('[data-approve]').forEach(
    btn => btn.addEventListener('click', () => approveProduct(btn.dataset.approve))
  );
  document.querySelectorAll('[data-reject]').forEach(
    btn => btn.addEventListener('click', () => rejectProduct(btn.dataset.reject))
  );
  document.querySelectorAll('[data-restore]').forEach(
    btn => btn.addEventListener('click', () => restoreProduct(btn.dataset.restore))
  );
  document.querySelectorAll('[data-delete]').forEach(
    btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.delete))
  );
}

function bindDashboardEvents() {
  bindNav('btn-see-all',     () => nav('admin/products'));
  bindNav('btn-see-pending', () => nav('admin/pending'));
  bindActionButtons();
}
function bindAllProductsEvents() {
  bindNav('btn-add-product', () => nav('admin/add'));
  const si = $('search-input');
  if (si) si.addEventListener('input', function() { DB.search = this.value; renderAdmin('products'); });
  const fs = $('filter-select');
  if (fs) fs.addEventListener('change', function() { DB.filter = this.value; renderAdmin('products'); });
  bindActionButtons();
  bindNav('btn-goto-pending',  () => nav('admin/pending'));
  bindNav('btn-goto-rejected', () => nav('admin/rejected'));
}
function bindPendingEvents() {
  const si = $('search-input');
  if (si) si.addEventListener('input', function() { DB.search = this.value; renderAdmin('pending'); });
  bindNav('btn-approve-all', approveAll);
  bindActionButtons();
}
function bindRejectedEvents() {
  const si = $('search-input');
  if (si) si.addEventListener('input', function() { DB.search = this.value; renderAdmin('rejected'); });
  bindActionButtons();
}
function bindAddEvents() {
  bindNav('btn-save-new',   saveNew);
  bindNav('btn-cancel-add', () => nav('admin/products'));
}
function bindEditEvents() {
  const saveBtn = $('btn-save-edit');
  if (saveBtn) saveBtn.addEventListener('click', () => saveEdit(saveBtn.dataset.id));
  bindNav('btn-cancel-edit', () => nav('admin/products'));
}
function bindUsersEvents() {
  const si = $('users-search-input');
  if (si) si.addEventListener('input', function() { DB.search = this.value; renderAdmin('users'); });
}

/* ══════════════════════════════════════════
   DASHBOARD хуудас
   ▶ [ШАЛГУУР — reduce] getProductStats ашиглана
   ▶ [ШАЛГУУР — filter] pending барааг шүүнэ
══════════════════════════════════════════ */
function pageDashboard() {
  /* ▶ [ШАЛГУУР 3 — reduce] Нэг дамжилтаар бүх тоолол */
  const stats = getProductStats();

  const months = ['1-р','2-р','3-р','4-р','5-р','6-р','7-р'];
  const bars   = [28, 45, 38, 62, 74, 55, 80];
  const maxBar = Math.max(...bars);

  /* ▶ [ШАЛГУУР 3 — filter] Pending барааг шүүж, эхний 5-г авна */
  const pendingRows = DB.products.filter(p => p.status === 'pending').slice(0, 5);

  const dateStr = new Date().toLocaleDateString('mn-MN',
    { year:'numeric', month:'long', day:'numeric' });

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
          <div class="value">${stats.total}</div>
          <div class="delta">&#8593; ${stats.active} идэвхтэй</div>
        </div>
        <div class="stat-card clickable" id="btn-see-pending">
          <div class="stat-icon">&#9672;</div>
          <div class="label">Хүлээгдэж буй</div>
          <div class="value gold">${stats.pending}</div>
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
              <div class="chart-bar" style="height:${(h/maxBar)*100}%">
                <div class="chart-bar-tooltip">${h}</div>
              </div>
              <span class="chart-bar-lbl">${months[i]}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="table-card">
        <div class="table-head">
          <h3>Хүлээгдэж буй бараанууд
            <span class="count-pill pending-pill">${stats.pending}</span>
          </h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" id="btn-see-all">Бүгд харах &rarr;</button>
            <button class="btn btn-gold  btn-sm" id="btn-see-pending">Pending харах &rarr;</button>
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Бараа</th><th>Ангилал</th><th>Үнэ</th><th>Үйлдэл</th>
          </tr></thead>
          <tbody>
            ${pendingRows.length
              ? pendingRows.map(p => `
                  <tr>
                    <td>${productCellHTML(p)}</td>
                    <td>${p.categoryLabel}</td>
                    <td><span class="price-cell">${p.price}</span></td>
                    <td><div class="actions">
                      <button class="btn btn-success btn-sm" data-approve="${p.id}">&#10003; Зөвшөөрөх</button>
                      <button class="btn btn-danger  btn-sm" data-reject="${p.id}">&#10005; Татгалзах</button>
                    </div></td>
                  </tr>`).join('')
              : emptyRowHTML(4, '&#10003;', 'Хүлээгдэж буй бараа байхгүй')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   БҮХ БАРАА хуудас
   ▶ [ШАЛГУУР 3 — filter + join] filterProducts() ашиглана
   ▶ [ШАЛГУУР 3 — reduce] getProductStats() ашиглана
══════════════════════════════════════════ */
function pageAllProducts() {
  /* ▶ [ШАЛГУУР 3 — filter + join] Хайлт + статусаар шүүнэ */
  const list = filterProducts({ search: DB.search, status: DB.filter });
  /* ▶ [ШАЛГУУР 3 — reduce] Тоолол */
  const stats = getProductStats();

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>RentFit</span> / <span>Бүтээгдэхүүн</span> / <span>Бүгд</span></div>
        <h1>Бүх бараа</h1>
      </div>
      <button class="btn btn-gold" id="btn-add-product">+ Нэмэх</button>
    </div>
    <div class="content-body">

      <div class="prod-nav-cards">
        <div class="prod-nav-card active-card">
          <div class="pnc-label">Нийт идэвхтэй</div>
          <div class="pnc-value">${stats.active}</div>
          <div class="pnc-sub">Standard + Premium</div>
        </div>
        <div class="prod-nav-card pending-card" id="btn-goto-pending">
          <div class="pnc-label">Хүлээгдэж буй</div>
          <div class="pnc-value">${stats.pending}</div>
          <div class="pnc-sub">Шийдвэрлэх шаардлагатай &#8594;</div>
        </div>
        <div class="prod-nav-card rejected-card" id="btn-goto-rejected">
          <div class="pnc-label">Татгалзсан</div>
          <div class="pnc-value">${stats.rejected}</div>
          <div class="pnc-sub">Архив &#8594;</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-head">
          <h3>Бүгд <span class="count-pill">${list.length}</span></h3>
          <div class="table-toolbar">
            <input class="search-input" id="search-input" placeholder="Хайх..." value="${DB.search}">
            <select class="filter-select" id="filter-select">
              <option value="all"      ${DB.filter==='all'      ?'selected':''}>Бүгд</option>
              <option value="premium"  ${DB.filter==='premium'  ?'selected':''}>Premium</option>
              <option value="standard" ${DB.filter==='standard' ?'selected':''}>Standard</option>
              <option value="pending"  ${DB.filter==='pending'  ?'selected':''}>Хүлээгдэж</option>
              <option value="rejected" ${DB.filter==='rejected' ?'selected':''}>Татгалзсан</option>
            </select>
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Бараа</th><th>Нийтэлсэн</th><th>Рэйтинг</th>
            <th>Үнэ</th><th>Статус</th><th>Үйлдэл</th>
          </tr></thead>
          <tbody>
            ${list.length
              ? list.map(p => `
                  <tr>
                    <td>${productCellHTML(p)}</td>
                    <td style="color:var(--text3)">${p.publisher || '&mdash;'}</td>
                    <td>${ratingCellHTML(p)}</td>
                    <td>
                      <div class="price-cell">${p.price}</div>
                      <div class="price-period">${p.pricePeriod}</div>
                    </td>
                    <td><span class="badge ${p.status}">${p.statusLabel}</span></td>
                    <td><div class="actions">
                      <button class="btn-icon" data-edit="${p.id}" title="Засах">&#9998;</button>
                      ${p.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" data-approve="${p.id}">&#10003;</button>
                        <button class="btn btn-danger  btn-sm" data-reject="${p.id}">&#10005;</button>` : ''}
                      <button class="btn-icon" data-delete="${p.id}" title="Устгах">&#128465;</button>
                    </div></td>
                  </tr>`).join('')
              : emptyRowHTML(6, '&#128269;', 'Тохирох бараа олдсонгүй')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   PENDING хуудас
   ▶ [ШАЛГУУР 3 — filter + join] filterProducts ашиглана
══════════════════════════════════════════ */
function pagePending() {
  /* ▶ [ШАЛГУУР 3 — filter + join] Зөвхөн pending барааг шүүнэ */
  const list = filterProducts({ search: DB.search, status: 'pending' });

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb">
          <span>RentFit</span> / <span>Бүтээгдэхүүн</span> / <span>Хүлээгдэж буй</span>
        </div>
        <h1>Хүлээгдэж буй бараа</h1>
      </div>
      ${list.length
        ? `<div class="header-tag pending-tag">&#9203; ${list.length} шийдвэрлэх шаардлагатай</div>`
        : ''}
    </div>
    <div class="content-body">
      <div class="info-banner pending-banner">
        <span class="banner-icon">&#9203;</span>
        <div>
          <div class="banner-title">Батлах хүлээгдэж буй бараанууд</div>
          <div class="banner-sub">Эдгээр бараанууд нийтэд харагдахын өмнө таны зөвшөөрлийг хүлээж байна.</div>
        </div>
      </div>
      <div class="table-card">
        <div class="table-head">
          <h3>Хүлээгдэж буй <span class="count-pill pending-pill">${list.length}</span></h3>
          <div class="table-toolbar">
            <input class="search-input" id="search-input" placeholder="Хайх..." value="${DB.search}">
            ${list.length > 1
              ? `<button class="btn btn-success btn-sm" id="btn-approve-all">&#10003; Бүгдийг зөвшөөрөх</button>`
              : ''}
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Бараа</th><th>Нийтэлсэн</th><th>Ангилал</th>
            <th>Үнэ</th><th>Рэйтинг</th><th>Үйлдэл</th>
          </tr></thead>
          <tbody>
            ${list.length
              ? list.map(p => `
                  <tr class="pending-row">
                    <td>${productCellHTML(p)}</td>
                    <td style="color:var(--text3)">${p.publisher || '&mdash;'}</td>
                    <td><span style="font-size:.75rem;color:var(--text2)">${p.categoryLabel}</span></td>
                    <td>
                      <div class="price-cell">${p.price}</div>
                      <div class="price-period">${p.pricePeriod}</div>
                    </td>
                    <td>${ratingCellHTML(p)}</td>
                    <td><div class="actions">
                      <button class="btn btn-success btn-sm" data-approve="${p.id}">&#10003; Зөвшөөрөх</button>
                      <button class="btn btn-danger  btn-sm" data-reject="${p.id}">&#10005; Татгалзах</button>
                      <button class="btn-icon" data-edit="${p.id}" title="Засах">&#9998;</button>
                    </div></td>
                  </tr>`).join('')
              : emptyRowHTML(6, '&#10003;', 'Хүлээгдэж буй бараа байхгүй — бүгд шийдвэрлэгдсэн!')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   REJECTED хуудас
   ▶ [ШАЛГУУР 3 — filter + join] filterProducts ашиглана
══════════════════════════════════════════ */
function pageRejected() {
  /* ▶ [ШАЛГУУР 3 — filter + join] Зөвхөн rejected барааг шүүнэ */
  const list = filterProducts({ search: DB.search, status: 'rejected' });

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb">
          <span>RentFit</span> / <span>Бүтээгдэхүүн</span> / <span>Татгалзсан</span>
        </div>
        <h1>Татгалзсан бараа</h1>
      </div>
      ${list.length
        ? `<div class="header-tag rejected-tag">&#10005; ${list.length} татгалзсан</div>`
        : ''}
    </div>
    <div class="content-body">
      <div class="info-banner rejected-banner">
        <span class="banner-icon">&#10005;</span>
        <div>
          <div class="banner-title">Татгалзсан бараанууд</div>
          <div class="banner-sub">Эдгээр бараанууд нийтэд харагдахгүй. Шаардлагатай бол дахин сэргээж болно.</div>
        </div>
      </div>
      <div class="table-card">
        <div class="table-head">
          <h3>Татгалзсан <span class="count-pill rejected-pill">${list.length}</span></h3>
          <div class="table-toolbar">
            <input class="search-input" id="search-input" placeholder="Хайх..." value="${DB.search}">
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Бараа</th><th>Нийтэлсэн</th><th>Ангилал</th>
            <th>Үнэ</th><th>Рэйтинг</th><th>Үйлдэл</th>
          </tr></thead>
          <tbody>
            ${list.length
              ? list.map(p => `
                  <tr class="rejected-row">
                    <td>${productCellHTML(p)}</td>
                    <td style="color:var(--text3)">${p.publisher || '&mdash;'}</td>
                    <td><span style="font-size:.75rem;color:var(--text2)">${p.categoryLabel}</span></td>
                    <td>
                      <div class="price-cell">${p.price}</div>
                      <div class="price-period">${p.pricePeriod}</div>
                    </td>
                    <td>${ratingCellHTML(p)}</td>
                    <td><div class="actions">
                      <button class="btn btn-restore btn-sm" data-restore="${p.id}">&#8617; Сэргээх</button>
                      <button class="btn-icon" data-edit="${p.id}" title="Засах">&#9998;</button>
                      <button class="btn-icon" data-delete="${p.id}" title="Устгах">&#128465;</button>
                    </div></td>
                  </tr>`).join('')
              : emptyRowHTML(6, '&#9673;', 'Татгалзсан бараа байхгүй')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   НЭМЭХ хуудас
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
          <div class="form-group"><label>Барааны нэр *</label><input id="af_name"></div>
          <div class="form-group full"><label>Тайлбар</label><textarea id="af_desc"></textarea></div>
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
          <button class="btn btn-gold"  id="btn-save-new">Хадгалах</button>
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

  /* ▶ [ШАЛГУУР 3 — filter] Сонгосон хэмжээнүүдийг шүүнэ */
  const sizes = SIZES.filter(s => document.getElementById('sz_' + s)?.checked);

  if (!brand || !name || !cat || !price) {
    toast('Заавал талбаруудыг бөглөнө үү', 'red');
    return;
  }

  const newId = DB.products.length ? Math.max(...DB.products.map(p => p.id)) + 1 : 1;
  /* Шинэ Product объект үүсгэнэ */
  const raw = { brand, item_name: name, desc, publisher, price, price_period: 'өдрөөс',
                status, img_src: img, sizes: sizes.length ? sizes : ['S','M','L'],
                rating: 0, review_count: 0 };
  DB.products.push(new (class extends Object {
    constructor() {
      super();
      Object.assign(this, raw);
      this.id = newId;
      this.name = name; this.brand = brand; this.desc = desc;
      this.category = 'dress'; this.publisher = publisher; this.price = price;
      this.pricePeriod = 'өдрөөс'; this.status = status; this.img = img;
      this.sizes = sizes.length ? sizes : ['S','M','L'];
      this.rating = 0; this.reviews = 0;
    }
    get categoryLabel() { return CATS.find(c=>c.v===this.category)?.l || this.category; }
    get starsHTML() { return ''; }
    get imgSrc() { return '../json/' + this.img; }
    get statusLabel() { return STATUS_LABEL[this.status] || this.status; }
  })());

  toast('Амжилттай нэмэгдлээ ✓', 'green');
  nav('admin/products');
}

/* ── ЗАСАХ хуудас ── */
function pageEdit(id) {
  const p = DB.products.find(x => x.id == id);
  if (!p) return '<div class="content-body"><p style="color:var(--muted);padding:36px">Бараа олдсонгүй</p></div>';

  return `
    <div class="content-header">
      <div class="content-header-left">
        <div class="breadcrumb"><span>Бүтээгдэхүүн</span> / <span>Засах</span></div>
        <h1>${p.name}</h1>
      </div>
      <span class="badge ${p.status}" style="align-self:center;font-size:.72rem;padding:5px 12px">${p.statusLabel}</span>
    </div>
    <div class="content-body">
      <div class="form-card">
        <div class="form-grid">
          <div class="form-group"><label>Брэнд</label><input id="ef_brand" value="${p.brand}"></div>
          <div class="form-group"><label>Нэр</label><input id="ef_name" value="${p.name}"></div>
          <div class="form-group full"><label>Тайлбар</label><textarea id="ef_desc">${p.desc||''}</textarea></div>
          <div class="form-group">
            <label>Ангилал</label>
            <select id="ef_cat">
              ${CATS.filter(c=>c.v!=='all').map(c=>
                `<option value="${c.v}" ${p.category===c.v?'selected':''}>${c.l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Нийтэлсэн</label><input id="ef_publisher" value="${p.publisher||''}"></div>
          <div class="form-group"><label>Үнэ</label><input id="ef_price" value="${p.price}"></div>
          <div class="form-group">
            <label>Статус</label>
            <select id="ef_status">
              <option value="standard" ${p.status==='standard'?'selected':''}>Standard</option>
              <option value="premium"  ${p.status==='premium' ?'selected':''}>Premium</option>
              <option value="pending"  ${p.status==='pending' ?'selected':''}>Хүлээгдэж</option>
              <option value="rejected" ${p.status==='rejected'?'selected':''}>Татгалзсан</option>
            </select>
          </div>
          <div class="form-group"><label>Зургийн нэр</label><input id="ef_img" value="${p.img||''}"></div>
          <div class="form-group full">
            <label>Размер</label>
            <div class="size-checks">
              ${SIZES.map(s =>
                `<input type="checkbox" class="size-check" id="esz_${s}" value="${s}"
                        ${(p.sizes||[]).includes(s)?'checked':''}>
                 <label class="size-label" for="esz_${s}">${s}</label>`).join('')}
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-gold"  id="btn-save-edit" data-id="${p.id}">Хадгалах</button>
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
  /* ▶ [ШАЛГУУР 3 — filter] Сонгогдсон хэмжээнүүдийг шүүнэ */
  p.sizes = SIZES.filter(s => document.getElementById('esz_' + s)?.checked);
  toast('Хадгалагдлаа ✓', 'green');
  nav('admin/products');
}

/* ── ЗАХИАЛГА хуудас ── */
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
            <th>Дугаар</th><th>Хэрэглэгч</th><th>Бараа</th>
            <th>Нийт</th><th>Огноо</th><th>Статус</th>
          </tr></thead>
          <tbody>${emptyRowHTML(6, '&#128230;', 'Захиалга байхгүй байна')}</tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   ХЭРЭГЛЭГЧ хуудас
   ▶ [ШАЛГУУР 3 — filter + join] filterUsers ашиглана
   ▶ User класс getter-үүдийг ашиглана
══════════════════════════════════════════ */
function pageUsers() {
  /* ▶ [ШАЛГУУР 3 — filter + join] Хэрэглэгчдийг хайлтаар шүүнэ */
  const list = filterUsers(DB.search);

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
          <h3>Нийт хэрэглэгч <span class="count-pill">${list.length}</span></h3>
          <div class="table-toolbar">
            <input class="search-input" id="users-search-input" placeholder="Хайх..." value="${DB.search}">
          </div>
        </div>
        <table class="data-table">
          <thead><tr>
            <th>Нэр</th><th>И-мэйл</th><th>Утас</th><th>Захиалга</th><th>Роль</th><th>Статус</th>
          </tr></thead>
          <tbody>
            ${list.length
              ? list.map(u => `
                  <tr>
                    <td>
                      <div style="font-weight:600;color:var(--text)">${u.name}</div>
                      ${u.createdAt
                        ? `<div style="font-size:.65rem;color:var(--text3);margin-top:2px">${u.createdAt}</div>`
                        : ''}
                    </td>
                    <td style="color:var(--text2)">${u.email}</td>
                    <td style="color:var(--text2)">${u.phone}</td>
                    <td><span style="font-family:'Space Mono',monospace;font-size:.75rem">${u.orders}</span></td>
                    <td><span style="font-size:.72rem;color:var(--text3);text-transform:capitalize">${u.role}</span></td>
                    <td>
                      <!-- ▶ User класс getter ашиглана -->
                      <span class="badge ${u.statusClass}">${u.statusLabel}</span>
                    </td>
                  </tr>`).join('')
              : emptyRowHTML(6, '&#128269;', 'Хэрэглэгч олдсонгүй')
            }
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   БАРАА ҮЙЛДЛҮҮД
══════════════════════════════════════════ */
function currentSub() {
  const h = window.location.hash;
  if (h.includes('pending'))   return 'pending';
  if (h.includes('rejected'))  return 'rejected';
  if (h.includes('dashboard')) return 'dashboard';
  return 'products';
}

export function approveProduct(id) {
  const p = DB.products.find(x => x.id == id);
  if (p) { p.status = 'standard'; toast(`"${p.name}" зөвшөөрөгдлөө ✓`, 'green'); }
  renderAdmin(currentSub());
}

export function rejectProduct(id) {
  const p = DB.products.find(x => x.id == id);
  if (p) { p.status = 'rejected'; toast(`"${p.name}" татгалзагдлаа`, 'red'); }
  renderAdmin(currentSub());
}

export function restoreProduct(id) {
  const p = DB.products.find(x => x.id == id);
  if (p) { p.status = 'standard'; toast(`"${p.name}" сэргээгдлээ ✓`, 'green'); }
  renderAdmin('rejected');
}

export function deleteProduct(id) {
  if (!confirm('Энэ барааг устгах уу?')) return;
  /* ▶ [ШАЛГУУР 3 — filter] Устгахдаа filter ашиглана */
  DB.products = DB.products.filter(x => x.id != id);
  toast('Устгагдлаа');
  renderAdmin(currentSub());
}

export function approveAll() {
  /* ▶ [ШАЛГУУР 3 — filter] Pending барааг олж статусыг өөрчилнэ */
  const pending = DB.products.filter(p => p.status === 'pending');
  pending.forEach(p => { p.status = 'standard'; });
  toast(`${pending.length} бараа зөвшөөрөгдлөө ✓`, 'green');
  renderAdmin('pending');
}