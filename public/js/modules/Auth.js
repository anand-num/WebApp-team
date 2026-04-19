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
    catch { console.error('Failed to parse session data'); return null;  }
  }
  // localStorage.getItem(this.#sessionKey) -- web deer bairlah storagoos sessionKey buyu 
  // buyu rf_user-gi utgaig avna. 
  // JSON.parse() -- avsan stringiig JSON object bolgono.
  // try- todorhoigui orolltoi ued ashiglana
  // catch cannot exist without try 
  // finally also cannot exist without try 
  // return null -- hen ch log in hiiggu gsen ug

  setSession(user) {
    localStorage.setItem(this.#sessionKey, JSON.stringify(user));
    //JSON.stringify(user)-- localstorage string l hadgalj chadddag uchraas javascriot ogogdliig string bolgono
    // Example: { name: "John" } → '{"name":"John"}'
  }

  clearSession() {
    localStorage.removeItem(this.#sessionKey);
  }

  // ── Registered users (localStorage) ─────────────────────
  getRegistered() {
    try { return JSON.parse(localStorage.getItem(this.#regKey)) || []; }
    catch { console.error('Failed to parse registered users'); return [];  }
  }
  // ||[] -- herev json.parse() null utga butsaaval orond hooson massiv butsaana

  register(userData) {
    const list = this.getRegistered();
    list.push(userData);
    localStorage.setItem(this.#regKey, JSON.stringify(list));
  }
  // herev getRegistered() null buyu register hiiggu bol listed buyu [] dotor hereglechiin utgiig ogno
  // localStorage.setItem(this.#regKey, JSON.stringify(list))--getRegistered() javascript ogogdol bolgosnoo butsaagd string bolgoj localstoraged hadgalna


  // ── User lookup (merges JSON users + registered) ─────────
  async getAllUsers() {
    let base = [];
    try {
      const r = await fetch('/public/json/user.json');
      if (r.ok) base = await r.json();
    } catch (_) {}
    return [...base, ...this.getRegistered()];
  }
  // async-- ene uildel udaj magadgui uchir huleelgui busad uildliig hiih
  //await-- asynctai hamt zaaval ashiglagddag ba ene uildel duusahiig huleene gsen ug
  // r.jsom-- irsen jsoniig javascript ogogdol bolgono
  // catch(_){}-- erroriig toohgui buyu baese ni [] hvre uldene
  // return [...base, ...this.getRegistered()] -- base bolon localStorage-d bga useruudiig negtgeh operator

  async findUser(email, password) {
    const users = await this.getAllUsers();
    return users.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    ) || null;
  }
  // users.find(u => -- getAllUsers buyu user.json oos avsan buh usereer guilgeh uildel
  // u.email.toLowerCase() === email.toLowerCase() -- herev useriin email ogson emailtei tentsuu bol true butsaana
  // u.password === password -- herev useriin password ogson passwordtei tentsuu bol true butsaana
  // || null -- herev find() null buyu user oldohgui bol orond null butsaana

  async emailExists(email) {
    const users = await this.getAllUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  }
}
