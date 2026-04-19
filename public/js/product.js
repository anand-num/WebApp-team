/* ══════════════════════════════════════════════════════════
   RENTFIT — product.js
   URL дахь ?id=X ашиглан product.json-оос бүтээгдэхүүний
   дэлгэрэнгүй хуудсыг динамикаар дүүргэнэ
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js-ийн нэг instance үүсгэнэ — сагстай ажиллах бүх үйлдэлд ашиглана
const cart = new Cart();

// Тоог Монгол мөнгөний форматад хөрвүүлнэ — жш: 3000 → "3,000₮"
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

// Үнийн string-ийг цэвэр тоо болгоно — жш: "3,000₮" → 3000
function parsePrice(s) {
  return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;
}

// Түрээсийн хугацааны сонголтууд — id, өдрийн тоо, үнийн үржигч
const DURATIONS = [
  { id: 'd1', days: 1, mult: 1   }, // 1 өдөр — үндсэн үнэ
  { id: 'd3', days: 3, mult: 1.5 }, // 3 өдөр — үндсэн үнийн 1.5 дахин
  { id: 'd7', days: 7, mult: 2.5 }, // 7 өдөр — үндсэн үнийн 2.5 дахин
];

// ── ProductPage класс ────────────────────────────────────
class ProductPage {
  #product; // Одоогийн бүтээгдэхүүний мэдээлэл
  #reviews; // Энэ бүтээгдэхүүний сэтгэгдлүүд
  #base;    // Үндсэн үнэ (тоон хэлбэрт)

  constructor(product, reviews) {
    this.#product = product;
    this.#reviews = reviews;
    // parsePrice() — product.price string-ийг цэвэр тоо болгоно
    this.#base    = parsePrice(product.price);
  }

  // Нийт сэтгэгдлийн тоо — get ашиглан property шиг дуудагдана
  get reviewCount() {
    return this.#reviews.length;
  }

  // Дундаж үнэлгээ тооцно
  get avgRating() {
    // Сэтгэгдэл байхгүй бол бүтээгдэхүүний өөрийн үнэлгээг ашиглана
    if (!this.reviewCount) return this.#product.rating;

    // .reduce() — бүх үнэлгээний нийлбэрийг тооцно
    const sum = this.#reviews.reduce(function(s, r) { return s + r.rating; }, 0);

    // sum / reviewCount — дундаж тооцно
    // * 10 → round → / 10 — нэг аравтын бутархайд дугуйлах арга
    // жш: 4.666 → 46.66 → 47 → 4.7
    return Math.round((sum / this.reviewCount) * 10) / 10;
  }

  // ── Бүтээгдэхүүний дэлгэрэнгүй хуудсыг дүүргэнэ ────────
  render() {
    const p = this.#product;

    // Хөтчийн таб дахь гарчгийг өөрчилнэ
    document.title = `${p.item_name} — RentFit`;

    // Breadcrumb (навигацийн мөр) дэх ангилал болон нэрийг тохируулна
    document.getElementById('bc-category').textContent = p.category;
    document.getElementById('bc-name').textContent     = p.item_name;

    // Бүтээгдэхүүний зургийг тохируулна
    const img = document.getElementById('pd-img');
    img.src = `/public/source/${p.img_src}`;
    img.alt = p.item_name;

    // Бүтээгдэхүүний үндсэн мэдээллийг дүүргэнэ
    document.getElementById('pd-brand').textContent        = p.brand;
    document.getElementById('pd-name').textContent         = p.item_name;

    // '★'.repeat(N) — N удаа давтана, Math.round() — ойрын бүхэл тоо
    document.getElementById('pd-stars').textContent        = '★'.repeat(Math.round(this.avgRating));
    document.getElementById('pd-rating').textContent       = this.avgRating;
    document.getElementById('pd-review-count').textContent = `(${this.reviewCount} үнэлгээ)`;
    document.getElementById('pd-stock').textContent        = `${p.shirheg} ширхэг бэлэн`;
    document.getElementById('pd-desc').textContent         = p.description;

    // ── Хугацааны үнийг тооцоолж харуулна ────────────────
    // Destructuring { id, mult } — объектоос зөвхөн id болон mult-ийг авна
    DURATIONS.forEach(function(duration) {
      const el = document.getElementById(`price-${duration.id}`);
      if (el) {
        // Math.round() — бүхэл тоо болгоно, fmt() — мөнгөний формат
        el.textContent = fmt(Math.round(this.#base * duration.mult));
      }
    }.bind(this));

    // ── Хэмжээний сонголт (radio товчнуудыг) үүсгэнэ ────
    const szOpts = document.getElementById('sz-opts');

    // p.sizes массив байвал шууд авна, байхгүй бол нэг элементтэй массив болгоно
    const sizes = Array.isArray(p.sizes) ? p.sizes : [p.sizes];

    sizes.forEach(function(size, i) {
      // Radio input үүсгэнэ
      const input  = document.createElement('input');
      input.type   = 'radio';
      input.name   = 'sz';          // Нэг бүлэгт хамрагдана — зөвхөн нэгийг сонгож болно
      input.id     = `sz${size}`;   // жш: id="szM"
      input.value  = size;          // жш: value="M"

      // i === 0 — эхний хэмжээг анхдагчаар сонгосон болгоно
      if (i === 0) { input.checked = true; }

      // Label үүсгэнэ — input-тай холбогдоно
      const label      = document.createElement('label');
      label.htmlFor    = `sz${size}`; // input-ийн id-тай тохирно
      label.textContent = size;

      // DOM-д нэмнэ
      szOpts.appendChild(input);
      szOpts.appendChild(label);
    });

    this.renderReviews();   // Сэтгэгдлүүдийг харуулна
    this.setupListeners();  // Товчнуудын үйлдлүүдийг холбоно
  }

  // ── Сэтгэгдлүүдийг харуулна ─────────────────────────────
  renderReviews() {
    const container = document.getElementById('review-container');
    if (!container) return;

    // Сэтгэгдэл байхгүй бол мэдэгдэл харуулна
    if (!this.reviewCount) {
      container.innerHTML = '<p style="color:var(--muted);font-size:.9rem;">Үнэлгээ байхгүй байна.</p>';
      return;
    }

    // Сэтгэгдэл бүрийг HTML болгож харуулна
    // '★'.repeat(rv.rating) — дүүрсэн од
    // '☆'.repeat(5 - rv.rating) — хоосон од (5-р хасна, жш: 4 одтой бол 1 хоосон)
    container.innerHTML = this.#reviews.map(function(rv) {
      return `
      <article class="review-card">
        <p class="stars">${'★'.repeat(rv.rating)}${'☆'.repeat(5 - rv.rating)}</p>
        <p>${rv.comment}</p>
        <hr>
        <footer>
          <p class="reviewer-initial">${rv.name.charAt(0)}</p>
          <strong>${rv.name}</strong>
        </footer>
      </article>`;
    }).join('');
  }

  // ── Сонгосон хугацааны нийт үнийг шинэчилнэ ────────────
  updateTotal() {
    // Сонгогдсон хугацааны radio товчийг олно
    const checked = document.querySelector('input[name="dur"]:checked');

    // checked байвал утгыг авна, байхгүй бол 3 өдрийг анхдагч болгоно
    const days = checked ? parseInt(checked.value, 10) : 3;

    // DURATIONS-аас тохирох объектийг хайна, олдохгүй бол 3 өдрийн (индекс 1) ашиглана
    const dur = DURATIONS.find(function(d) { return d.days === days; }) || DURATIONS[1];

    // Нийт үнийг тооцоолж харуулна
    document.getElementById('pd-total-price').textContent = fmt(Math.round(this.#base * dur.mult));
  }

  // ── Сагсны товчны текстийг синхрончилна ────────────────
  syncCartBtn(btn) {
    // cart.has() — бараа сагсанд байвал "Сагснаас хасах", байхгүй бол "Сагсанд нэмэх"
    btn.textContent = cart.has(this.#product.id) ? 'Сагснаас хасах' : 'Сагсанд нэмэх';
  }

  // ── Товчнуудын үйлдлүүдийг холбоно ─────────────────────
  setupListeners() {
    const p = this.#product;

    // Хугацааны radio товч өөрчлөгдөх бүрт нийт үнийг шинэчилнэ
    document.querySelectorAll('input[name="dur"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        this.updateTotal();
      }.bind(this));
    }.bind(this));

    // Хуудас нээгдэхэд нийт үнийг анхны утгаар тооцоолно
    this.updateTotal();

    // ── Сагсны товч ────────────────────────────────────
    const cartBtn = document.getElementById('btn-cart');

    // Товчны текстийг одоогийн сагсны төлөвтэй синхрончилна
    this.syncCartBtn(cartBtn);

    cartBtn.addEventListener('click', function() {
      if (cart.has(p.id)) {
        // Аль хэдийн сагсанд байвал хасна
        cart.remove(p.id);
      } else {
        // Сагсанд байхгүй бол нэмнэ

        // Сонгогдсон хэмжээг олно
        // ?.value — элемент байвал .value авна, null байвал undefined
        const selectedSizeEl = document.querySelector('input[name="sz"]:checked');
        const size = selectedSizeEl
          ? selectedSizeEl.value
          : (Array.isArray(p.sizes) ? p.sizes[0] : p.sizes); // Байхгүй бол эхний хэмжээ

        // Сонгогдсон хугацааг олно — байхгүй бол '3' анхдагч
        const selectedDurEl = document.querySelector('input[name="dur"]:checked');
        const days = parseInt(selectedDurEl ? selectedDurEl.value : '3', 10);

        // Сагсанд нэмэх объект үүсгэнэ
        cart.addItem({
          id         : p.id,
          name       : p.item_name,
          brand      : p.brand,
          img        : p.img_src,
          size       : size,
          basePrice  : this.#base,
          selectedDays: days,
        });
      }

      // Товчны текстийг шинэ төлөвтэй синхрончилна
      this.syncCartBtn(cartBtn);
    }.bind(this));

    // ── Дуртайд нэмэх товч ─────────────────────────────
    const wishBtn = document.getElementById('btn-wish');
    if (wishBtn) {
      wishBtn.addEventListener('click', function() {
        // classList.toggle() — 'btn-wish--active' класс байвал хасна, байхгүй бол нэмнэ
        this.classList.toggle('btn-wish--active');

        // Класс байгаа эсэхийг шалгаж товчны текстийг өөрчилнэ
        this.textContent = this.classList.contains('btn-wish--active')
          ? '♥ Дуртайд нэмэгдсэн'
          : 'Дуртайд нэмэх';
      });
    }
  }
}

// ── Эхлүүлэх ─────────────────────────────────────────────
async function init() {
  // URL-ийн ?id=X параметрийг уншина — жш: product.html?id=5 → id=5
  const id = parseInt(new URLSearchParams(location.search).get('id'), 10);

  // Бараа болон сэтгэгдлийн JSON-ийг зэрэг ачаална
  const [products, allReviews] = await Promise.all([
    fetch('/public/json/product.json').then(function(r) { return r.json(); }).catch(function() { return null; }),
    fetch('/public/json/review.json').then(function(r) { return r.json(); }).catch(function() { return []; }),
  ]);

  // Бараануудын файл ачаалагдаагүй бол зогсооно
  if (!products) return;

  // id байвал тухайн id-тай барааг хайна, байхгүй бол эхний барааг авна
  const product = id ? products.find(function(p) { return p.id === id; }) : products[0];

  // Бараа олдоогүй бол зогсооно
  if (!product) return;

  // Зөвхөн энэ бүтээгдэхүүний сэтгэгдлүүдийг шүүнэ
  const reviews = allReviews.filter(function(r) { return r.product_id === product.id; });

  // ProductPage instance үүсгэж хуудсыг дүүргэнэ
  new ProductPage(product, reviews).render();
}

// Хуудас нээгдэхэд init() дуудна
init();
