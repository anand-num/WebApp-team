import { DB } from './store.js';
import { Product, User } from './models.js';
import { JSON_PATHS } from './constants.js';

/* ══════════════════════════════════════════
 fetch — Бүх өгөгдлийг зэрэг татна
══════════════════════════════════════════ */
export async function loadData() {
  /* Promise.all — хоёр fetch зэрэг явна, хоёулаа дуусахыг хүлээнэ */
  await Promise.all([loadProducts(), loadUsers()]);
}

/* ── Products татах ── */
export async function loadProducts() {
  if (DB.productsLoaded) return;

  try {
    /*  [ШАЛГУУР 2] fetch ашиглан ../json/product.json татна */
    const response = await fetch(JSON_PATHS.products);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    /*  [ШАЛГУУР 1] JSON өгөгдлийг JavaScript объект болгоно */
    const rawArray = await response.json();

    /*  [ШАЛГУУР 3 — map] Хариу массивын элемент бүрийг
          Product класс болгон хувиргана */
    DB.products = rawArray.map((raw, i) => new Product(raw, i));

    DB.productsLoaded = true;
  } catch (err) {
    console.warn('product.json татаж чадсангүй:', err.message);
    DB.productsLoaded = true;
  }
}

/* ── Users татах ── */
export async function loadUsers() {
  if (DB.usersLoaded) return;

  try {
    /*  [ШАЛГУУР 2] fetch ашиглан ../json/users.json татна */
    const response = await fetch(JSON_PATHS.users);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    /*  [ШАЛГУУР 1] JSON хариуг объект болгоно */
    const rawArray = await response.json();

    /*  [ШАЛГУУР 3 — map] Хариу массивын элемент бүрийг
          User класс болгон хувиргана */
    DB.users = rawArray.map((raw, i) => new User(raw, i));

    DB.usersLoaded = true;
  } catch (err) {
    console.warn('users.json татаж чадсангүй:', err.message);
    DB.usersLoaded = true;
  }
}

/* ══════════════════════════════════════════
    map, filter, reduce, join —
    Өгөгдлийг шүүж хувиргах тусгайлсан функцууд
══════════════════════════════════════════ */

/*
 * filterProducts(options)
 *  filter — статус болон хайлтаар шүүнэ
 *  map    — дотоод Product объект хэвээр (аль хэдийн map хийгдсэн)
 */
export function filterProducts({ search = '', status = 'all' } = {}) {
  /*  [ШАЛГУУР 3 — filter] Хайлтын утгаар шүүнэ */
  let result = DB.products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    /*  join ашиглан хайлтын талбаруудыг нэгтгэнэ */
    const haystack = [p.name, p.brand, p.publisher].join(' ').toLowerCase();
    return haystack.includes(q);
  });

  /*  [ШАЛГУУР 3 — filter] Статусаар нэмж шүүнэ */
  if (status !== 'all') {
    result = result.filter(p => p.status === status);
  }

  return result;
}

/*
 * getProductStats()
 *  reduce — нэг дамжилтаар бүх тоолол гаргана
 */
export function getProductStats() {
  /*  [ШАЛГУУР 3 — reduce] Нэг дамжилтаар бүх тоо гаргана */
  return DB.products.reduce(
    (acc, p) => {
      acc.total++;
      if (p.status === 'pending')  acc.pending++;
      if (p.status === 'pending')  acc.pending++;
      if (p.status === 'rejected') acc.rejected++;
      if (p.status === 'standard' || p.status === 'premium') acc.active++;
      return acc;
    },
    { total: 0, active: 0, pending: 0, rejected: 0 }
  );
}

/*
 * getCategorySummary()
 *  reduce — категори тус бүрийн барааны тоог гаргана
 *  map    — үр дүнг массив болгон хувиргана
 *  join   — хүн уншихад тохиромжтой тайлан мөр болгоно
 */
export function getCategorySummary() {
  /*  [ШАЛГУУР 3 — reduce] Категориор бүлэглэнэ */
  const grouped = DB.products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  /*  [ШАЛГУУР 3 — map] Объектыг харагдахуйц массив болгоно */
  const lines = Object.entries(grouped)
    .map(([cat, count]) => `${cat}: ${count}`);

  /*  [ШАЛГУУР 3 — join] Массивыг мөр болгоно */
  return lines.join(' | ');
}

/*
 * filterUsers(search)
 *  filter — нэр/имэйл/утасаар шүүнэ
 *  join   — хайлтын талбаруудыг нэгтгэхэд
 */
export function filterUsers(search = '') {
  /*  [ШАЛГУУР 3 — filter] Хэрэглэгчдийг хайлтаар шүүнэ */
  return DB.users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    /*  [ШАЛГУУР 3 — join] Талбаруудыг нэгтгэж нэг хайлтаар шалгана */
    const haystack = [u.name, u.email, u.phone].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

/*
 * getSizesSummary(product)
 *  filter — сонгогдсон хэмжээнүүдийг гаргана
 *  join   — таслалаар нэгтгэнэ
 */
export function getSizesSummary(product) {
  /*  [ШАЛГУУР 3 — filter + join] Хэмжээнүүдийг шүүж, нэгтгэнэ */
  return (product.sizes || [])
    .filter(s => s)
    .join(', ');
}