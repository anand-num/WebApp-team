export class navigation extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.highlightActiveFromUrl();
    this.setupSearch();
  }

  highlightActiveFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentCategory = urlParams.get('cat');
    

    const categoryLinks = this.querySelectorAll('.sub-nav a');
    categoryLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (currentCategory && href.includes(`cat=${currentCategory}`)) {
        link.classList.add('active-category');
      } else if (!currentCategory && href === '/public/html/browse.html') {
        link.classList.add('active-category');
      } else {
        link.classList.remove('active-category');
      }
    });
  }

  attachEventListeners() {
    const categoryLinks = this.querySelectorAll('.sub-nav a');

    categoryLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const href = link.getAttribute('href');
        const urlParams = new URLSearchParams(href.split('?')[1]);
        let category = urlParams.get('cat');

        if (link.textContent.trim() === 'Шинэ') {
          category = 'All';
        }

        if (window.filterManager) {
          window.filterManager.setCategory(category);
        }

        const url = new URL(window.location.href);
        if (category && category !== 'All') {
          url.searchParams.set('cat', category);
        } else {
          url.searchParams.delete('cat');
        }
        window.history.pushState({}, '', url);

        this.highlightActiveCategory(category);
      });
    });
  }

  setupSearch() {
    const searchInput = this.querySelector('.search-bar input');
    const searchIcon  = this.querySelector('.search-icon');

    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim();
          if (!query) return;
          window.location.href = `/public/html/browse.html?search=${encodeURIComponent(query)}`;
        }
      });
    }

    if (searchIcon) {
      searchIcon.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (!query) return;
        window.location.href = `/public/html/browse.html?search=${encodeURIComponent(query)}`;
      });
    }
  }

  render() {
    this.innerHTML = `
      <header class="nav-header">
        <div class="top-nav">
          <div class="top-left-nav">
            <p style="color: var(--gray);font-size: 0.7rem; font-weight: 550;">Монголын №1 Хувцас Түрээс</p>
          </div>
          <div class="top-right-nav">
            <a href="">MN</a>
            <div class="line-vertical"></div>
            <a href="../html/admin.html">admin</a>
          </div>
        </div>
        <div class="mid-nav">
          <div class="left-nav">
            <a href="../html/index.html" class="logo">
              <p>Rent<span class="highlight">Fit</span></p>
            </a>
          </div>
          <div class="right-nav">
            <div class="search-bar">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" style="cursor:pointer;">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input type="text" placeholder="хайх.." />
            </div>

            <a href="../html/cart.html" class="cart-icon" data-cart-toggle>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span id="cartBadge" class="cart-badge"></span>
            </a>

            <a href="../html/liked.html" class="like-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M12 21C12 21 3 14 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14 12 21 12 21z" />
              </svg>
            </a>

            <button id="loginBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>
          </div>
        </div>
        <div class="sub-nav">
          <a href="/public/html/browse.html">Бүгд</a>
          <a href="/public/html/browse.html?cat=Evening+Wear">Гоёлын</a>
          <a href="/public/html/browse.html?cat=Dance">Бүжиг</a>
          <a href="/public/html/browse.html?cat=Costume">Бизнес</a>
          <a href="/public/html/browse.html?cat=Cultural">Монгол үндэсний</a>
        </div>
      </header>

      <div class="mobile-top-nav">
        <a href="../html/index.html" class="logo">
          <p>Rent<span class="highlight">Fit</span></p>
        </a>
        <div class="mobile-right-top-nav">
          <a href="../html/cart.html" class="cart-icon" data-cart-toggle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span id="cartBadge" class="cart-badge"></span>
          </a>

          <a href="../html/my-rentals.html" class="cart-icon" data-cart-toggle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none"
              stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <line x1="9" y1="2" x2="15" y2="2" />
              <path d="M6 11a6 6 0 0 1 12 0c0 4.5 2 7 2 7H4s2-2.5 2-7Z" />
              <path d="M9 18a3 3 0 0 0 6 0" />
            </svg>
            <span id="notif-Badge" class="notif-badge"></span>
          </a>
        </div>
      </div>

      <nav class="mobile-bottom-nav">
        <a href="/public/html/index.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </a>
        <a href="/public/html/browse.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </a>
        <a href="/public/html/my-rentals.html?action=add">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none"
            stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </a>
        <a href="/public/html/liked.html" class="active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M12 21C12 21 3 14 3 8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 2.5C21 14 12 21 12 21z" />
          </svg>
        </a>
        <button id="mobileLoginBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            stroke-linejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
      </nav>
    `;
  }
}

customElements.define('app-navigation', navigation);