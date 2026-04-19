/* ══════════════════════════════════════════════════════════
   RENTFIT — auth.js
   Login / register / session across all pages
══════════════════════════════════════════════════════════ */

import Auth from './modules/Auth.js';

const auth = new Auth();

// ── AuthUI class ─────────────────────────────────────────
class AuthUI {
  #auth;

  constructor(authInstance) {
    this.#auth = authInstance;
  }
  // Auth.js iig auth instanced hadgalj ashiglahad amar bolgoj bn
  //ingsner this.#auth.getSession() gvel Auth.js-d bga getSession-iig ashiglaj bolno gsen ug
  // ── Modal HTML injection ──────────────────────────────
  injectModals() {
    if (document.getElementById('loginModal')) return;
    // index.html-d loginModal bga eshiig shalgaj bga ba bhgu bol daraahiig oruulna
    document.body.insertAdjacentHTML('beforeend', `
    <div class="modal" id="loginModal">
      <article class="modal-content">
        <button class="modal-close" id="closeBtn" aria-label="Хаах">&times;</button>
        <header class="modal-header">
          <h2>Нэвтрэх</h2>
          <p>Эрхээ оруулж системд нэвтэрнэ үү</p>
        </header>
        <form class="modal-form" id="loginForm" novalidate>
          <p class="form-field">
            <label for="m-email">И-мэйл</label>
            <input id="m-email" type="email" placeholder="email@example.com" autocomplete="email" required />
            <span class="field-error" id="login-email-err"></span>
          </p>
          <p class="form-field">
            <label for="m-pass">Нууц үг</label>
            <input id="m-pass" type="password" placeholder="••••••••" autocomplete="current-password" required />
            <span class="field-error" id="login-pass-err"></span>
          </p>
          <p class="field-error" id="login-general-err" style="text-align:center"></p>
          <button type="submit" class="modal-submit">Нэвтрэх</button>
        </form>
        <div class="modal-divider"><span>эсвэл</span></div>
        <footer class="modal-footer">
          <p>Бүртгэл байхгүй юу? <a href="#" id="switchToRegister">Бүртгүүлэх</a></p>
        </footer>
      </article>
    </div>

    <div class="modal" id="registerModal">
      <article class="modal-content">
        <button class="modal-close" id="registerCloseBtn" aria-label="Хаах">&times;</button>
        <header class="modal-header">
          <h2>Бүртгүүлэх</h2>
          <p>Шинэ эрх үүсгэж RentFit-д нэгдэнэ үү</p>
        </header>
        <form class="modal-form" id="registerForm" novalidate>
          <p class="form-field">
            <label for="r-name">Овог нэр</label>
            <input id="r-name" type="text" placeholder="Бат Болд" autocomplete="name" required />
            <span class="field-error" id="reg-name-err"></span>
          </p>
          <p class="form-field">
            <label for="r-email">И-мэйл</label>
            <input id="r-email" type="email" placeholder="email@example.com" autocomplete="email" required />
            <span class="field-error" id="reg-email-err"></span>
          </p>
          <p class="form-field">
            <label for="r-phone">Утасны дугаар</label>
            <input id="r-phone" type="tel" placeholder="9911-0000" autocomplete="tel" required />
            <span class="field-error" id="reg-phone-err"></span>
          </p>
          <p class="form-field">
            <label for="r-pass">Нууц үг</label>
            <input id="r-pass" type="password" placeholder="••••••••" autocomplete="new-password" required />
            <span class="field-error" id="reg-pass-err"></span>
          </p>
          <p class="form-field">
            <label for="r-pass2">Нууц үг давтах</label>
            <input id="r-pass2" type="password" placeholder="••••••••" autocomplete="new-password" required />
            <span class="field-error" id="reg-pass2-err"></span>
          </p>
          <p class="field-error" id="reg-general-err" style="text-align:center"></p>
          <button type="submit" class="modal-submit">Бүртгүүлэх</button>
        </form>
        <div class="modal-divider"><span>эсвэл</span></div>
        <footer class="modal-footer">
          <p>Аль хэдийн бүртгэлтэй юу? <a href="#" id="switchToLogin">Нэвтрэх</a></p>
        </footer>
      </article>
    </div>`);
  }

  // ── Modal helpers ─────────────────────────────────────
  openModal(modal) {
    if (modal) {
      modal.classList.add('open');
    }
  }
  // deerh html inject hiih ued class=modal iig unshij bval clasd open iig nemj class=model open bolgono
  // ingsneer css deerh .modal.open. ajillaj haragdana
  closeModal(modal) {
    if (modal) {
      modal.classList.remove('open');
    }
  }
  // deerhtei ijil zarchmar ajillan ghde arilgana

  clearErrors() {
    const allErrorSpans = document.querySelectorAll('.field-error');
    allErrorSpans.forEach(function(errorSpan) {
      errorSpan.textContent = '';
    });
  }
  //input field buriin door bh error messagud herev olson bol ed nariig arilgah
  showError(id, msg) {
    const errorSpan = document.getElementById(id);
    if (errorSpan) {
      errorSpan.textContent = msg;
    }
  }
  //todorhoi input fieldiin dor error messagte span uldeene

  // ── Nav button state ──────────────────────────────────
  updateNavBtn() {
    // localStorage-аас нэвтэрсэн хэрэглэгчийг шалгана
    const user = this.#auth.getSession();

    // Дескоп болон мобайл nav-ийн товчлуурыг олно
    const loginBtn  = document.getElementById('loginBtn');
    const mobileBtn = document.getElementById('mobileLoginBtn');

    // Энэ хуудсанд loginBtn байхгүй бол зогсоно
    if (!loginBtn) return;

    if (user) {
      // ── Хэрэглэгч нэвтэрсэн үед ─────────────────────

      // Нэрийн эхний үсгийг авна: full_name → username → '?' дарааллаар
      // .trim() хоосон зай арилгана, .charAt(0) эхний үсэг, .toUpperCase() томоор болгоно
      const initial = (user.full_name || user.username || '?').trim().charAt(0).toUpperCase();

      // Тухайн үсгийг агуулсан дугуй аватар HTML үүсгэнэ
      const avatar = `<span class="user-avatar">${initial}</span>`;

      // Товчлуурын дотоорхыг аватараар солино
      loginBtn.innerHTML = avatar;

      // hover хийэд хэрэглэгчийн нэр харуулна
      loginBtn.title = user.full_name || user.username;

      // Аватар дарахад dropdown нээгдэнэ
      // e.stopPropagation() — дарах үйлдэл хуудас руу дамжихгүй байхад хэрэглэнэ
      loginBtn.onclick = function(e) {
        e.stopPropagation();
        this.toggleDropdown(user);
      }.bind(this);

      // Мобайл товчлуурт мөн адил аватар болон үйлдлийг хэрэглэнэ
      if (mobileBtn) {
        mobileBtn.innerHTML = avatar;
        mobileBtn.onclick   = loginBtn.onclick;
      }

    } else {
      // ── Хэрэглэгч нэвтрээгүй үед ────────────────────

      // Хүний дүрс SVG икон (дугуй = толгой, муруй зам = мөр)
      const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;

      // Товчлуурт хүний дүрс иконыг харуулна
      loginBtn.innerHTML = icon;

      // Хулганаар дээгүүр байхад "Нэвтрэх" tooltip харуулна
      loginBtn.title = 'Нэвтрэх';

      // Икон дарахад нэвтрэх modal нээгдэнэ
      loginBtn.onclick = () => {
        const loginModal = document.getElementById('loginModal');
        this.openModal(loginModal);
      };

      // Мобайл товчлуурт мөн адил икон болон үйлдлийг хэрэглэнэ
      if (mobileBtn) {
        mobileBtn.innerHTML = icon;
        mobileBtn.onclick   = loginBtn.onclick;
      }
    }
  }

  // ── User dropdown ─────────────────────────────────────
  toggleDropdown(user) {
    // Dropdown аль хэдийн нээлттэй байвал хаана (toggle зарчим)
    const existing = document.getElementById('user-dropdown');
    if (existing) { existing.remove(); return; }

    // Шинэ dropdown div элемент үүсгэж id болон класс оноона
    const drop = document.createElement('div');
    drop.id = 'user-dropdown';
    drop.className = 'user-dropdown';

    // Хэрэглэгчийн нэр, имэйл, membership мэдээллийг dropdown дотор харуулна
    drop.innerHTML = `
      <div class="user-dropdown-info">
        <strong>${user.full_name || user.username}</strong>
        <span>${user.email}</span>
        <span class="membership-badge">${user.membership === 'premium' ? '★ Premium' : 'Standard'}</span>
      </div>
      <hr>
      <button id="logoutBtn">Гарах</button>`;

    // Dropdown-ийг loginBtn-ийн яг ард байрлуулна
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.parentElement.style.position = 'relative';
    loginBtn.insertAdjacentElement('afterend', drop);

    // "Гарах" дарахад session устгаж nav товчлуурыг шинэчилнэ
    document.getElementById('logoutBtn').onclick = () => {
      this.#auth.clearSession();
      drop.remove();
      this.updateNavBtn();
    };

    // Dropdown-оос гадна хаана ч дарвал автоматаар хаагдана
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!drop.contains(e.target)) { drop.remove(); document.removeEventListener('click', handler); }
      });
    }, 0);
  }

  // ── Modal үйлдлүүдийг холбох ─────────────────────────
  wire() {

    // Хоёр modal-ийг олж хувьсагчид хадгална — доорх бүх үйлдэлд ашиглана
    const loginModal    = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');

    // ── Хаах товчнууд ──────────────────────────────────

    // Нэвтрэх modal-ийн X товч дарахад loginModal хаагдана
    // getElementById('closeBtn') нь closeBtn id-тай элементийг хайна
    // Хэрэв олдвол addEventListener дуудна, олдохгүй бол null буцааж алдаа гарахгүй
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal(loginModal);
      });
    }

    // Бүртгүүлэх modal-ийн X товч дарахад registerModal хаагдана
    // registerCloseBtn байвал addEventListener дуудна, null байвал алдаа гарахгүй орхино
    const registerCloseBtn = document.getElementById('registerCloseBtn');
    if (registerCloseBtn) {
      registerCloseBtn.addEventListener('click', () => {
        this.closeModal(registerModal);
      });
    }

    // ── Modal солих холбоосууд ──────────────────────────

    // "Бүртгүүлэх" холбоос дарахад:
    // 1. Хуудас refresh болохгүйн тулд e.preventDefault() дуудна
    // 2. Өмнөх алдааны мэдэгдлүүдийг арилгана
    // 3. Нэвтрэх modal хаагдаж бүртгүүлэх modal нээгдэнэ
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearErrors();
        this.closeModal(loginModal);
        this.openModal(registerModal);
      });
    }

    // "Нэвтрэх" холбоос дарахад:
    // 1. Хуудас refresh болохгүйн тулд e.preventDefault() дуудна
    // 2. Өмнөх алдааны мэдэгдлүүдийг арилгана
    // 3. Бүртгүүлэх modal хаагдаж нэвтрэх modal нээгдэнэ
    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearErrors();
        this.closeModal(registerModal);
        this.openModal(loginModal);
      });
    }

    // ── Backdrop болон гарын товчны хаалтууд ───────────

    // Modal-ийн backdrop дарахад хаагдана
    // Modal-ийн backdrop дарахад хаагдана
    // loginModal байвал addEventListener дуудна, null байвал алдаа гарахгүй орхино
    if (loginModal) {
      loginModal.addEventListener('click', (e) => {
        // e.target — хэрэглэгч яг хаана дарсан элементийг илэрхийлнэ
        // e.target === loginModal — modal-ийн өөрийн backdrop дарсан эсэхийг шалгана
        // modal дотрх товч, input зэрэгт дарсан бол e.target өөр элемент байх тул хаагдахгүй
        if (e.target === loginModal) {
          this.closeModal(loginModal);
        }
      });
    }

    // registerModal байвал addEventListener дуудна, null байвал алдаа гарахгүй орхино
    if (registerModal) {
      registerModal.addEventListener('click', (e) => {
        // Мөн адил зарчмаар — зөвхөн арын хэсэгт дарсан үед хаагдана
        if (e.target === registerModal) {
          this.closeModal(registerModal);
        }
      });
    }

    // Гарны Escape товч дарахад аль ч нээлттэй modal хаагдана
    // document дээр сонсогч тавьсан учир хуудасны хаана ч байхад ажиллана
    document.addEventListener('keydown', (e) => {
      // e.key — дарагдсан товчны нэрийг илэрхийлнэ (жш: 'Escape', 'Enter', 'a')
      if (e.key === 'Escape') {
        this.closeModal(loginModal);
        this.closeModal(registerModal);
      }
    });

    // ── Нэвтрэх форм илгээх ────────────────────────────

    // loginForm байвал addEventListener дуудна, null байвал алдаа гарахгүй орхино
    // async — findUser() await хийдэг тул энэ функц async байх шаардлагатай
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        // Хуудас refresh болохгүйн тулд default үйлдлийг зогсооно
        e.preventDefault();

        // Өмнөх алдааны мэдэгдлүүдийг арилгана
        this.clearErrors();

        // Формын талбаруудаас утгыг уншина
        // .trim() — эхэн болон төгсгөлийн хоосон зайг арилгана
        const email = document.getElementById('m-email').value.trim();
        const pass  = document.getElementById('m-pass').value;

        // Талбар хоосон байвал алдаа харуулж зогсоно
        if (!email) return this.showError('login-email-err', 'И-мэйл оруулна уу');
        if (!pass)  return this.showError('login-pass-err',  'Нууц үг оруулна уу');

        // Auth.js-ийн findUser() ашиглан бүх хэрэглэгчдээс тохирохыг хайна
        const user = await this.#auth.findUser(email, pass);

        if (!user) {
          // Тохирох хэрэглэгч олдохгүй бол алдаа харуулна
          // Нууц үгийн талбарыг цэвэрлэнэ — аюулгүй байдлын үүднээс
          this.showError('login-general-err', 'И-мэйл эсвэл нууц үг буруу байна.');
          document.getElementById('m-pass').value = '';
          return;
        }

        // Нэвтрэлт амжилттай:
        // 1. Сессийг localStorage-д хадгална
        // 2. Modal хаана
        // 3. Nav товчлуурыг аватараар шинэчилнэ
        // 4. Формын талбаруудыг цэвэрлэнэ
        this.#auth.setSession(user);
        this.closeModal(loginModal);
        this.updateNavBtn();
        loginForm.reset();
      });
    }

    // ── Бүртгүүлэх форм илгээх ─────────────────────────

    // registerForm байвал addEventListener дуудна, null байвал алдаа гарахгүй орхино
    // async — emailExists() await хийдэг тул энэ функц async байх шаардлагатай
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        // Хуудас refresh болохгүйн тулд default үйлдлийг зогсооно
        e.preventDefault();

        // Өмнөх алдааны мэдэгдлүүдийг арилгана
        this.clearErrors();

        // Формын 5 талбараас утгыг уншина
        // trim() hoyr tallin hooson zaig ustgana
        const fullName = document.getElementById('r-name').value.trim();
        const email    = document.getElementById('r-email').value.trim();
        const phone    = document.getElementById('r-phone').value.trim();
        const pass     = document.getElementById('r-pass').value;
        const pass2    = document.getElementById('r-pass2').value;

        // Бүх талбаруудыг шалгана
        // ok = false болвол submit цааш үргэлжлэхгүй
        let ok = true;
        if (!fullName)               { this.showError('reg-name-err',  'Нэр оруулна уу');              ok = false; }
        if (!email)                  { this.showError('reg-email-err', 'И-мэйл оруулна уу');           ok = false; }
        if (!phone)                  { this.showError('reg-phone-err', 'Утас оруулна уу');              ok = false; }
        if (!pass)                   { this.showError('reg-pass-err',  'Нууц үг оруулна уу');          ok = false; }
        if (pass && pass.length < 6) { this.showError('reg-pass-err',  'Хамгийн багадаа 6 тэмдэгт'); ok = false; }
        if (pass !== pass2)          { this.showError('reg-pass2-err', 'Нууц үг таарахгүй байна');     ok = false; }

        // Аль нэг шалгалт амжилтгүй болсон бол зогсоно
        if (!ok) return;

        // Имэйл аль хэдийн бүртгэлтэй эсэхийг шалгана — давхар бүртгэл хориглоно
        if (await this.#auth.emailExists(email)) {
          return this.showError('reg-general-err', 'Энэ и-мэйл хаяг бүртгэлтэй байна.');
        }

        // Шинэ хэрэглэгчийн объект үүсгэнэ
        // user_id — 'u' + одоогийн цаг (мс) → давтагдашгүй ID (жш: 'u1713456789123')
        // username — имэйлийн @ тэмдэгтийн өмнөх хэсэг (жш: 'bat' from 'bat@mail.com')
        const newUser = {
          user_id        : 'u' + Date.now(),
          username       : email.split('@')[0],
          full_name      : fullName,
          email          : email,
          password       : pass,
          phone          : phone,
          membership     : 'standard',
          published_items: [],
          rented_items   : [],
        };

        // Auth.js-ийн register() — localStorage-д хадгална
        this.#auth.register(newUser);

        // Auth.js-ийн setSession() — бүртгүүлсний дараа автоматаар нэвтрүүлнэ
        this.#auth.setSession(newUser);

        // Modal хаагдаж nav товчлуур шинэчлэгдэнэ, форм цэвэрлэгдэнэ
        this.closeModal(registerModal);
        this.updateNavBtn();
        registerForm.reset();
      });
    }
  }

  // ── Эхлүүлэх ─────────────────────────────────────────
  init() {
    this.injectModals();  // 1. Modal HTML-ийг хуудсанд нэмнэ
    this.wire();          // 2. Бүх товч болон формын үйлдлүүдийг холбоно
    this.updateNavBtn();  // 3. Nav товчлуурын төлөвийг тохируулна
  }
}

// Хуудас бүрэн ачаалагдсаны дараа AuthUI-г эхлүүлнэ
document.addEventListener('DOMContentLoaded', () => new AuthUI(auth).init());
