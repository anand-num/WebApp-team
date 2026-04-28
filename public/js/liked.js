/* ══════════════════════════════════════════════════════════
   RENTFIT — liked.js
   Дуртай бараануудыг product.json-с динамикаар харуулна.
   Картын HTML бүтэц browse.js-тэй яг адилхан байна.
══════════════════════════════════════════════════════════ */

const LIKED_KEY = 'rf_liked';

function getLikedIds() {
  try { return JSON.parse(localStorage.getItem(LIKED_KEY)) || []; }
  catch (_) { return []; }
}

function toggleLike(id) {
  const ids = getLikedIds();
  const idx = ids.indexOf(id);
  if (idx === -1) { ids.push(id); } else { ids.splice(idx, 1); }
  localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
  return idx === -1;
}

function renderCard(product, products) {
  const article = document.createElement('article');
  article.className = 'product-card';
  article.style.cursor = 'pointer';
  article.dataset.id = product.id;

  article.innerHTML = `
    <div class="card-visual">
      <img class="card-img" src="/public/source/${product.img_src}" alt="${product.item_name}" loading="lazy">
      <span class="badge badge--new">${product.status || ''}</span>
      <button class="card-heart liked" data-id="${product.id}" aria-label="Дуртайгаас хасах">&#10084;</button>
      <button class="card-request-btn" data-id="${product.id}">📩 Хүсэлт илгээх</button>
    </div>
    <div class="card-body">
      <p class="card-brand">${product.brand}</p>
      <h3 class="card-name">${product.item_name}</h3>
      <div class="rating">
        <span class="rating-stars">${'★'.repeat(Math.round(product.rating))}</span>
        <span class="rating-count">${product.rating} (${product.review_count})</span>
      </div>
      <div class="card-footer">
        <div>
          <p class="price-lbl">Өдөрт</p>
          <strong class="card-price">${product.price}</strong>
        </div>
        <a class="card-link" href="/public/html/product.html?id=${product.id}">Харах →</a>
      </div>
    </div>`;

  /* Navigate to product page on card click */
  article.addEventListener('click', function(e) {
    if (e.target.closest('button, a')) return;
    location.href = '/public/html/product.html?id=' + product.id;
  });

  /* Prevent link from also triggering card click */
  const link = article.querySelector('.card-link');
  if (link) link.addEventListener('click', function(e) { e.stopPropagation(); });

  /* Heart — unlike and fade out */
  const heart = article.querySelector('.card-heart');
  heart.addEventListener('click', function(e) {
    e.stopPropagation();
    const stillLiked = toggleLike(product.id);
    this.classList.toggle('liked', stillLiked);
    if (!stillLiked) {
      article.style.transition = 'opacity 0.3s';
      article.style.opacity = '0';
      setTimeout(function() { renderLiked(products); }, 300);
    }
  });

  /* Request modal */
  const reqBtn = article.querySelector('.card-request-btn');
  reqBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (typeof window.openRequestModal === 'function') {
      window.openRequestModal(product);
    }
  });

  return article;
}

function renderLiked(products) {
  const grid  = document.querySelector('.wishlist');
  const ids   = getLikedIds();
  const liked = ids.length
    ? products.filter(function(p) { return ids.includes(p.id); })
    : products.slice(0, 3); // demo fallback — first 3 if nothing liked

  if (!grid) return;

  if (!liked.length) {
    grid.innerHTML = '<p class="liked-empty">Дуртай бараа байхгүй байна. Каталогоос зүрхний товчийг дарж нэмнэ үү.</p>';
    return;
  }

  grid.innerHTML = '';
  liked.forEach(function(p) {
    grid.appendChild(renderCard(p, products));
  });
}

async function init() {
  try {
    const r = await fetch('/public/json/product.json');
    const products = await r.json();
    renderLiked(products);
  } catch (_) {}
}

init();
