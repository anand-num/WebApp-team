/* ══════════════════════════════════════════════════════════
   theme.js — Dark / Light mode toggle
   • localStorage key: rf_theme ('dark' | 'light')
   • Falls back to system prefers-color-scheme
   • Sets data-theme on <html> immediately to prevent FOUC
   • Creates floating toggle button after DOM ready
══════════════════════════════════════════════════════════ */

(function () {
  var KEY  = 'rf_theme';
  var html = document.documentElement;

  /* ── Apply theme to <html> ── */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
  }

  /* ── Sun SVG (shown in dark mode → click to go light) ── */
  function sunSVG() {
    return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/>' +
      '<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42' +
      'M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  }

  /* ── Moon SVG (shown in light mode → click to go dark) ── */
  function moonSVG() {
    return '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>';
  }

  /* ── Update button icon & aria-label ── */
  function syncBtn(btn) {
    var dark = html.getAttribute('data-theme') === 'dark';
    btn.innerHTML = dark ? sunSVG() : moonSVG();
    btn.setAttribute('aria-label', dark ? 'Гэрэл горим' : 'Харанхуй горим');
    btn.title = dark ? 'Гэрэл горим руу шилжих' : 'Харанхуй горим руу шилжих';
  }

  /* ── Read saved or detect system preference ── */
  var saved  = localStorage.getItem(KEY);
  var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (sysDark ? 'dark' : 'light'));

  /* ── Build toggle button after DOM is ready ── */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.id        = 'themeToggle';
    btn.className = 'theme-toggle';
    syncBtn(btn);
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, next);
      applyTheme(next);
      syncBtn(btn);
    });

    /* ── React to system preference changes (only if user hasn't saved a choice) ── */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!localStorage.getItem(KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
        syncBtn(btn);
      }
    });
  });
})();
