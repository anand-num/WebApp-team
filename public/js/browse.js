/* ══════════════════════════════════════════════════════════
   RENTFIT — browse.js
   Бүтээгдэхүүний каталог — шүүлтүүр, эрэмбэлэлт, хуудасжилт
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js-ийн нэг instance үүсгэнэ — сагстай ажиллах бүх үйлдэлд ашиглана
const cart = new Cart();

// ── Үнийн string-ийг тоо болгох ─────────────────────────
// жш: "3,000₮" → 3000
function parsePrice(str) {
  // String(str) — ямар ч төрлийн утгыг string болгоно
  // .replace(/[^0-9]/g, '') — тоо биш бүх тэмдэгтийг устгана (₮, таслал г.м)
  // parseInt(..., 10) — string-ийг бүхэл тоо болгоно
  // || 0 — хөрвүүлэлт амжилтгүй болвол 0 буцаана
  return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
}

// ── ProductBrowser класс ─────────────────────────────────
class ProductBrowser {

  // Private хувьсагчид — зөвхөн энэ класс дотроос хандаж болно
  #products = [];       // Серверээс ачаалсан бүх бараануудын жагсаалт
  #page     = 1;        // Одоогийн хуудасны дугаар
  #pageSize = 8;        // Нэг хуудсанд харуулах бараануудын тоо
  #category = 'All';   // Сонгогдсон ангиллын шүүлтүүр
  #size     = 'All';   // Сонгогдсон хэмжээний шүүлтүүр
  #search   = '';       // Хайлтын талбарт бичигдсэн текст
  #sort     = 'new';   // Эрэмбэлэх горим (new / price-asc / price-desc / rating)
  #maxPrice = 500000;  // Үнийн slider-ийн дээд хязгаар

  // Хуудасны DOM элементүүдийг олж хадгална
  constructor() {
    this.grid     = document.getElementById('catGrid');           // Бараануудын grid блок
    this.template = document.getElementById('product-template'); // Карт бүрийн HTML загвар
    this.catInfo  = document.getElementById('catInfo');          // "N бараа олдлоо" текст
  }

  // ── Серверээс бараануудын мэдээллийг ачаална ────────────
  async load() {
    // fetch() — серверт хүсэлт илгээнэ, await — хариу ирэх хүртэл хүлээнэ
    const r = await fetch('/public/json/product.json');

    // r.json() — хариуны биеийг JSON массив болгон задлана
    this.#products = await r.json();
  }

  // ── Шүүлтүүр болон эрэмбэлэлтийг хэрэглэж шүүгдсэн жагсаалт буцаана ──
  getFiltered() {

    // Эхлээд бүх барааг авна
    let list = this.#products;

    // 1. Ангиллын шүүлтүүр — 'All' биш бол зөвхөн тухайн ангиллын барааг үлдээнэ
    if (this.#category !== 'All') {
      list = list.filter(function(p) {
        return p.category === this.#category;
      }.bind(this));
    }

    // 2. Хайлтын шүүлтүүр — нэр, брэнд, тайлбарт хайлтын текст агуулагдаж байвал үлдээнэ
    if (this.#search) {
      // .toLowerCase() — том/жижиг үсгийг нэгтгэнэ (жш: "JACKET" = "jacket")
      const q = this.#search.toLowerCase();
      list = list.filter(function(p) {
        const nameMatch        = p.item_name.toLowerCase().includes(q);
        const brandMatch       = p.brand.toLowerCase().includes(q);
        // p.description байхгүй байж болох тул || '' ашиглана
        const descriptionMatch = (p.description || '').toLowerCase().includes(q);
        return nameMatch || brandMatch || descriptionMatch;
      });
    }

    // 3. Хэмжээний шүүлтүүр — 'All' биш бол тухайн хэмжээтэй барааг үлдээнэ
    if (this.#size !== 'All') {
      list = list.filter(function(p) {
        // Array.isArray() — p.sizes массив мөн эсэхийг шалгана
        // .includes() — массив дотор тухайн хэмжээ байгаа эсэхийг шалгана
        return Array.isArray(p.sizes) && p.sizes.includes(this.#size);
      }.bind(this));
    }

    // 4. Үнийн шүүлтүүр — дээд хязгаараас хэтэрсэн барааг хасна
    list = list.filter(function(p) {
      return parsePrice(p.price) <= this.#maxPrice;
    }.bind(this));

    // 5. Эрэмбэлэлт — [...list] нь эх массивыг өөрчлөхгүйн тулд хуулбар үүсгэнэ
    if (this.#sort === 'price-asc') {
      // Үнэ өсөх дарааллаар — a - b эерэг бол b өмнө, сөрөг бол a өмнө
      list = [...list].sort(function(a, b) {
        return parsePrice(a.price) - parsePrice(b.price);
      });
    } else if (this.#sort === 'price-desc') {
      // Үнэ буурах дарааллаар
      list = [...list].sort(function(a, b) {
        return parsePrice(b.price) - parsePrice(a.price);
      });
    } else if (this.#sort === 'rating') {
      // Үнэлгээ өндрөөс доош дарааллаар
      list = [...list].sort(function(a, b) {
        return b.rating - a.rating;
      });
    }

    return list;
  }

  // ── Шүүгдсэн бараануудын тухайн хуудсыг дэлгэцэнд харуулна ──
  display() {
    const filtered   = this.getFiltered();

    // Math.ceil() — дээш дугуйлна (жш: 13 ÷ 8 = 1.625 → 2 хуудас)
    const totalPages = Math.ceil(filtered.length / this.#pageSize);

    // Хуудасны дугаар нийт хуудасны тооноос хэтэрсэн бол сүүлийн хуудас руу засна
    // Math.max(1, totalPages) — хамгийн багадаа 1 байхыг баталгаажуулна
    if (this.#page > totalPages) {
      this.#page = Math.max(1, totalPages);
    }

    // Тухайн хуудасны эхлэх индекс тооцоолно
    // жш: 2-р хуудас → (2-1) * 8 = 8 → 8-р индексээс эхэлнэ
    const startIndex = (this.#page - 1) * this.#pageSize;

    // .slice() — эхлэх болон дуусах индексийн хооронд авна
    const pageItems = filtered.slice(startIndex, startIndex + this.#pageSize);

    // Grid-ийн агуулгыг цэвэрлэнэ (дахин зурахын өмнө хуучин картуудыг арилгана)
    this.grid.innerHTML = '';

    // Олдсон бараануудын тоог харуулна
    this.catInfo.textContent = `${filtered.length} бараа олдлоо`;

    // Тухайн хуудасны бараа бүрийн карт зурна
    pageItems.forEach(function(product) {
      this.#renderCard(product);
    }.bind(this));

    // Хуудасжилтын товчнуудыг шинэчилнэ
    this.#updatePagination(filtered.length);
  }

  // ── Нэг бүтээгдэхүүний картыг үүсгэж grid-д нэмнэ ──────
  #renderCard(product) {
    // template.content.cloneNode(true) — HTML <template> тагийн агуулгыг бүрэн хуулбарлана
    // true = дотоод элементүүдийг бүгдийг хамт хуулна (deep clone)
    const card    = this.template.content.cloneNode(true);
    const cardEl  = card.querySelector('.product-card');
    const cartBtn = card.querySelector('.card-cart');

    // ── Картын мэдээллийг дүүргэнэ ──────────────────────
    card.querySelector('.card-img').src           = `/public/source/${product.img_src}`;
    card.querySelector('.card-img').alt           = product.item_name;
    card.querySelector('.badge').textContent      = product.status || '';
    card.querySelector('.card-brand').textContent = product.brand;
    card.querySelector('.card-name').textContent  = product.item_name;

    // '★'.repeat(N) — N удаа давтана (жш: repeat(4) → '★★★★')
    // Math.round(product.rating) — 4.3 → 4, 4.6 → 5
    card.querySelector('.rating-stars').textContent = '★'.repeat(Math.round(product.rating));
    card.querySelector('.rating-count').textContent = `${product.rating} (${product.review_count})`;
    card.querySelector('.card-price').textContent   = product.price;

    // ── Карт дарахад бүтээгдэхүүний дэлгэрэнгүй хуудас руу шилжинэ ──
    cardEl.style.cursor = 'pointer';
    cardEl.addEventListener('click', function() {
      location.href = `/public/html/product.html?id=${product.id}`;
    });

    // ── "Харах →" холбоос ───────────────────────────────
    const link = card.querySelector('.card-link');
    if (link) {
      link.href = `/public/html/product.html?id=${product.id}`;
      // e.stopPropagation() — холбоос дарахад картын click дахин ажиллахаас сэргийлнэ
      link.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }

    // ── Зүрхний товч — дуртай/дургүй тэмдэглэнэ ────────
    card.querySelector('.card-heart').addEventListener('click', function(e) {
      // Картын click ажиллахаас сэргийлнэ
      e.stopPropagation();
      // classList.toggle() — 'liked' класс байвал хасна, байхгүй бол нэмнэ
      this.classList.toggle('liked');
    });

    // ── Сагсны товч — нэмэх/хасах ───────────────────────
    // cart.has() — тухайн бараа сагсанд аль хэдийн байгаа эсэхийг шалгана
    if (cart.has(product.id)) {
      cartBtn.classList.add('in-cart');    // Сагсанд байвал 'in-cart' класс нэмнэ
      cartBtn.title = 'Сагснаас хасах';   // Tooltip текст
    }

    cartBtn.addEventListener('click', function(e) {
      e.stopPropagation();

      // classList.contains() — 'in-cart' класс байгаа эсэхийг шалгана
      if (this.classList.contains('in-cart')) {
        // Аль хэдийн сагсанд байвал хасна
        cart.remove(product.id);
        this.classList.remove('in-cart');
        this.title = 'Сагсанд нэмэх';
      } else {
        // Сагсанд байхгүй бол нэмнэ
        cart.addProduct(product);
        this.classList.add('in-cart');
        this.title = 'Сагснаас хасах';
      }
    });

    // ── "Шуурхай худалдаа" товч — сагсанд нэмж cart.html руу шилжинэ ──
    card.querySelector('.card-quick-buy').addEventListener('click', function(e) {
      e.stopPropagation();
      cart.addProduct(product);
      // ?quick=ID — cart.js-д зөвхөн энэ барааг харуулахыг хэлнэ
      location.href = `/public/html/cart.html?quick=${product.id}`;
    });

    // Картыг grid-д нэмнэ
    this.grid.appendChild(card);
  }

  // ── Хуудасжилтын товчнуудыг шинэчилнэ ──────────────────
  #updatePagination(total) {
    const totalPages = Math.ceil(total / this.#pageSize);

    // document.querySelectorAll('.pgb') — хуудасжилтын 4 товчийг олно
    // btns[0]=← , btns[1]=1 , btns[2]=2 , btns[3]=→
    const btns = document.querySelectorAll('.pgb');

    // "←" товч — 1-р хуудсанд байвал идэвхгүй (цааш буцах боломжгүй)
    btns[0].disabled = (this.#page === 1);

    // "1" товч — 1-р хуудас идэвхтэй бол 'on' класс нэмнэ, хуудас байхгүй бол нуунэ
    btns[1].textContent = '1';
    btns[1].classList.toggle('on', this.#page === 1);
    btns[1].style.display = totalPages >= 1 ? '' : 'none';

    // "2" товч — 2-р хуудас идэвхтэй бол 'on' класс нэмнэ, хуудас байхгүй бол нуунэ
    btns[2].textContent = '2';
    btns[2].classList.toggle('on', this.#page === 2);
    btns[2].style.display = totalPages >= 2 ? '' : 'none';

    // "→" товч — сүүлийн хуудсанд байвал идэвхгүй (цааш явах боломжгүй)
    btns[3].disabled = (this.#page >= totalPages);
  }

  // ── Шүүлтүүрийн setter функцүүд ─────────────────────────
  // Утгыг шинэчилж 1-р хуудас руу буцаад дэлгэцийг дахин зурна

  setCategory(v) { this.#category = v; this.#page = 1; this.display(); } // Ангиллын шүүлтүүр
  setSize(v)     { this.#size = v;     this.#page = 1; this.display(); } // Хэмжээний шүүлтүүр
  setSearch(v)   { this.#search = v;   this.#page = 1; this.display(); } // Хайлтын текст
  setSort(v)     { this.#sort = v;                     this.display(); } // Эрэмбэлэлт (хуудас 1 болгохгүй)
  setMaxPrice(v) { this.#maxPrice = v; this.#page = 1; this.display(); } // Үнийн дээд хязгаар
  setPage(v)     { this.#page = v;                     this.display(); } // Хуудасны дугаар

  // ── Бүх шүүлтүүрийг анхдагч байдалд нь буцаана ─────────
  reset() {
    // Private хувьсагчдыг анхдагч утгад нь тохируулна
    this.#category = 'All';
    this.#size     = 'All';
    this.#search   = '';
    this.#sort     = 'new';
    this.#maxPrice = 500000;
    this.#page     = 1;

    // HTML элементүүдийг мөн анхдагч байдалд нь тохируулна
    document.querySelector('input[name="cat"][value="All"]').checked  = true; // Ангиллын radio
    document.querySelector('input[name="size"][value="All"]').checked = true; // Хэмжээний radio

    const priceRange = document.querySelector('.price-range');
    const priceLabel = document.querySelector('.pr-inputs span');
    priceRange.value        = 500000;        // Slider-ийг дээд хязгаар руу буцаана
    priceLabel.textContent  = '≤ 500,000₮'; // Label текстийг шинэчилнэ

    document.getElementById('srchInp').value  = '';    // Хайлтын талбарыг цэвэрлэнэ
    document.getElementById('sortSel').value  = 'new'; // Эрэмбэлэлтийг анхдагч болгоно

    // Дэлгэцийг шинэчилнэ
    this.display();
  }

  // ── Хуудасны бүх контролуудад үйлдэл холбоно ───────────
  setupListeners() {

    // Ангиллын radio товчнууд — сонгох бүрт setCategory() дуудна
    document.querySelectorAll('input[name="cat"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        this.setCategory(radio.value);
      }.bind(this));
    }.bind(this));

    // Хэмжээний radio товчнууд — сонгох бүрт setSize() дуудна
    document.querySelectorAll('input[name="size"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        this.setSize(radio.value);
      }.bind(this));
    }.bind(this));

    // Хайлтын input — тэмдэгт бичих бүрт setSearch() дуудна
    document.getElementById('srchInp').addEventListener('input', function(e) {
      this.setSearch(e.target.value.trim());
    }.bind(this));

    // Эрэмбэлэх dropdown — өөрчлөгдөх бүрт setSort() дуудна
    document.getElementById('sortSel').addEventListener('change', function(e) {
      this.setSort(e.target.value);
    }.bind(this));

    // Үнийн slider — гүйлгэх бүрт label шинэчилж setMaxPrice() дуудна
    const priceRange = document.querySelector('.price-range');
    const priceLabel = document.querySelector('.pr-inputs span');
    priceRange.addEventListener('input', function() {
      const value = parseInt(priceRange.value, 10);
      // .toLocaleString() — тоонд таслал нэмнэ (жш: 300000 → "300,000")
      priceLabel.textContent = `≤ ${value.toLocaleString()}₮`;
      this.setMaxPrice(value);
    }.bind(this));

    // "Шүүлтүүр арилгах" товч — бүх шүүлтүүрийг цэвэрлэж reset() дуудна
    document.querySelector('.flt-reset').addEventListener('click', function() {
      this.reset();
    }.bind(this));

    // Хуудасжилтын товчнууд — i=индекс (0=← , 1=1 , 2=2 , 3=→)
    document.querySelectorAll('.pgb').forEach(function(btn, i) {
      btn.addEventListener('click', function() {
        const totalPages = Math.ceil(this.getFiltered().length / this.#pageSize);

        if (i === 0 && this.#page > 1) {
          this.setPage(this.#page - 1);        // "←" — өмнөх хуудас руу
        } else if (i === 1) {
          this.setPage(1);                     // "1" — 1-р хуудас руу
        } else if (i === 2) {
          this.setPage(2);                     // "2" — 2-р хуудас руу
        } else if (i === 3 && this.#page < totalPages) {
          this.setPage(this.#page + 1);        // "→" — дараах хуудас руу
        }
      }.bind(this));
    }.bind(this));
  }
}

// ── Эхлүүлэх ─────────────────────────────────────────────
// ProductBrowser үүсгэнэ
const browser = new ProductBrowser();

// load() дуусмагц .then() ажиллана — JSON ачаалагдаагүй байхад дэлгэцийг зурахгүй
browser.load().then(function() {
  browser.display();          // Бараануудыг дэлгэцэнд харуулна
  browser.setupListeners();   // Бүх товч болон контролуудыг холбоно
});
