document.addEventListener('click', e => {
    const heart = e.target.closest('.card-heart');
    if (heart) heart.classList.toggle('active');
});

fetch('../json/product.json')
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('catGrid');
        const template = document.getElementById('product-template');

        data.forEach(product => {
            const clone = template.content.cloneNode(true);

            clone.querySelector('.card-img').src = product.img_src;
            clone.querySelector('.card-img').alt = product.item_name;

            clone.querySelector('.card-brand').textContent = product.brand;
            clone.querySelector('.card-name').textContent = product.item_name;

            clone.querySelector('.badge').textContent = product.status;

            clone.querySelector('.rating-stars').textContent =
                '★'.repeat(Math.round(product.rating));
            clone.querySelector('.rating-count').textContent =
                `${product.rating} (${product.review_count})`;

            clone.querySelector('.card-price').textContent = product.price;

            clone.querySelector('.card-heart').addEventListener('click', function () {
                this.classList.toggle('liked');
            });

            container.appendChild(clone);
        });
    })
    .catch(err => console.error(err));

const catGrid = document.getElementById('catGrid');
const template = document.getElementById('product-template');
const categoryRadios = document.querySelectorAll('input[name="cat"]');

fetch('../json/product.json')
  .then(res => res.json())
  .then(data => {

    function displayProducts(products) {
      catGrid.innerHTML = ''; // clear existing cards

      products.forEach(product => {
        // Clone template content
        const card = template.content.cloneNode(true);

        // Fill in product info
        card.querySelector('.card-img').src = product.img_src;
        card.querySelector('.card-img').alt = product.item_name;
        card.querySelector('.badge').textContent = product.status || '';
        card.querySelector('.card-brand').textContent = product.brand;
        card.querySelector('.card-name').textContent = product.item_name;
        card.querySelector('.rating-stars').textContent = '★'.repeat(Math.round(product.rating));
        card.querySelector('.rating-count').textContent = `${product.rating} (${product.review_count})`;
        card.querySelector('.card-price').textContent = product.price;

        // Append card to grid
        catGrid.appendChild(card);
      });
    }

    // Display all products initially
    displayProducts(data);

    // Listen for category changes
    categoryRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const selected = radio.value;
        const filtered = selected === 'All' 
          ? data 
          : data.filter(p => p.category === selected);
        displayProducts(filtered);
      });
    });

  })
  .catch(err => console.error(err));