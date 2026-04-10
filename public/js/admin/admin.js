
import { loadData }     from './api.js';
import { renderLogin, renderAdmin } from './pages.js';
import { DB }           from './store.js';

/* ══════════════════════════════════════════
   ROUTER
   ▶ URL hash-аар ямар хуудас үзүүлэхийг шийдэнэ
   ▶ [ШАЛГУУР — DOM] hashchange event → DOM-д шинэ хуудас бичнэ
══════════════════════════════════════════ */
async function render() {
  const hash = window.location.hash.slice(1) || 'login';
  const [page, ...params] = hash.split('/');

  if (page === 'login' || page === '') {
    renderLogin();
    return;
  }

  if (page === 'admin') {
    /* Өгөгдлийг татаж авсны дараа хуудас харуулна */
    await loadData();
    renderAdmin(params[0] || 'dashboard', params[1]);
    return;
  }

  renderLogin();
}

/* ── Hash өөрчлөгдөхөд router ажиллана ── */
window.addEventListener('hashchange', render);

/* ── Хуудас анх ачаалагдахад router ажиллана ── */
window.addEventListener('load', render);