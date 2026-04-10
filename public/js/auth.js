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

  // ── Modal HTML injection ──────────────────────────────
  injectModals() {
    if (document.getElementById('loginModal')) return;

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
  openModal(modal)  { modal?.classList.add('open'); }
  closeModal(modal) { modal?.classList.remove('open'); }

  clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  }

  showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  // ── Nav button state ──────────────────────────────────
  updateNavBtn() {
    const user     = this.#auth.getSession();
    const loginBtn = document.getElementById('loginBtn');
    const mobileBtn = document.getElementById('mobileLoginBtn');
    if (!loginBtn) return;

    if (user) {
      const initial = (user.full_name || user.username || '?').trim().charAt(0).toUpperCase();
      const avatar  = `<span class="user-avatar">${initial}</span>`;
      loginBtn.innerHTML = avatar;
      loginBtn.title = user.full_name || user.username;
      loginBtn.onclick = (e) => { e.stopPropagation(); this.toggleDropdown(user); };
      if (mobileBtn) { mobileBtn.innerHTML = avatar; mobileBtn.onclick = loginBtn.onclick; }
    } else {
      const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
      loginBtn.innerHTML = icon;
      loginBtn.title = 'Нэвтрэх';
      loginBtn.onclick = () => this.openModal(document.getElementById('loginModal'));
      if (mobileBtn) { mobileBtn.innerHTML = icon; mobileBtn.onclick = loginBtn.onclick; }
    }
  }

  // ── User dropdown ─────────────────────────────────────
  toggleDropdown(user) {
    const existing = document.getElementById('user-dropdown');
    if (existing) { existing.remove(); return; }

    const drop = document.createElement('div');
    drop.id = 'user-dropdown';
    drop.className = 'user-dropdown';
    drop.innerHTML = `
      <div class="user-dropdown-info">
        <strong>${user.full_name || user.username}</strong>
        <span>${user.email}</span>
        <span class="membership-badge">${user.membership === 'premium' ? '★ Premium' : 'Standard'}</span>
      </div>
      <hr>
      <button id="logoutBtn">Гарах</button>`;

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.parentElement.style.position = 'relative';
    loginBtn.insertAdjacentElement('afterend', drop);

    document.getElementById('logoutBtn').onclick = () => {
      this.#auth.clearSession();
      drop.remove();
      this.updateNavBtn();
    };

    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!drop.contains(e.target)) { drop.remove(); document.removeEventListener('click', handler); }
      });
    }, 0);
  }

  // ── Wire up modal events ──────────────────────────────
  wire() {
    const loginModal    = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');

    document.getElementById('closeBtn')?.addEventListener('click', () => this.closeModal(loginModal));
    document.getElementById('registerCloseBtn')?.addEventListener('click', () => this.closeModal(registerModal));

    document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
      e.preventDefault(); this.clearErrors();
      this.closeModal(loginModal); this.openModal(registerModal);
    });
    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
      e.preventDefault(); this.clearErrors();
      this.closeModal(registerModal); this.openModal(loginModal);
    });

    loginModal?.addEventListener('click',    e => { if (e.target === loginModal)    this.closeModal(loginModal); });
    registerModal?.addEventListener('click', e => { if (e.target === registerModal) this.closeModal(registerModal); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this.closeModal(loginModal); this.closeModal(registerModal); }
    });

    // Login submit
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault(); this.clearErrors();
      const email = document.getElementById('m-email').value.trim();
      const pass  = document.getElementById('m-pass').value;
      if (!email) return this.showError('login-email-err', 'И-мэйл оруулна уу');
      if (!pass)  return this.showError('login-pass-err',  'Нууц үг оруулна уу');

      const user = await this.#auth.findUser(email, pass);
      if (!user) {
        this.showError('login-general-err', 'И-мэйл эсвэл нууц үг буруу байна.');
        document.getElementById('m-pass').value = '';
        return;
      }
      this.#auth.setSession(user);
      this.closeModal(loginModal);
      this.updateNavBtn();
      document.getElementById('loginForm').reset();
    });

    // Register submit
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault(); this.clearErrors();
      const fullName = document.getElementById('r-name').value.trim();
      const email    = document.getElementById('r-email').value.trim();
      const phone    = document.getElementById('r-phone').value.trim();
      const pass     = document.getElementById('r-pass').value;
      const pass2    = document.getElementById('r-pass2').value;

      let ok = true;
      if (!fullName)           { this.showError('reg-name-err',  'Нэр оруулна уу');                     ok = false; }
      if (!email)              { this.showError('reg-email-err', 'И-мэйл оруулна уу');                  ok = false; }
      if (!phone)              { this.showError('reg-phone-err', 'Утас оруулна уу');                     ok = false; }
      if (!pass)               { this.showError('reg-pass-err',  'Нууц үг оруулна уу');                 ok = false; }
      if (pass && pass.length < 6) { this.showError('reg-pass-err', 'Хамгийн багадаа 6 тэмдэгт');      ok = false; }
      if (pass !== pass2)      { this.showError('reg-pass2-err', 'Нууц үг таарахгүй байна');            ok = false; }
      if (!ok) return;

      if (await this.#auth.emailExists(email)) {
        return this.showError('reg-general-err', 'Энэ и-мэйл хаяг бүртгэлтэй байна.');
      }

      const newUser = {
        user_id: 'u' + Date.now(), username: email.split('@')[0],
        full_name: fullName, email, password: pass, phone,
        membership: 'standard', published_items: [], rented_items: [],
      };
      this.#auth.register(newUser);
      this.#auth.setSession(newUser);
      this.closeModal(registerModal);
      this.updateNavBtn();
      document.getElementById('registerForm').reset();
    });
  }

  // ── Boot ─────────────────────────────────────────────
  init() {
    this.injectModals();
    this.wire();
    this.updateNavBtn();
  }
}

// ── Start ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => new AuthUI(auth).init());
