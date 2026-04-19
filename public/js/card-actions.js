/* ══════════════════════════════════════════════════════════
   RENTFIT — card-actions.js
   Статик бүтээгдэхүүний картуудад сагс болон шуурхай худалдааны
   товчнуудыг динамикаар нэмдэг файл
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js-ийн нэг instance үүсгэнэ — сагстай ажиллах бүх үйлдэлд ашиглана
const cart = new Cart();

// Сагсны SVG икон — HTML template literal ашиглан string болгон хадгалсан
// Энэ иконыг сагсны товч бүр дээр харуулна
const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
  <line x1="3" y1="6" x2="21" y2="6"/>
  <path d="M16 10a4 4 0 0 1-8 0"/>
</svg>`;

// ── CardActions класс ────────────────────────────────────
class CardActions {

  // Серверээс ачаалсан бүх бараануудын жагсаалт — private
  #products = [];

  // ── Бараануудын мэдээллийг серверээс ачаална ────────────
  async load() {
    // Хоёр өөр замаас файлыг туршина — хуудасны байршлаас хамаарч зам өөр байж болно
    // жш: /public/html/ дотроос ажиллавал '../json/product.json' замыг ашиглана
    for (const path of ['/public/json/product.json', '../json/product.json']) {
      try {
        // fetch() — серверт HTTP хүсэлт илгээнэ
        const r = await fetch(path);

        if (r.ok) {
          // r.ok — HTTP статус 200-299 бол true, амжилттай гэсэн үг
          // r.json() — хариуны биеийг JSON массив болгон задлана
          this.#products = await r.json();

          // break — амжилттай файл олдсон тул давталтыг зогсооно, 2-р замыг туршихгүй
          break;
        }
      } catch (_) {
        // _ — алдааг санаатайгаар орхино (нэр өгөхгүй байна гэсэн дохио)
        // Нэг зам амжилтгүй болвол дараагийн замыг туршина
      }
    }
  }

  // ── Зургийн файлын нэрээр бараа хайна ──────────────────
  matchProduct(imgSrc) {
    // imgSrc нь бүтэн зам байна — жш: "/public/source/jacket.jpg"
    // .split('/') — "/" тэмдэгтээр хуваана → ["", "public", "source", "jacket.jpg"]
    // .pop() — массивын сүүлийн элементийг авна → "jacket.jpg"
    const file = imgSrc.split('/').pop();

    // #products массиваас img_src нь file-тай тохирох барааг хайна
    // .find() — нөхцөл хангасан эхний элементийг буцаана, олдохгүй бол undefined
    // || null — олдохгүй бол null буцаана
    return this.#products.find(function(p) {
      return p.img_src === file;
    }) || null;
  }

  // ── Нэг картад товчнуудыг нэмнэ ─────────────────────────
  injectCard(card) {

    // Картын зургийн хэсгийг (.card-visual) олно
    const visual = card.querySelector('.card-visual');

    // visual байхгүй бол → энэ карт зургийн хэсэггүй, зогсооно
    // visual дотор .card-cart аль хэдийн байвал → давхар нэмэхгүй, зогсооно
    if (!visual || visual.querySelector('.card-cart')) return;

    // Картын зургийг олно
    const img = visual.querySelector('img');

    // img байвал зургийн src-ийг ашиглан бараа хайна, байхгүй бол null
    const product = img ? this.matchProduct(img.src) : null;

    // ── Карт дарахад бүтээгдэхүүний дэлгэрэнгүй хуудас руу шилжинэ ──
    if (product) {
      card.style.cursor = 'pointer'; // Хулганыг гарны хэлбэрт болгоно

      card.addEventListener('click', function() {
        location.href = `/public/html/product.html?id=${product.id}`;
      });

      // "Харах →" холбоос байвал холбоосны href-ийг тохируулна
      const viewLink = card.querySelector('.card-footer a');
      if (viewLink) {
        viewLink.href = `/public/html/product.html?id=${product.id}`;

        // e.stopPropagation() — холбоос дарахад картын click дахин ажиллахаас сэргийлнэ
        viewLink.addEventListener('click', function(e) {
          e.stopPropagation();
        });
      }
    }

    // ── Зүрхний товч — картын click-г дамжуулахгүй байхаар тохируулна ──
    const heartBtn = card.querySelector('.card-heart');
    if (heartBtn) {
      heartBtn.addEventListener('click', function(e) {
        // Зүрх дарахад карт дарагдсанд тооцогдохоос сэргийлнэ
        e.stopPropagation();
      });
    }

    // ── Сагсны товч үүсгэнэ ──────────────────────────────
    // document.createElement() — шинэ HTML элемент үүсгэнэ (DOM-д байхгүй байна)
    const cartBtn = document.createElement('button');
    cartBtn.className = 'card-cart';        // CSS класс оноона
    cartBtn.title     = 'Сагсанд нэмэх';   // Хулганаар дээгүүр байхад харагдах tooltip
    cartBtn.innerHTML = CART_SVG;           // Сагсны SVG иконыг дотор нь байрлуулна

    // Тухайн бараа аль хэдийн сагсанд байвал 'in-cart' класс нэмж tooltip өөрчилнэ
    if (product && cart.has(product.id)) {
      cartBtn.classList.add('in-cart');
      cartBtn.title = 'Сагснаас хасах';
    }

    // Сагсны товч дарахад — нэмэх эсвэл хасах
    cartBtn.addEventListener('click', function(e) {
      // Картын click ажиллахаас сэргийлнэ
      e.stopPropagation();

      // classList.contains() — 'in-cart' класс байгаа эсэхийг шалгана
      if (cartBtn.classList.contains('in-cart')) {
        // Аль хэдийн сагсанд байвал хасна
        if (product) {
          cart.remove(product.id);
        }
        cartBtn.classList.remove('in-cart');
        cartBtn.title = 'Сагсанд нэмэх';
      } else {
        // Сагсанд байхгүй бол нэмнэ
        if (product) {
          cart.addProduct(product);
        }
        cartBtn.classList.add('in-cart');
        cartBtn.title = 'Сагснаас хасах';
      }
    });

    // ── Шуурхай худалдааны товч үүсгэнэ ─────────────────
    const quickBtn = document.createElement('button');
    quickBtn.className   = 'card-quick-buy';
    quickBtn.textContent = 'Хурдан авах';

    quickBtn.addEventListener('click', function(e) {
      // Картын click ажиллахаас сэргийлнэ
      e.stopPropagation();

      if (product) {
        // Барааг сагсанд нэмнэ
        cart.addProduct(product);

        // cart.html?quick=ID — cart.js-д зөвхөн энэ барааг харуулахыг хэлнэ
        location.href = `/public/html/cart.html?quick=${product.id}`;
      }
    });

    // Хоёр товчийг .card-visual блок дотор нэмнэ
    visual.appendChild(cartBtn);  // Сагсны товч нэмнэ
    visual.appendChild(quickBtn); // Шуурхай товч нэмнэ
  }

  // ── Хуудасны бүх картуудад товчнуудыг нэмнэ ─────────────
  injectAll() {
    // document.querySelectorAll('.product-card') — хуудасны бүх картуудыг олно
    // forEach — карт бүрт injectCard() дуудна
    document.querySelectorAll('.product-card').forEach(function(card) {
      this.injectCard(card);
    }.bind(this));
  }

  // ── Эхлүүлэх ────────────────────────────────────────────
  async init() {
    // 1. Эхлээд бараануудын мэдээллийг ачаална
    await this.load();

    // 2. Дуусмагц бүх картуудад товчнуудыг нэмнэ
    this.injectAll();
  }
}

// CardActions instance үүсгэж шууд init() дуудна
// Хуудас нээгдэхэд автоматаар ажиллана
new CardActions().init();
