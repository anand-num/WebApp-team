/* ══════════════════════════════════════════════════════════
   RENTFIT — cart.js
   Олон алхамт захиалгын хуудас
══════════════════════════════════════════════════════════ */

import Cart from './modules/Cart.js';

// Cart.js модулиас Cart классыг импортлож нэг instance үүсгэнэ
// Энэ нь localStorage-тай ажиллах бүх үйлдлийг гүйцэтгэнэ
const cart = new Cart();

// Хүргэлтийн үнэ — тогтмол утга, хэзээ ч өөрчлөгдөхгүй
const DELIVERY = 3000;

// Барьцааны хувь — нийт үнийн 30% (0.30 = 30%)
const DEPOSIT_R = 0.30;

// Түрээсийн хугацааны сонголтууд — өдрийн тоо болон үнийн үржигч
// mult: 1 → 1 өдрийн үнэ нь үндсэн үнэтэй адил
// mult: 1.5 → 3 өдрийн үнэ нь үндсэн үнийн 1.5 дахин
// mult: 2.5 → 7 өдрийн үнэ нь үндсэн үнийн 2.5 дахин
const DURATIONS = [
  { days: 1, mult: 1   },
  { days: 3, mult: 1.5 },
  { days: 7, mult: 2.5 },
];

// ── Тоог Монгол мөнгөний форматад хөрвүүлэх ─────────────
// toLocaleString() — тоонд таслал нэмнэ (жш: 3000 → "3,000")
// + '₮' — төгрөгийн тэмдэг нэмнэ (жш: "3,000₮")
function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

// ── Хугацаанаас хамаарч үнэ тооцох ──────────────────────
function priceFor(base, days) {
  // DURATIONS массиваас days-тай тохирох объектийг хайна
  // .find() — нөхцөл хангасан эхний элементийг буцаана, олдохгүй бол undefined
  // || DURATIONS[0] — олдохгүй бол анхны элементийг (1 өдөр) ашиглана
  const d = DURATIONS.find(function(o) { return o.days === days; }) || DURATIONS[0];

  // Math.round() — тоог ойрын бүхэл тоо руу дугуйлна (жш: 4500.7 → 4501)
  // base * d.mult — үндсэн үнийг үржигчид үржүүлнэ
  return Math.round(base * d.mult);
}

// ── CartPage класс ───────────────────────────────────────
class CartPage {
  // # тэмдэгт — private хувьсагч, зөвхөн энэ класс дотроос хандаж болно
  #currentStep   = 0;     // Одоогийн алхамын дугаар (0=сагс, 1=хүргэлт, 2=баталгаажуулах, 3=амжилт)
  #promoDiscount = 0;     // Промо кодоор хасагдах дүн
  #promoCodes    = [];    // Серверээс ачаалсан промо кодуудын жагсаалт
  #quickId;               // URL-ээс авсан "шуурхай худалдаалах" бүтээгдэхүүний ID

  constructor() {
    // URLSearchParams — хуудасны URL-ийн query string-ийг задлан уншина
    // жш: cart.html?quick=42 гэвэл location.search = "?quick=42"
    // .get('quick') — "quick" параметрийн утгыг авна → "42"
    // parseInt(..., 10) — "42" string-ийг 10-тын тооллын бүхэл тоо болгоно → 42
    // || null — "quick" параметр байхгүй бол null болгоно
    this.#quickId = parseInt(new URLSearchParams(location.search).get('quick'), 10) || null;

    // Хуудасны бүх шаардлагатай DOM элементүүдийг олж хадгална
    // querySelectorAll — CSS selector-т тохирох БҮГДИЙГ олж NodeList буцаана
    // querySelector — CSS selector-т тохирох ЭХНИЙГ олно
    // getElementById — id-аар нэг элемент олно
    this.stepEls   = document.querySelectorAll('.cs');               // Stepper дахь алхам тус бүр
    this.tabs      = document.querySelectorAll('[data-tab-content]'); // Алхам бүрийн агуулгын хэсэг
    this.footer    = document.querySelector('.tab-footer');           // Доод хэсгийн товчнуудын блок
    this.backBtn   = this.footer.querySelector('.btn-secondary');     // "Буцах" товч
    this.nextBtn   = this.footer.querySelector('.btn-primary');       // "Үргэлжлүүлэх" товч
    this.receiptEl = document.querySelector('.cart-receipt');         // Баримтын блок (баруун тал)
    this.stepperEl = document.querySelector('.co-steps');             // Дээд хэсгийн алхамын мөр
    this.cartList  = document.getElementById('cart-item-list');       // Сагсны бараануудын жагсаалт
    this.$subtotal = document.getElementById('receipt-subtotal');     // Нийт дүн харуулах элемент
    this.$delivery = document.getElementById('receipt-delivery');     // Хүргэлт харуулах элемент
    this.$deposit  = document.getElementById('receipt-deposit');      // Барьцаа харуулах элемент
    this.$discRow  = document.getElementById('receipt-discount-row'); // Хөнгөлөлтийн мөр (нуугдсан байна)
    this.$discAmt  = document.getElementById('receipt-discount');     // Хөнгөлөлтийн дүн харуулах элемент
    this.$total    = document.getElementById('receipt-total-price');  // Нийт төлөх дүн харуулах элемент
  }

  // ── Идэвхтэй бараануудыг авах ────────────────────────
  getActiveItems() {
    // Cart.js-ийн getItems() — localStorage-аас бүх барааг авна
    const items = cart.getItems();

    // Ternary оператор: нөхцөл ? үнэн үед : худал үед
    // this.#quickId байвал (шуурхай худалдаа) → зөвхөн тухайн барааг шүүнэ
    // this.#quickId байхгүй бол → бүх бараануудыг буцаана
    // .filter() — нөхцөл хангасан элементүүдийг шинэ массивт хийж буцаана
    return this.#quickId ? items.filter(function(i) { return i.id === this.#quickId; }.bind(this)) : items;
  }

  // ── Сагс хоосон бол туршилтын мэдээлэл нэмэх ────────
  async seedIfEmpty() {
    // .length — массивын элементийн тоог буцаана
    // if (cart.getItems().length) — элемент байвал үнэн, return → функцийг зогсооно
    if (cart.getItems().length) return;

    try {
      // fetch() — серверт HTTP хүсэлт илгээж хариу авна (асинхрон)
      // await — fetch дуусах хүртэл хүлээнэ
      const r = await fetch('/public/json/product.json');

      // r.json() — HTTP хариуны биеийг JSON болгон задлана
      const products = await r.json();

      // Туршилтанд 7-р (индекс 6) болон 5-р (индекс 4) бараануудыг авна
      // Массив 0-ээс эхэлдэг тул products[6] = 7 дахь бараа
      const seeds = [products[6], products[4]];

      // .map() — массивын элемент бүрийг өөр форматад хөрвүүлж шинэ массив үүсгэнэ
      cart.save(seeds.map(function(p) {
        return {
          id       : p.id,
          name     : p.item_name,
          brand    : p.brand,
          img      : p.img_src,

          // Array.isArray() — p.sizes массив мөн эсэхийг шалгана
          // үнэн бол эхний элементийг авна (p.sizes[0])
          // худал бол шууд p.sizes-ийг ашиглана (нэг утга байж болно)
          size     : Array.isArray(p.sizes) ? p.sizes[0] : p.sizes,

          // String(...) — p.price-ийг string болгоно
          // .replace(/[^0-9]/g, '') — regex ашиглан тоо биш бүх тэмдэгтийг арилгана
          //   /[^0-9]/ → 0-9 биш бүх тэмдэгт
          //   /g → бүх тохиолдолд хэрэглэ (global)
          // parseInt(..., 10) — цэвэр тоон string-ийг бүхэл тоо болгоно
          // || 0 — хөрвүүлэлт амжилтгүй болвол 0 болгоно
          basePrice: parseInt(String(p.price).replace(/[^0-9]/g, ''), 10) || 0,

          selectedDays: 1, // Анхдагч хугацаа 1 өдөр
        };
      }));
    } catch (e) {
      // Fetch алдаа гарвал консолд анхааруулга хэвлэнэ, апп зогсохгүй
      console.warn('[cart] seed failed', e);
    }
  }

  // ── Stepper-ийн төлөвийг шинэчлэх ───────────────────
  updateStepper(idx) {
    // stepEls — алхам бүрийн DOM элемент
    // forEach — массивын элемент бүрийг давтана, el=элемент, i=индекс
    this.stepEls.forEach(function(el, i) {
      // Эхлээд 'on' болон 'done' классыг бүгдээс арилгана
      el.classList.remove('on', 'done');

      // i < idx — өнгөрсөн алхамуудад 'done' класс нэмнэ (бүрсэн тэмдэг)
      if (i < idx) {
        el.classList.add('done');
      }

      // i === idx — одоогийн алхамд 'on' класс нэмнэ (идэвхтэй тэмдэг)
      if (i === idx) {
        el.classList.add('on');
      }
    });
  }

  // ── Алхам харуулах ───────────────────────────────────
  showStep(idx) {
    // Одоогийн алхамын дугаарыг хадгална
    this.#currentStep = idx;

    // Алхам бүрийн HTML id-ууд — дарааллаар нь
    const ALL_IDS = ['first-step', 'second-step', 'third-step', 'fourth-step'];

    // Бүх алхмуудаас 'active' классыг арилгана (бүгдийг нуунэ)
    this.tabs.forEach(function(c) {
      c.classList.remove('active');
    });

    // Зөвхөн idx дугаартай алхамд 'active' класс нэмнэ (харуулна)
    document.getElementById(ALL_IDS[idx]).classList.add('active');

    // 4-р алхам (амжилт хуудас) биш бол stepper болон баримтыг харуулна
    if (idx < 3) {
      this.updateStepper(idx);
      this.stepperEl.style.display = '';  // '' = CSS-ийн анхдагч display утга руу буцаана
      this.receiptEl.style.display = '';
    }

    // switch — idx-ийн утгаас хамаарч харгалзах case-ийг ажиллуулна
    switch (idx) {
      case 0: // Сагсны алхам
        this.backBtn.style.display  = '';
        this.backBtn.textContent    = '← КАТАЛОГ';
        // onclick — товч дарагдахад ажиллах функц
        // location.href — хуудсыг шилжүүлнэ
        this.backBtn.onclick = function() { location.href = '/public/html/browse.html'; };
        this.nextBtn.style.display  = '';
        this.nextBtn.textContent    = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break; // switch-ийн энэ case-ийг дуусгана

      case 1: // Хүргэлтийн алхам
        this.backBtn.style.display  = '';
        this.backBtn.textContent    = '← БУЦАХ';
        this.backBtn.onclick = function() { this.showStep(0); }.bind(this);
        this.nextBtn.style.display  = '';
        this.nextBtn.textContent    = 'ҮРГЭЛЖЛҮҮЛЭХ →';
        break;

      case 2: // Баталгаажуулах алхам
        this.backBtn.style.display  = '';
        this.backBtn.textContent    = '← БУЦАХ';
        this.backBtn.onclick = function() { this.showStep(1); }.bind(this);
        this.nextBtn.style.display  = '';
        this.nextBtn.textContent    = 'ЗАХИАЛАХ →';
        break;

      case 3: // Амжилттай захиалгын алхам
        // Товчнууд болон хажуугийн баримтыг нуунэ
        this.backBtn.style.display   = 'none';
        this.nextBtn.style.display   = 'none';
        this.receiptEl.style.display = 'none';
        this.stepperEl.style.display = 'none';
        break;
    }
  }

  // ── Баримтыг шинэчлэх ───────────────────────────────
  updateReceipt(items) {
    // .reduce() — массивын элемент бүрийг нэгтгэж нэг утга гаргана
    // (s, it) => s + ... : s = хуримтлагдсан нийлбэр, it = одоогийн элемент
    // 0 — нийлбэрийн эхний утга (0-ээс эхэлнэ)
    const sub = items.reduce(function(s, it) {
      return s + priceFor(it.basePrice, it.selectedDays);
    }, 0);

    // items.length байвал (бараа байвал) хүргэлтийн үнэ нэмнэ, байхгүй бол 0
    const del = items.length ? DELIVERY : 0;

    // Барьцааны дүн = нийт үнэ × 0.30 (30%)
    const deposit = Math.round(sub * DEPOSIT_R);

    // Math.max(0, ...) — хасах тоо гарахаас сэргийлнэ (хамгийн багадаа 0)
    // sub + del + deposit - this.#promoDiscount — нийт дүнгээс хөнгөлөлтийг хасна
    const total = Math.max(0, sub + del + deposit - this.#promoDiscount);

    // if (this.$subtotal) — элемент байвал текстийг шинэчилнэ, null байвал алдаа гарахгүй
    if (this.$subtotal) { this.$subtotal.textContent = fmt(sub); }
    if (this.$delivery) { this.$delivery.textContent = fmt(del); }
    if (this.$deposit)  { this.$deposit.textContent  = fmt(deposit); }
    if (this.$total)    { this.$total.textContent    = fmt(total); }
  }

  // ── Бараа бүрийн HTML үүсгэх (private) ──────────────
  // # тэмдэгт — private функц, зөвхөн энэ класс дотроос дуудаж болно
  #buildItemHTML(item, idx) {
    // Гурван хугацааны үнийг урьдчилан тооцно
    const p1 = item.basePrice;                  // 1 өдрийн үнэ (үндсэн үнэ)
    const p3 = Math.round(p1 * 1.5);            // 3 өдрийн үнэ (үндсэн үнийн 1.5 дахин)
    const p7 = Math.round(p1 * 2.5);            // 7 өдрийн үнэ (үндсэн үнийн 2.5 дахин)
    const sel = item.selectedDays;              // Одоо сонгогдсон хугацаа

    // Template literal (` `) — JS хувьсагчийг ${...} ашиглан HTML дотор шууд оруулна
    // sel===1?' sel':'' — ternary: 1 өдөр сонгогдсон бол 'sel' класс нэмнэ, үгүй бол хоосон
    // sel===1?' checked':'' — ternary: 1 өдөр сонгогдсон бол 'checked' атрибут нэмнэ
    return `
    <article class="product-card">
      <figure class="card-visual" style="background:linear-gradient(135deg,#1a1714,#2d2520)">
        <img src="/public/source/${item.img}" alt="${item.name}">
      </figure>
      <section class="card-body">
        <p class="card-brand">${item.brand}</p>
        <h2 class="card-name">${item.name}</h2>
        <p class="card-meta">Хэмжээ: <strong>${item.size}</strong></p>
        <fieldset class="cart-dur-opts">
          <legend class="sr-only">Түрээсийн хугацаа</legend>
          <label class="cart-dur-btn${sel===1?' sel':''}">
            <input type="radio" name="dur-${idx}" value="1" data-idx="${idx}"${sel===1?' checked':''}>
            <span class="dur-days">1 өдөр</span><span class="dur-price">${fmt(p1)}</span>
          </label>
          <label class="cart-dur-btn${sel===3?' sel':''}">
            <input type="radio" name="dur-${idx}" value="3" data-idx="${idx}"${sel===3?' checked':''}>
            <span class="dur-days">3 өдөр</span><span class="dur-price">${fmt(p3)}</span>
          </label>
          <label class="cart-dur-btn${sel===7?' sel':''}">
            <input type="radio" name="dur-${idx}" value="7" data-idx="${idx}"${sel===7?' checked':''}>
            <span class="dur-days">7 өдөр</span><span class="dur-price">${fmt(p7)}</span>
          </label>
        </fieldset>
      </section>
      <footer class="card-footer">
        <strong class="price price--large">${fmt(priceFor(p1, sel))}</strong>
        <a href="#" class="card-remove" data-idx="${idx}">Хасах</a>
      </footer>
    </article>`;
  }

  // ── Сагсыг дэлгэцэнд харуулах ────────────────────────
  renderCart() {
    const items = this.getActiveItems();

    // innerHTML = '' — жагсаалтын агуулгыг бүрэн арилгана (дахин зурахын өмнө цэвэрлэнэ)
    this.cartList.innerHTML = '';

    // Сагс хоосон байвал "хоосон" мэдэгдэл харуулна
    if (!items.length) {
      this.cartList.innerHTML = `
        <li class="cart-empty">
          <p>Таны сагс хоосон байна.</p>
          <a href="/public/html/browse.html" class="btn-primary">← Каталогруу очих</a>
        </li>`;
      this.updateReceipt([]);
      return; // Цааш үргэлжлүүлэх шаардлагагүй тул зогсооно
    }

    // Бараа бүрт <li> элемент үүсгэж жагсаалтад нэмнэ
    items.forEach(function(item, idx) {
      const li = document.createElement('li'); // Шинэ <li> элемент үүсгэнэ
      li.innerHTML = this.#buildItemHTML(item, idx); // HTML дотор нь байрлуулна
      this.cartList.appendChild(li); // Жагсаалтын төгсгөлд нэмнэ
    }.bind(this));

    // ── Хугацааны radio товчнуудын үйлдэл ──────────────
    this.cartList.querySelectorAll('.cart-dur-btn input').forEach(function(radio) {
      radio.addEventListener('change', function() {
        // radio.dataset.idx — HTML дахь data-idx="${idx}" атрибутын утгыг уншина
        // parseInt(..., 10) — string-ийг бүхэл тоо болгоно
        const itemId = items[parseInt(radio.dataset.idx, 10)].id;

        // Бүх бараануудыг авч тухайн барааг хайна
        const all   = cart.getItems();
        const entry = all.find(function(c) { return c.id === itemId; });

        if (entry) {
          // Сонгосон хугацааг шинэчилнэ
          // parseInt(radio.value, 10) — radio-ийн value ("1","3","7")-ийг тоо болгоно
          entry.selectedDays = parseInt(radio.value, 10);
        }

        // Өөрчлөгдсөн жагсаалтыг localStorage-д хадгална
        cart.save(all);

        // Сагсыг дахин зурна (шинэ үнэтэй)
        this.renderCart();
      }.bind(this));
    }.bind(this));

    // ── "Хасах" товчнуудын үйлдэл ───────────────────────
    this.cartList.querySelectorAll('.card-remove').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        // e.preventDefault() — <a href="#"> дарахад хуудас дээш гүйлгэхийг зогсооно
        e.preventDefault();

        const itemId = items[parseInt(btn.dataset.idx, 10)].id;

        // Cart.js-ийн remove() — тухайн id-тай барааг localStorage-аас устгана
        cart.remove(itemId);

        // Сагсыг дахин зурна
        this.renderCart();
      }.bind(this));
    }.bind(this));

    // Баримтыг шинэ бараануудаар шинэчилнэ
    this.updateReceipt(items);
  }

  // ── Хүргэлтийн формын шалгалт ───────────────────────
  validateForm() {
    // ok = true — анхдагчаар бүх зүйл зөв гэж үзнэ
    let ok = true;

    // Шалгах талбаруудын id-ийн жагсаалт
    // forEach — жагсаалтын элемент бүрийг давтана
    ['d-name', 'd-phone', 'd-address'].forEach(function(id) {
      const el = document.getElementById(id);

      // Элемент байхгүй бол энэ давталтыг алгасна
      if (!el) return;

      if (!el.value.trim()) {
        // Хоосон байвал улаан хүрээ нэмж ok-г false болгоно
        el.classList.add('input-error');
        ok = false;
      } else {
        // Утга байвал улаан хүрээг арилгана
        el.classList.remove('input-error');
      }
    });

    // true буцаавал форм зөв, false буцаавал алдаатай талбар байна
    return ok;
  }

  // ── Баталгаажуулах алхамын агуулгыг үүсгэх ─────────
  buildConfirmation() {
    const items  = this.getActiveItems();
    const listEl = document.getElementById('confirm-item-list');
    const addrEl = document.getElementById('confirm-delivery-info');
    const payEl  = document.getElementById('confirm-payment');

    if (listEl) {
      // .map() — бараа бүрийг HTML string болгоно
      // .join('') — массивын элементүүдийг нэг string болгон нэгтгэнэ (хооронд хоосон зай байхгүй)
      listEl.innerHTML = items.map(function(it) {
        return `
        <article class="confirm-item">
          <figure class="confirm-item-fig" style="background:linear-gradient(135deg,#1a1714,#2d2520)">
            <img src="/public/source/${it.img}" alt="${it.name}">
          </figure>
          <section class="confirm-item-info">
            <h3>${it.name}</h3>
            <p>${it.size} · ${it.selectedDays} өдөр</p>
          </section>
          <strong class="confirm-item-price">${fmt(priceFor(it.basePrice, it.selectedDays))}</strong>
        </article>`;
      }).join('');
    }

    if (addrEl) {
      // v() — товч туслах функц: id-аар талбарын утгыг авна
      // ?.value — элемент байвал .value-г авна, null байвал undefined
      // || '—' — утга хоосон байвал '—' харуулна
      const v = function(id) {
        const el = document.getElementById(id);
        return el ? el.value : '—';
      };

      addrEl.innerHTML = `
        <p><strong>${v('d-name')}</strong> · <span>${v('d-phone')}</span></p>
        <p>${v('d-address')}</p>
        <p>${v('d-date')} · ${v('d-time')}</p>
        <p>${v('d-note') || 'Байхгүй'}</p>`;
    }

    if (payEl) {
      // document.querySelector('input[name="payment"]:checked') — сонгогдсон radio товчийг олно
      const checked = document.querySelector('input[name="payment"]:checked');

      // Объект дотроос checked.value-тай тохирох утгыг авна
      // { cash: '...', transfer: '...', qpay: '...' }[checked?.value]
      // жш: checked.value = 'cash' бол → 'Бэлэн мөнгө'
      // checked?.value — checked null байвал undefined буцаана (алдаа гарахгүй)
      // || '—' — тохирох утга олдохгүй бол '—' харуулна
      const paymentLabels = {
        cash    : 'Бэлэн мөнгө',
        transfer: 'Банкны шилжүүлэг',
        qpay    : 'QPay',
      };
      payEl.textContent = paymentLabels[checked ? checked.value : null] || '—';
    }
  }

  // ── Захиалга өгөх ─────────────────────────────────
  placeOrder() {
    // Санамсаргүй захиалгын дугаар үүсгэнэ
    // Math.random() — 0-ээс 1-ийн хооронд санамсаргүй float тоо буцаана (жш: 0.4821)
    // * 900000 → 0–900000 хооронд
    // + 100000 → 100000–1000000 хооронд
    // Math.floor() — тоог доош бүхэл болгоно (жш: 543210.7 → 543210)
    // 'RF-' + ... → жш: 'RF-543210'
    const orderId = 'RF-' + Math.floor(100000 + Math.random() * 900000);

    // Захиалгын дугаарыг хуудсанд харуулна
    const el = document.getElementById('order-id');
    if (el) {
      el.textContent = orderId;
    }

    if (this.#quickId) {
      // Шуурхай худалдаа байвал зөвхөн тухайн барааг сагснаас хасна
      cart.remove(this.#quickId);
    } else {
      // Ердийн захиалга бол бүх сагсыг цэвэрлэнэ
      cart.clear();
    }
  }

  // ── Промо кодуудыг серверээс ачаалах ────────────────
  async loadPromoCodes() {
    try {
      const r = await fetch('/public/json/promocode.json');

      // r.ok — HTTP статус 200-299 бол true
      if (r.ok) {
        this.#promoCodes = await r.json();
      }
    } catch (_) {
      // _ — алдааг санаатайгаар орхино (нэр өгөхгүй байна гэсэн дохио)
      // Файл байхгүй бол промо код ажиллахгүй, апп зогсохгүй
    }
  }

  // ── Промо код хэрэглэх ──────────────────────────────
  applyPromo() {
    const input = document.getElementById('promo-code');
    const msgEl = document.getElementById('promo-msg');

    // Input байхгүй эсвэл аль хэдийн идэвхгүй болсон бол зогсооно
    // input.disabled — өмнө амжилттай промо код хэрэглэсэн үед true болсон байна
    if (!input || input.disabled) return;

    // .trim() — хоосон зай арилгана, .toUpperCase() — том үсгэнд оруулна
    // жш: " sale10 " → "SALE10"
    const code  = input.value.trim().toUpperCase();

    // #promoCodes массиваас тохирох промо кодыг хайна
    const promo = this.#promoCodes.find(function(p) { return p.code === code; });

    // Алдаа харуулах туслах функц
    const showErr = function(msg) {
      input.style.borderColor = 'var(--red)'; // CSS хувьсагч ашиглан улаан өнгө болгоно
      if (msgEl) {
        msgEl.textContent  = msg;
        msgEl.style.color  = 'var(--red)';
      }
      input.focus(); // Курсорыг input руу буцаана
    };

    // Тохирох промо код олдохгүй бол алдаа харуулна
    if (!promo) {
      return showErr('Промо код хүчингүй байна.');
    }

    // Өнөөдрийн огноог "YYYY-MM-DD" форматаар авна
    // new Date() — одоогийн цаг огноо
    // .toISOString() — "2026-04-18T10:30:00.000Z" форматад хөрвүүлнэ
    // .slice(0, 10) — эхний 10 тэмдэгтийг авна → "2026-04-18"
    const today = new Date().toISOString().slice(0, 10);

    // Промо код идэвхжих огноо ирээгүй бол
    // promo.starts_at > today — string харьцуулалт, "2026-05-01" > "2026-04-18" → true
    if (promo.starts_at > today) {
      return showErr('Промо код идэвхжээгүй байна.');
    }

    // Промо кодын хугацаа дууссан бол
    if (promo.expires_at < today) {
      return showErr('Промо кодын хугацаа дууссан байна.');
    }

    // Хөнгөлөлтийн дүнг тооцно
    // .reduce() — бүх бараануудын үнийг нэгтгэнэ
    const sub = this.getActiveItems().reduce(function(s, it) {
      return s + priceFor(it.basePrice, it.selectedDays);
    }, 0);

    // promo.discount — хувь (жш: 0.1 = 10%)
    // Math.round() — бүхэл тоо болгоно
    this.#promoDiscount = Math.round(sub * promo.discount);

    // Хөнгөлөлтийн мөрийг харуулна (анхдагчаар нуугдсан байна)
    if (this.$discRow) {
      this.$discRow.style.display = ''; // '' = CSS-ийн анхдагч display руу буцаана (харуулна)
    }
    if (this.$discAmt) {
      this.$discAmt.textContent = '-' + fmt(this.#promoDiscount); // жш: "-3,000₮"
    }

    // Амжилттай болсны тэмдэг — ногоон өнгө
    input.style.borderColor = 'var(--green)';
    input.disabled = true; // Input-ийг идэвхгүй болгоно — дахин код оруулж болохгүй
    if (msgEl) {
      msgEl.textContent = promo.description + ' хэрэглэгдлээ ✓';
      msgEl.style.color = 'var(--green)';
    }

    // Баримтыг шинэ хөнгөлөлттэй дүнгээр шинэчилнэ
    this.updateReceipt(this.getActiveItems());
  }

  // ── Бүх товчнуудын үйлдлийг холбох ─────────────────
  setupListeners() {

    // ── Хүргэлтийн формын талбарууд — бичихэд улаан хүрээ арилгана ──
    ['d-name', 'd-phone', 'd-address'].forEach(function(id) {
      const el = document.getElementById(id);

      // Элемент байвал addEventListener дуудна, null байвал алдаа гарахгүй орхино
      if (el) {
        // 'input' үйлдэл — хэрэглэгч тэмдэгт бичих бүрт ажиллана
        el.addEventListener('input', function() {
          // this — addEventListener дотор энэ тухайн input элементийг заана
          if (this.value.trim()) {
            this.classList.remove('input-error'); // Утга байвал улаан хүрээг арилгана
          }
        });
      }
    });

    // ── Промо кодын товч ──────────────────────────────
    const promoBtn = document.querySelector('.receipt-promo-row button');
    if (promoBtn) {
      promoBtn.addEventListener('click', function() {
        this.applyPromo();
      }.bind(this));
    }

    // ── Промо кодын input дээр Enter дарахад мөн хэрэглэнэ ──
    const promoInput = document.getElementById('promo-code');
    if (promoInput) {
      promoInput.addEventListener('keydown', function(e) {
        // e.key — дарагдсан товчны нэр
        if (e.key === 'Enter') {
          this.applyPromo();
        }
      }.bind(this));
    }

    // ── "Үргэлжлүүлэх / Захиалах" товч ──────────────
    this.nextBtn.addEventListener('click', function() {
      if (this.#currentStep === 0) {
        // Сагс хоосон байвал алхам ахиулахгүй
        if (!this.getActiveItems().length) return;
        this.showStep(1);

      } else if (this.#currentStep === 1) {
        // Форм буруу бөглөсөн байвал алхам ахиулахгүй
        if (!this.validateForm()) return;
        this.buildConfirmation(); // Баталгаажуулах хуудсыг мэдээллээр дүүргэнэ
        this.showStep(2);

      } else if (this.#currentStep === 2) {
        this.placeOrder(); // Захиалга өгнө
        this.showStep(3);  // Амжилтын хуудас руу шилжинэ
      }
    }.bind(this));

    // ── "Засах" товч — баталгаажуулах алхмаас хүргэлт рүү буцна ──
    const confirmEditBtn = document.querySelector('.confirm-edit-btn');
    if (confirmEditBtn) {
      confirmEditBtn.addEventListener('click', function(e) {
        e.preventDefault(); // <a> тагийн анхдагч үйлдлийг зогсооно
        this.showStep(1);
      }.bind(this));
    }

    // ── "Каталог руу очих" товч — амжилтын хуудас дээр ──
    const successBtn = document.querySelector('.order-success .btn-primary');
    if (successBtn) {
      successBtn.addEventListener('click', function() {
        location.href = '/public/html/browse.html';
      });
    }
  }

  // ── Эхлүүлэх ────────────────────────────────────────
  async init() {
    // Promise.all([...]) — хоёр async функцийг зэрэг ажиллуулна
    // Хоёулаа дуустал хүлээгээд цааш үргэлжилнэ (дараалан биш, зэрэг)
    await Promise.all([this.seedIfEmpty(), this.loadPromoCodes()]);

    this.setupListeners(); // Бүх товч болон үйлдлүүдийг холбоно
    this.showStep(0);      // Эхний алхам (сагс) руу очно
    this.renderCart();     // Сагсыг дэлгэцэнд харуулна
  }
}

// CartPage instance үүсгэж шууд init() дуудна
// Хуудас нээгдэхэд автоматаар ажиллана
new CartPage().init();
