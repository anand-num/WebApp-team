const catGrid = document.getElementById('catGrid');
const template = document.getElementById('product-template');
const categoryRadios = document.querySelectorAll('input[name="cat"]');
const priceRange = document.querySelector('.price-range');
const priceLabel = document.querySelector('.pr-inputs span');
const resetBtn = document.querySelector('.flt-reset');
const searchInput = document.getElementById('srchInp');
const sortSelect = document.getElementById('sortSel');
const catInfo = document.getElementById('catInfo');

const PAGE_SIZE = 8;
let allProducts = [];
let activeCategory = 'All';
let activeSearch = '';
let activeSort = 'new';
let activeMaxPrice = 500000;
let currentPage = 1;

function parsePrice(priceStr) {
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
}

function getFiltered() {
  let filtered = allProducts;

  if (activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category === activeCategory);
  }

  if (activeSearch) {
    const q = activeSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.item_name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  filtered = filtered.filter(p => parsePrice(p.price) <= activeMaxPrice);

  if (activeSort === 'price-asc') {
    filtered = [...filtered].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (activeSort === 'price-desc') {
    filtered = [...filtered].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  } else if (activeSort === 'rating') {
    filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  }

  return filtered;
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const buttons = document.querySelectorAll('.pgb');

  // prev
  buttons[0].disabled = currentPage === 1;

  // page 1
  buttons[1].textContent = '1';
  buttons[1].classList.toggle('on', currentPage === 1);
  buttons[1].style.display = totalPages >= 1 ? '' : 'none';

  // page 2
  buttons[2].textContent = '2';
  buttons[2].classList.toggle('on', currentPage === 2);
  buttons[2].style.display = totalPages >= 2 ? '' : 'none';

  // next
  buttons[3].disabled = currentPage >= totalPages;
}

function displayProducts() {
  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const page = filtered.slice(start, start + PAGE_SIZE);

  catGrid.innerHTML = '';
  catInfo.textContent = `${filtered.length} бараа олдлоо`;

  page.forEach(product => {
    const card = template.content.cloneNode(true);

    card.querySelector('.card-img').src = `/public/source/${product.img_src}`;
    card.querySelector('.card-img').alt = product.item_name;
    card.querySelector('.badge').textContent = product.status || '';
    card.querySelector('.card-brand').textContent = product.brand;
    card.querySelector('.card-name').textContent = product.item_name;
    card.querySelector('.rating-stars').textContent = '★'.repeat(Math.round(product.rating));
    card.querySelector('.rating-count').textContent = `${product.rating} (${product.review_count})`;
    card.querySelector('.card-price').textContent = product.price;

    card.querySelector('.card-heart').addEventListener('click', function () {
      this.classList.toggle('liked');
    });

    catGrid.appendChild(card);
  });

  renderPagination(filtered.length);
}

fetch('../json/product.json')
  .then(res => res.json())
  .then(data => {
    allProducts = data;
    displayProducts();

    categoryRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        activeCategory = radio.value;
        currentPage = 1;
        displayProducts();
      });
    });

    searchInput.addEventListener('input', () => {
      activeSearch = searchInput.value.trim();
      currentPage = 1;
      displayProducts();
    });

    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      displayProducts();
    });

    priceRange.addEventListener('input', () => {
      activeMaxPrice = parseInt(priceRange.value, 10);
      priceLabel.textContent = `≤ ${activeMaxPrice.toLocaleString()}₮`;
      currentPage = 1;
      displayProducts();
    });

    resetBtn.addEventListener('click', () => {
      activeCategory = 'All';
      activeSearch = '';
      activeSort = 'new';
      activeMaxPrice = 500000;
      currentPage = 1;

      document.querySelector('input[name="cat"][value="All"]').checked = true;
      document.querySelector('input[name="size"]').checked = true;
      priceRange.value = 500000;
      priceLabel.textContent = '≤ 500,000₮';
      searchInput.value = '';
      sortSelect.value = 'new';

      displayProducts();
    });

    document.querySelectorAll('.pgb').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const filtered = getFiltered();
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        if (i === 0 && currentPage > 1) currentPage--;
        else if (i === 1) currentPage = 1;
        else if (i === 2) currentPage = 2;
        else if (i === 3 && currentPage < totalPages) currentPage++;
        displayProducts();
      });
    });
  })
  .catch(err => console.error(err));
