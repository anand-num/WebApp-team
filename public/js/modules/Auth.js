/* ══════════════════════════════════════════════════════════
   MODULE — Auth
   Session management and user lookup class
══════════════════════════════════════════════════════════ */

export default class Auth {
  #sessionKey = 'rf_user';
  #regKey     = 'rf_registered';

  // ── Session ─────────────────────────────────────────────
  getSession() {
    try { return JSON.parse(localStorage.getItem(this.#sessionKey)); }
    catch { return null; }
  }

  setSession(user) {
    localStorage.setItem(this.#sessionKey, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(this.#sessionKey);
  }

  // ── Registered users (localStorage) ─────────────────────
  getRegistered() {
    try { return JSON.parse(localStorage.getItem(this.#regKey)) || []; }
    catch { return []; }
  }

  register(userData) {
    const list = this.getRegistered();
    list.push(userData);
    localStorage.setItem(this.#regKey, JSON.stringify(list));
  }

  // ── User lookup (merges JSON users + registered) ─────────
  async getAllUsers() {
    let base = [];
    try {
      const r = await fetch('/public/json/user.json');
      if (r.ok) base = await r.json();
    } catch (_) {}
    return [...base, ...this.getRegistered()];
  }

  async findUser(email, password) {
    const users = await this.getAllUsers();
    return users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    ) || null;
  }

  async emailExists(email) {
    const users = await this.getAllUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  }
}
