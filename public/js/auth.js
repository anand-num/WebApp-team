/* ══════════════════════════════════════════════════════════
   RENTFIT — auth.js
   Login / register / session across all pages
══════════════════════════════════════════════════════════ */
'use strict';

const AUTH_KEY  = 'rf_user';
const REG_KEY   = 'rf_registered';

/* ── Session helpers ─────────────────────────────────── */
function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}
function setSession(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

/* ── Registered users stored in localStorage ─────────── */
function getRegistered() {
  try { return JSON.parse(localStorage.getItem(REG_KEY)) || []; }
  catch { return []; }
}
function saveRegistered(users) {
  localStorage.setItem(REG_KEY, JSON.stringify(users));
}

/* ── Inject modal HTML if not already in page ────────── */
function injectModals() {
  if (document.getElementById('loginModal')) return; // already present

  const html = `
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
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
}

/* ── Update login button state ───────────────────────── */
function updateNavBtn() {
  const user    = getSession();
  const loginBtn = document.getElementById('loginBtn');
  const mobileBtn = document.getElementById('mobileLoginBtn');
  if (!loginBtn) return;

  if (user) {
    const initial = (user.full_name || user.username || '?').trim().charAt(0).toUpperCase();
    loginBtn.innerHTML = `<span class="user-avatar">${initial}</span>`;
    loginBtn.title = user.full_name || user.username;
    if (mobileBtn) {
      mobileBtn.innerHTML = `<span class="user-avatar">${initial}</span>`;
    }
    // Show dropdown on click instead of opening modal
    loginBtn.onclick = (e) => {
      e.stopPropagation();
      toggleUserDropdown(user);
    };
    if (mobileBtn) {
      mobileBtn.onclick = (e) => {
        e.stopPropagation();
        toggleUserDropdown(user);
      };
    }
  } else {
    loginBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
    loginBtn.title = 'Нэвтрэх';
    loginBtn.onclick = () => openModal(document.getElementById('loginModal'));
    if (mobileBtn) {
      mobileBtn.innerHTML = loginBtn.innerHTML;
      mobileBtn.onclick = () => openModal(document.getElementById('loginModal'));
    }
  }
}

/* ── User dropdown ───────────────────────────────────── */
function toggleUserDropdown(user) {
  let existing = document.getElementById('user-dropdown');
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
    clearSession();
    drop.remove();
    updateNavBtn();
  };

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!drop.contains(e.target)) {
        drop.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

/* ── Modal helpers ───────────────────────────────────── */
function openModal(modal) {
  if (modal) modal.classList.add('open');
}
function closeModal(modal) {
  if (modal) modal.classList.remove('open');
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.modal-form input').forEach(el => el.style.borderColor = '');
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) el.textContent = msg;
}

/* ── Wire up modal events ────────────────────────────── */
function wireModals() {
  const loginModal    = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const loginForm     = document.getElementById('loginForm');
  const registerForm  = document.getElementById('registerForm');

  document.getElementById('closeBtn')?.addEventListener('click', () => closeModal(loginModal));
  document.getElementById('registerCloseBtn')?.addEventListener('click', () => closeModal(registerModal));

  document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
    e.preventDefault(); clearErrors();
    closeModal(loginModal); openModal(registerModal);
  });
  document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
    e.preventDefault(); clearErrors();
    closeModal(registerModal); openModal(loginModal);
  });

  loginModal?.addEventListener('click', (e) => { if (e.target === loginModal) closeModal(loginModal); });
  registerModal?.addEventListener('click', (e) => { if (e.target === registerModal) closeModal(registerModal); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(loginModal); closeModal(registerModal); }
  });

  // ── Login submit ──────────────────────────────────────
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('m-email').value.trim();
    const pass  = document.getElementById('m-pass').value;

    if (!email) { showError('login-email-err', 'И-мэйл оруулна уу'); return; }
    if (!pass)  { showError('login-pass-err',  'Нууц үг оруулна уу'); return; }

    // Load users from JSON + registered
    let users = [];
    try {
      const r = await fetch('/public/json/user.json');
      if (r.ok) users = await r.json();
    } catch (_) {}
    users = [...users, ...getRegistered()];

    const match = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === pass
    );

    if (!match) {
      showError('login-general-err', 'И-мэйл эсвэл нууц үг буруу байна.');
      document.getElementById('m-pass').value = '';
      return;
    }

    setSession(match);
    closeModal(loginModal);
    updateNavBtn();
    loginForm.reset();
  });

  // ── Register submit ───────────────────────────────────
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const fullName = document.getElementById('r-name').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const phone    = document.getElementById('r-phone').value.trim();
    const pass     = document.getElementById('r-pass').value;
    const pass2    = document.getElementById('r-pass2').value;

    let valid = true;
    if (!fullName) { showError('reg-name-err',  'Нэр оруулна уу');       valid = false; }
    if (!email)    { showError('reg-email-err',  'И-мэйл оруулна уу');    valid = false; }
    if (!phone)    { showError('reg-phone-err',  'Утас оруулна уу');       valid = false; }
    if (!pass)     { showError('reg-pass-err',   'Нууц үг оруулна уу');   valid = false; }
    if (pass && pass.length < 6) { showError('reg-pass-err', 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'); valid = false; }
    if (pass !== pass2) { showError('reg-pass2-err', 'Нууц үг таарахгүй байна'); valid = false; }
    if (!valid) return;

    // Check duplicate email
    let existing = [];
    try {
      const r = await fetch('/public/json/user.json');
      if (r.ok) existing = await r.json();
    } catch (_) {}
    existing = [...existing, ...getRegistered()];

    if (existing.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      showError('reg-general-err', 'Энэ и-мэйл хаяг бүртгэлтэй байна.');
      return;
    }

    const newUser = {
      user_id:    'u' + Date.now(),
      username:   email.split('@')[0],
      full_name:  fullName,
      email,
      password:   pass,
      phone,
      membership: 'standard',
      published_items: [],
      rented_items:    [],
    };

    const registered = getRegistered();
    registered.push(newUser);
    saveRegistered(registered);

    setSession(newUser);
    closeModal(registerModal);
    updateNavBtn();
    registerForm.reset();
  });
}

/* ── Boot ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectModals();
  wireModals();
  updateNavBtn();
});
