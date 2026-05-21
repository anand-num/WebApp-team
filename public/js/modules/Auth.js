export default class Auth {
  #sessionKey = 'rf_user';


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

  // ── Login ────────────────────────────────────────────
  async findUser(email, password) {
    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // ── Register ─────────────────────────────────────────
  async register(userData) {
    try {
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // ── Email шалгах ─────────────────────────────────────
  async emailExists(email) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/users/check-email?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  }
}