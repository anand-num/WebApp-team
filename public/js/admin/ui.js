/* ╔══════════════════════════════════════════════════════════════╗
   ║  МОДУЛЬ: ui.js                                              ║
   ║  Зорилго: HTML DOM ашиглан хуудасны агуулгыг сольдог        ║
   ║           туслах функцууд                                   ║
   ║                                                             ║
   ║  [ШАЛГУУР] HTML DOM ашиглан хуудасны агуулгаа сольдог байна ║
   ╚══════════════════════════════════════════════════════════════╝ */

/* ── DOM shorthand ── */
export function $(id) { return document.getElementById(id); }
export function $q(sel, root = document) { return root.querySelector(sel); }
export function $qa(sel, root = document) { return root.querySelectorAll(sel); }

/* ══════════════════════════════════════════
   [ШАЛГУУР] DOM innerHTML-ээр хуудсыг сольно
   — applyPage нь #app элементийн дотоод HTML-г
     шууд сольдог гол функц
══════════════════════════════════════════ */
export function applyPage(html) {
  /* ▶ [ШАЛГУУР — HTML DOM] document.getElementById + innerHTML
        ашиглан бүх хуудасны агуулгыг солино */
  const app = $('app');
  if (app) app.innerHTML = html;
}

/* ══════════════════════════════════════════
   Toast мэдэгдэл
   ▶ [ШАЛГУУР — HTML DOM] toast элементийн
     className болон innerHTML-г DOM-оор сольно
══════════════════════════════════════════ */
let _toastTimer;
export function toast(msg, type = '') {
  const el = $('toast');
  if (!el) return;

  /* ▶ DOM дахь текстийг солино */
  el.innerHTML = (type === 'green' ? '✓ ' : type === 'red' ? '✕ ' : '') + msg;

  /* ▶ DOM дахь className-г солино */
  el.className = 'toast show ' + type;

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

/* ══════════════════════════════════════════
   Hash-аар навигац хийх
══════════════════════════════════════════ */
export function nav(page) {
  window.location.hash = page;
}

/* ══════════════════════════════════════════
   Бүтээгдэхүүний зургийн эсвэл placeholder HTML
══════════════════════════════════════════ */
export function productThumbHTML(p) {
  return `
    <img class="prod-thumb" src="${p.imgSrc}" alt="${p.name}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="prod-thumb-placeholder" style="display:none">&#128247;</div>`;
}

/* ── Бүтээгдэхүүний нэр+брэнд нүд ── */
export function productCellHTML(p) {
  return `
    <div class="prod-cell">
      ${productThumbHTML(p)}
      <div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-brand">${p.brand}</div>
      </div>
    </div>`;
}

/* ── Рэйтингийн нүд ── */
export function ratingCellHTML(p) {
  return `
    <div class="rating-row">
      <span class="stars">${p.starsHTML}</span>
      <span class="rating-num">${p.rating.toFixed(1)}</span>
      <span class="review-count">(${p.reviews})</span>
    </div>`;
}

/* ── Хоосон мөр ── */
export function emptyRowHTML(cols, icon, msg) {
  return `<tr><td colspan="${cols}">
    <div class="empty-state">
      <span class="empty-icon">${icon}</span>${msg}
    </div>
  </td></tr>`;
}

/* ── Sidebar nav товчны event bind хийх ── */
export function bindNav(id, fn) {
  const el = $(id);
  if (el) el.addEventListener('click', fn);
}