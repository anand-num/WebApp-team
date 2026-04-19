/* ══════════════════════════════════════════════════════════
   MODULE — Cart
   Shared cart storage class used across all pages
══════════════════════════════════════════════════════════ */

export default class Cart {
  #key;

  constructor(key = 'rf_cart') {
    this.#key = key;
  }

  // ── Storage ─────────────────────────────────────────────
  getItems() {
    try { return JSON.parse(localStorage.getItem(this.#key)) || []; }
    catch { return []; }
  }

  save(items) {
    localStorage.setItem(this.#key, JSON.stringify(items));
  }

  // ── Add product from product.json format ────────────────
  addProduct(product) {
    const items = this.getItems();
    if (items.some(i => i.id === product.id)) return false;
    items.push({
      id:           product.id,
      name:         product.item_name,
      brand:        product.brand,
      img:          product.img_src,
      // product.sizes нь хоёр өөр хэлбэрээр ирж болно:
      //   1) Массив хэлбэрээр — жш: ["S", "M", "L"]
      //   2) Нэг утга хэлбэрээр — жш: "M"
      // Array.isArray() — массив мөн эсэхийг шалгана, үнэн/худал буцаана
      // Массив бол эхний хэмжээг авна (product.sizes[0])
      // Массив биш бол шууд ашиглана (product.sizes)
      size: (function() {
        if (Array.isArray(product.sizes)) {
          return product.sizes[0]; // жш: ["S","M","L"] → "S"
        } else {
          return product.sizes;    // жш: "M" → "M"
        }
      })(),
      basePrice:    parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0,
      selectedDays: 1,
    });
    this.save(items);
    return true;
  }

  // ── Add pre-formatted cart item ─────────────────────────
  addItem(item) {
    const items = this.getItems();
    if (items.some(i => i.id === item.id)) return false;
    items.push(item);
    this.save(items);
    return true;
  }

  // ── Queries ─────────────────────────────────────────────
  has(id) {
    return this.getItems().some(i => i.id === id);
  }

  // ── Mutations ───────────────────────────────────────────
  remove(id) {
    this.save(this.getItems().filter(i => i.id !== id));
  }

  clear() {
    this.save([]);
  }

  // ── Aggregation ─────────────────────────────────────────
  total(priceFn) {
    return this.getItems().reduce((sum, item) => sum + priceFn(item), 0);
  }
}
