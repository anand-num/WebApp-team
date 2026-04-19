/* ══════════════════════════════════════════════════════════
   RENTFIT — home.js
   Нүүр хуудасны динамик хэсгүүд: онцлох бараа, сэтгэгдэл, статистик
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js-ийн нэг instance үүсгэнэ — сагстай ажиллах бүх үйлдэлд ашиглана
const cart = new Cart();

// Тоог Монгол мөнгөний форматад хөрвүүлнэ — жш: 3000 → "3,000₮"
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

// Сагсны SVG икон — товч бүр дээр харуулах дүрс
const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 0 1-8 0"/>
</svg>`;

// ── Stats класс — бараа болон сэтгэгдлийн JSON-оос тоон мэдээлэл тооцно ──
class Stats {
  #products; // Бүх бараануудын жагсаалт
  #reviews;  // Бүх сэтгэгдлүүдийн жагсаалт

  constructor(products, reviews) {
    this.#products = products;
    this.#reviews  = reviews;
  }

  // Нийт бараануудын тоо — get ашиглан property шиг дуудагдана (stats.totalItems)
  get totalItems() {
    return this.#products.length;
  }

  // Давхардалгүй брэндийн тоо
  get totalBrands() {
    // .map() — бараа бүрийн брэндийн нэрийг авч шинэ массив үүсгэнэ
    const brands = this.#products.map(function(p) { return p.brand; });

    // Set — давхардсан утгыг автоматаар устгадаг өгөгдлийн бүтэц
    // .reduce() — массивын элемент бүрийг Set-д нэмж нэгтгэнэ
    const unique = brands.reduce(function(set, b) {
      set.add(b); // Set-д нэмнэ — давхардсан бол автоматаар орхино
      return set;
    }, new Set()); // Анхны утга нь хоосон Set

    // .size — Set-ийн элементийн тоо (давтагдаагүй брэндийн тоо)
    return unique.size;
  }

  // Бүх сэтгэгдлийн дундаж үнэлгээ
  get avgRating() {
    // typeof r.rating === 'number' — үнэлгээ нь тоо мөн эсэхийг шалгана (string биш)
    const valid = this.#reviews.filter(function(r) {
      return typeof r.rating === 'number';
    });

    // Хүчинтэй үнэлгээ байхгүй бол '—' буцаана
    if (!valid.length) return '—';

    // .reduce() — бүх үнэлгээний нийлбэрийг тооцно
    const sum = valid.reduce(function(s, r) { return s + r.rating; }, 0);

    // sum / valid.length — дундаж тооцно
    // .toFixed(1) — нэг аравтын бутархайгаар харуулна (жш: 4.666 → "4.7")
    return (sum / valid.length).toFixed(1);
  }

  // Нийт сэтгэгдлийн тоо
  get totalReviews() {
    return this.#reviews.length;
  }
}

// ── HomePage класс — нүүр хуудасны бүх динамик хэсгийг зурна ──
class HomePage {
  #products = []; // Серверээс ачаалсан бүх бараануудын жагсаалт
  #reviews  = []; // Серверээс ачаалсан бүх сэтгэгдлүүдийн жагсаалт

  // ── Серверээс мэдээллийг ачаална ──────────────────────
  async load() {
    // Promise.all([...]) — хоёр fetch-ийг зэрэг ажиллуулна (дараалан биш)
    // Хоёулаа дуустал хүлээгээд цааш үргэлжилнэ
    // Destructuring: [this.#products, this.#reviews] = [...] — хоёр утгыг нэгэн зэрэг хадгална
    [this.#products, this.#reviews] = await Promise.all([
      // .catch(() => []) — fetch амжилтгүй болвол хоосон массив буцаана (апп зогсохгүй)
      fetch('/public/json/product.json').then(function(r) { return r.json(); }).catch(function() { return []; }),
      fetch('/public/json/review.json').then(function(r) { return r.json(); }).catch(function() { return []; }),
    ]);
  }

  // ── Нүүр хуудасны статистик тоонуудыг харуулна ────────
  renderStats() {
    // Stats классын instance үүсгэнэ
    const stats = new Stats(this.#products, this.#reviews);

    // el() — id-аар DOM элемент олох товч туслах функц
    const el = function(id) { return document.getElementById(id); };

    // Элемент байвал утгыг шинэчилнэ — байхгүй бол алдаа гарахгүй орхино
    if (el('stat-items'))  { el('stat-items').textContent  = stats.totalItems  + '+'; }
    if (el('stat-brands')) { el('stat-brands').textContent = stats.totalBrands + '+'; }
    if (el('stat-rating')) { el('stat-rating').textContent = stats.avgRating; }
    // stat-users нь статик утгатай (10k+) — JS-ээр өөрчлөхгүй
  }

  // ── Үнэлгээ өндөр дээд 4 барааг харуулна ─────────────
  renderFeatured() {
    const grid = document.getElementById('featured-grid');

    // Grid байхгүй бол энэ хуудсанд featured хэсэг байхгүй, зогсооно
    if (!grid) return;

    // 1. Үнэлгээ 4.5-аас дээш барааг шүүнэ
    // 2. Үнэлгээгээр буурах дарааллаар эрэмбэлнэ
    // 3. Эхний 4-ийг авна
    const top4 = this.#products
      .filter(function(p) { return p.rating >= 4.5; })
      .sort(function(a, b) { return b.rating - a.rating; })
      .slice(0, 4);

    // .map() — бараа бүрийг HTML string болгоно
    // .join('') — массивын элементүүдийг нэг string болгон нэгтгэнэ
    // '★'.repeat(N) — N удаа давтана (жш: repeat(4) → '★★★★')
    grid.innerHTML = top4.map(function(p) {
      return `
      <article class="product-card" data-id="${p.id}" style="cursor:pointer">
        <div class="card-visual">
          <img src="/public/source/${p.img_src}" alt="${p.item_name}">
          <span class="badge badge--new">${p.status}</span>
          <button class="card-heart" data-id="${p.id}">&#10084;</button>
          <button class="card-cart" data-id="${p.id}" title="Сагсанд нэмэх">${CART_SVG}</button>
          <button class="card-quick-buy" data-id="${p.id}">Хурдан авах</button>
        </div>
        <div class="card-body">
          <p class="card-brand">${p.brand.toUpperCase()}</p>
          <h3 class="card-name">${p.item_name}</h3>
          <div class="rating">
            <span class="rating-stars">${'★'.repeat(Math.round(p.rating))}</span>
            <span class="rating-count">${p.rating} (${p.review_count})</span>
          </div>
          <div class="card-footer">
            <div>
              <p>Өдөрт</p>
              <strong>${p.price}</strong>
            </div>
            <a class="card-detail-link" href="/public/html/product.html?id=${p.id}">Харах →</a>
          </div>
        </div>
      </article>`;
    }).join('');

    // Картуудад товч болон үйлдлүүдийг холбоно
    this.#wireFeaturedCards(grid, top4);
  }

  // ── Онцлох картуудын сагс/шуурхай/зүрх/click үйлдлүүдийг холбоно ──
  #wireFeaturedCards(grid, products) {

    // .reduce() — бараануудыг id → product хэлбэрийн объект болгоно
    // жш: { 1: {бараа1}, 2: {бараа2} } → id-аар хурдан хайх боломжтой
    const byId = products.reduce(function(map, p) {
      map[p.id] = p;
      return map;
    }, {});

    // Grid дотрх карт бүрт үйлдлүүдийг холбоно
    grid.querySelectorAll('.product-card').forEach(function(card) {

      // card.dataset.id — HTML дахь data-id="${p.id}" атрибутын утгыг уншина
      // parseInt(..., 10) — string-ийг бүхэл тоо болгоно
      const id      = parseInt(card.dataset.id, 10);
      const product = byId[id]; // id-аар бараа олно

      // Карт дарахад бүтээгдэхүүний дэлгэрэнгүй хуудас руу шилжинэ
      card.addEventListener('click', function(e) {
        // e.target.closest('button, a') — дарагдсан элемент товч эсвэл холбоос мөн эсэхийг шалгана
        // Товч/холбоос дарагдсан бол карт click-г ажиллуулахгүй
        if (e.target.closest('button, a')) return;
        location.href = `/public/html/product.html?id=${id}`;
      });

      // "Харах →" холбоос — картын click дахин ажиллахаас сэргийлнэ
      const detailLink = card.querySelector('.card-detail-link');
      if (detailLink) {
        detailLink.addEventListener('click', function(e) {
          e.stopPropagation();
        });
      }

      // Зүрхний товч — дарах бүрт 'liked' классыг нэмж/хасна
      card.querySelector('.card-heart').addEventListener('click', function(e) {
        e.stopPropagation();
        // classList.toggle() — класс байвал хасна, байхгүй бол нэмнэ
        this.classList.toggle('liked');
      });

      // Сагсны товч — нэмэх/хасах
      const cartBtn = card.querySelector('.card-cart');

      // Тухайн бараа аль хэдийн сагсанд байвал 'in-cart' класс нэмнэ
      if (cart.has(id)) {
        cartBtn.classList.add('in-cart');
        cartBtn.title = 'Сагснаас хасах';
      }

      cartBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (this.classList.contains('in-cart')) {
          // Сагсанд байвал хасна
          cart.remove(id);
          this.classList.remove('in-cart');
          this.title = 'Сагсанд нэмэх';
        } else {
          // Сагсанд байхгүй бол нэмнэ
          if (product) { cart.addProduct(product); }
          this.classList.add('in-cart');
          this.title = 'Сагснаас хасах';
        }
      });

      // Шуурхай худалдааны товч — сагсанд нэмж cart.html руу шилжинэ
      card.querySelector('.card-quick-buy').addEventListener('click', function(e) {
        e.stopPropagation();
        if (product) { cart.addProduct(product); }
        // ?quick=ID — cart.js-д зөвхөн энэ барааг харуулахыг хэлнэ
        location.href = `/public/html/cart.html?quick=${id}`;
      });

    }.bind(this));
  }

  // ── Шилдэг 3 сэтгэгдлийг харуулна ────────────────────
  renderReviews() {
    const container = document.getElementById('home-review-container');

    // Container байхгүй бол энэ хуудсанд сэтгэгдлийн хэсэг байхгүй, зогсооно
    if (!container) return;

    // Set — аль бараануудын сэтгэгдэл аль хэдийн нэмэгдсэнийг хянана
    // Нэг бараанаас зөвхөн нэг сэтгэгдэл авахын тулд ашиглана
    const seen = new Set();

    const top3 = this.#reviews
      // 1. Зөвхөн 5 одтой сэтгэгдлийг авна
      .filter(function(r) { return r.rating === 5; })
      // 2. Нэг бараанаас зөвхөн нэг сэтгэгдэл үлдээнэ
      .reduce(function(acc, r) {
        // seen.has() — энэ барааны сэтгэгдэл аль хэдийн орсон эсэхийг шалгана
        if (!seen.has(r.product_id)) {
          seen.add(r.product_id); // Барааны ID-ийг бүртгэнэ
          acc.push(r);            // Сэтгэгдлийг жагсаалтад нэмнэ
        }
        return acc;
      }, []) // Анхны утга нь хоосон массив
      // 3. Эхний 3-ийг авна
      .slice(0, 3);

    // Сэтгэгдэл бүрийг HTML болгож харуулна
    // rv.name.charAt(0) — хэрэглэгчийн нэрийн эхний үсэг (жш: "Бат" → "Б")
    container.innerHTML = top3.map(function(rv) {
      return `
      <article class="review-card">
        <p class="stars">${'★'.repeat(rv.rating)}</p>
        <p>${rv.comment}</p>
        <hr>
        <footer>
          <p class="reviewer-initial">${rv.name.charAt(0)}</p>
          <strong>${rv.name}</strong>
        </footer>
      </article>`;
    }).join('');
  }

  // ── Бүх хэсгийг дараалан зурна ────────────────────────
  render() {
    this.renderStats();    // Статистик тоонуудыг харуулна
    this.renderFeatured(); // Онцлох барааг харуулна
    this.renderReviews();  // Шилдэг сэтгэгдлүүдийг харуулна
  }

  // ── Эхлүүлэх ──────────────────────────────────────────
  async init() {
    await this.load(); // Эхлээд JSON-оос мэдээлэл ачаална
    this.render();     // Дуусмагц бүх хэсгийг зурна
  }
}

// HomePage instance үүсгэж шууд init() дуудна
new HomePage().init();
