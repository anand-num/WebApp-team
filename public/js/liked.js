/* ══════════════════════════════════════════════════════════
   RENTFIT — liked.js
   Дуртай бараануудыг product.json-с динамикаар харуулна
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

function fmt(n) {
  return Number(n).toLocaleString() + '₮';
}

function renderLiked(products) {
  const grid   = document.querySelector('.wishlist');
  const ids    = getLikedIds();
  const liked  = ids.length
    ? products.filter(function(p) { return ids.includes(p.id); })
    : products.slice(0, 3); // demo fallback — show first 3 if nothing liked

  if (!grid) return;

  if (!liked.length) {
    grid.innerHTML = '<p class="liked-empty">Дуртай бараа байхгүй байна. Каталогоос зүрхний товчийг дарж нэмнэ үү.</p>';
    return;
  }

  grid.innerHTML = liked.map(function(p) {
    return `
    <article class="product-card" style="cursor:pointer" data-id="${p.id}">
      <figure class="card-visual">
        <img src="/public/source/${p.img_src}" alt="${p.item_name}" loading="lazy">
        <button class="card-heart liked" data-id="${p.id}" title="Дуртайгаас хасах">&#10084;</button>
      </figure>
      <div class="card-body">
        <p class="card-brand">${p.brand}</p>
        <h2 class="card-name">${p.item_name}</h2>
        <p class="card-meta">${p.category} · ${p.status}</p>
        <footer class="card-footer">
          <div class="rating">
            <span class="rating-stars">${'★'.repeat(Math.round(p.rating))}</span>
            <span class="rating-count">${p.rating} (${p.review_count})</span>
          </div>
          <div class="card-price-group">
            <strong class="price price--small">${p.price}</strong>
            <a href="/public/html/product.html?id=${p.id}" class="card-link">Харах →</a>
          </div>
        </footer>
      </div>
    </article>`;
  }).join('');

  /* Wire interactions */
  grid.querySelectorAll('.product-card').forEach(function(card) {
    const id = parseInt(card.dataset.id, 10);

    card.addEventListener('click', function(e) {
      if (e.target.closest('button, a')) return;
      location.href = '/public/html/product.html?id=' + id;
    });

    const link = card.querySelector('.card-link');
    if (link) { link.addEventListener('click', function(e) { e.stopPropagation(); }); }

    const heart = card.querySelector('.card-heart');
    if (heart) {
      heart.addEventListener('click', function(e) {
        e.stopPropagation();
        const stillLiked = toggleLike(id);
        if (!stillLiked) {
          card.style.transition = 'opacity 0.3s';
          card.style.opacity = '0';
          setTimeout(function() { renderLiked(products); }, 300);
        }
      });
    }
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
