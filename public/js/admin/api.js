import { DB } from './store.js';
import { Product, User } from './models.js';

const API = 'http://localhost:3000/api';

/* ══════════════════════════════════════════
   fetch — Бүх өгөгдлийг зэрэг татна
══════════════════════════════════════════ */
export async function loadData() {
  await Promise.all([loadProducts(), loadUsers()]);
}

/* ── Products татах ── */
export async function loadProducts() {
  if (DB.productsLoaded) return;

  try {
    // JSON файлаас биш API-с авах — бүх статустай бараа (admin-д хэрэгтэй)
    const response = await fetch(`${API}/products/all`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawArray = await response.json();
    DB.products = rawArray.map((raw, i) => new Product(raw, i));
    DB.productsLoaded = true;
  } catch (err) {
    console.warn('Products татаж чадсангүй:', err.message);
    DB.productsLoaded = true;
  }
}

/* ── Users татах ── */
export async function loadUsers() {
  if (DB.usersLoaded) return;

  try {
    const response = await fetch(`${API}/users`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawArray = await response.json();
    DB.users = rawArray.map((raw, i) => new User(raw, i));
    DB.usersLoaded = true;
  } catch (err) {
    console.warn('Users татаж чадсангүй:', err.message);
    DB.usersLoaded = true;
  }
}

/* ══════════════════════════════════════════
   БАРАА ҮЙЛДЛҮҮД — API дуудах
══════════════════════════════════════════ */

export async function approveProductAPI(id) {
  await fetch(`${API}/products/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'standard' })
  });
  // DB дотор шууд өөрчлөх — дахин fetch хийхгүй
  const p = DB.products.find(x => x.id == id);
  if (p) p.status = 'standard';
}

export async function rejectProductAPI(id) {
  await fetch(`${API}/products/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected' })
  });
  const p = DB.products.find(x => x.id == id);
  if (p) p.status = 'rejected';
}

export async function deleteProductAPI(id) {
  await fetch(`${API}/products/${id}`, { method: 'DELETE' });
  DB.products = DB.products.filter(x => x.id != id);
}

export async function saveProductAPI(id, data) {
  await fetch(`${API}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function addProductAPI(data) {
  const response = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
}

/* ══════════════════════════════════════════
   Filter функцууд — өөрчлөгдөхгүй
══════════════════════════════════════════ */

export function filterProducts({ search = '', status = 'all' } = {}) {
  let result = DB.products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const haystack = [p.name, p.brand, p.publisher].join(' ').toLowerCase();
    return haystack.includes(q);
  });

  if (status !== 'all') {
    result = result.filter(p => p.status === status);
  }

  return result;
}

export function getProductStats() {
  return DB.products.reduce(
    (acc, p) => {
      acc.total++;
      if (p.status === 'pending')  acc.pending++;
      if (p.status === 'rejected') acc.rejected++;
      if (p.status === 'standard' || p.status === 'premium') acc.active++;
      return acc;
    },
    { total: 0, active: 0, pending: 0, rejected: 0 }
  );
}

export function filterUsers(search = '') {
  return DB.users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    const haystack = [u.name, u.email, u.phone].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

export function getSizesSummary(product) {
  return (product.sizes || []).filter(s => s).join(', ');
}

export function getCategorySummary() {
  const grouped = DB.products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(' | ');
}