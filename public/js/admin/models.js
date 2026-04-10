import { CATS } from './constants.js';

/* ══════════════════════════════════════════
   Product класс
   — JSON raw өгөгдлийг хүлээн авч,
     апликейшнд хэрэгтэй хэлбэрт оруулна
══════════════════════════════════════════ */
export class Product {
  constructor(raw, index) {
    this.id          = index + 1;

    /* [ШАЛГУУР] map ашиглан өгөгдлийг хувиргах — replace нь map дотор ажиллана */
    this.brand       = (raw.brand      || '').replace(/_/g, ' ');
    this.name        = (raw.item_name  || '').replace(/_/g, ' ');
    this.publisher   = raw.publisher   || '';
    this.rating      = raw.rating      || 0;
    this.reviews     = raw.review_count || 0;
    this.price       = raw.price       || '';
    this.pricePeriod = raw.price_period || '';
    this.status      = (raw.status     || 'standard').toLowerCase();
    this.img         = raw.img_src     || '';
    this.category    = Product.guessCategory(raw.item_name || '', raw.brand || '');
    this.sizes       = raw.sizes       || ['S', 'M', 'L'];
    this.desc        = raw.desc        || '';
  }

  /* Категорийг нэрнээс таах — статик функц */
  static guessCategory(name, brand) {
    const n = (name + ' ' + brand).toLowerCase();
    if (/deel|mongol|queen|olimpic|male_cost/.test(n)) return 'traditional';
    if (/dress|gown|ballroom|tango|wedding|kimono|violet|evergarden|anna|blue/.test(n)) return 'dress';
    if (/costume|bear|disney/.test(n)) return 'costume';
    return 'dress';
  }

  /* Хэрэглэгчид харагдах категорийн нэр буцаана */
  get categoryLabel() {
    return CATS.find(c => c.v === this.category)?.l || this.category;
  }

  /* Одтой рэйтинг HTML буцаана */
  get starsHTML() {
    return '&#9733;'.repeat(Math.floor(this.rating));
  }

  /* Зургийн эх зам */
  get imgSrc() {
    return '../json/' + this.img;
  }

  /* Статус шошго */
  get statusLabel() {
    const map = { premium:'Premium', standard:'Standard', pending:'Хүлээгдэж', rejected:'Татгалзсан' };
    return map[this.status] || this.status;
  }
}

/* ══════════════════════════════════════════
   User класс
   — users.json raw өгөгдлийг хувиргана
══════════════════════════════════════════ */
export class User {
  constructor(raw, index) {
    this.id        = raw.id        || index + 1;
    this.name      = raw.name      || raw.username  || raw.full_name || '—';
    this.email     = raw.email     || '—';
    this.phone     = raw.phone     || raw.phone_number || '—';
    this.orders    = raw.orders    || raw.order_count  || 0;
    this.status    = (raw.status   || 'active').toLowerCase();
    this.role      = raw.role      || 'user';
    this.createdAt = raw.created_at || raw.createdAt || '';
  }

  get isActive() { return this.status === 'active'; }
  get statusLabel() { return this.isActive ? 'Идэвхтэй' : 'Идэвхгүй'; }
  get statusClass() { return this.isActive ? 'active' : 'rejected'; }
}