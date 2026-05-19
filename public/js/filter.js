

function wireBrowseFilters(gridSelector) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;

    // Category filter - UPDATE URL when changed
    document.querySelectorAll('input[name="cat"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const category = e.target.value;
            
            // Update URL
            updateUrlParameter('cat', category === 'All' ? null : category);
            
            // Filter grid
            grid.filterByCategory(category);
            updateProductCount(grid.getCount());
        });
    });

    // Size filter
    document.querySelectorAll('input[name="size"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const size = e.target.value;
            updateUrlParameter('size', size === 'All' ? null : size);
            grid.filterBySize(size);
            updateProductCount(grid.getCount());
        });
    });

    // Price filter
    const priceRange = document.querySelector('.price-range');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            const price = parseInt(e.target.value, 10);
            updateUrlParameter('price', price);
            grid.filterByPrice(price);
            updateProductCount(grid.getCount());
        });
    }

    // Search
    const searchInput = document.getElementById('srchInp');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const search = e.target.value.trim();
                updateUrlParameter('search', search || null);
                grid.search(search);
                updateProductCount(grid.getCount());
            }, 300);
        });
    }

    // Sort
    const sortSelect = document.getElementById('sortSel');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            updateUrlParameter('sort', e.target.value);
            grid.sort(e.target.value);
        });
    }

    // Reset filters
    const resetBtn = document.querySelector('.flt-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Clear all URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('cat');
            url.searchParams.delete('size');
            url.searchParams.delete('price');
            url.searchParams.delete('search');
            url.searchParams.delete('sort');
            window.history.pushState({}, '', url);
            
            // Reset grid
            grid.filteredProducts = grid.products;
            grid.render();
            updateProductCount(grid.getCount());
            
            // Reset all inputs
            document.querySelector('input[name="cat"][value="All"]').checked = true;
            document.querySelector('input[name="size"][value="All"]').checked = true;
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'new';
            if (priceRange) priceRange.value = 500000;
        });
    }

    // READ URL parameters on page load
    readFiltersFromUrl(grid);
}

// Helper: Update URL parameter without page reload
function updateUrlParameter(key, value) {
    const url = new URL(window.location.href);
    
    if (value === null || value === undefined || value === '') {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }
    
    window.history.pushState({}, '', url);
}

// Helper: Read filters from URL and apply them
function readFiltersFromUrl(grid) {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Read category
    const category = urlParams.get('cat');
    if (category && category !== 'All') {
        // Update radio button
        const radio = document.querySelector(`input[name="cat"][value="${category}"]`);
        if (radio) {
            radio.checked = true;
            grid.filterByCategory(category);
        }
    }
    
    // Read size
    const size = urlParams.get('size');
    if (size && size !== 'All') {
        const radio = document.querySelector(`input[name="size"][value="${size}"]`);
        if (radio) {
            radio.checked = true;
            grid.filterBySize(size);
        }
    }
    
    // Read price
    const price = urlParams.get('price');
    if (price) {
        const priceRange = document.querySelector('.price-range');
        if (priceRange) {
            priceRange.value = price;
            grid.filterByPrice(parseInt(price, 10));
        }
    }
    
    // Read search
    const search = urlParams.get('search');
    if (search) {
        const searchInput = document.getElementById('srchInp');
        if (searchInput) {
            searchInput.value = search;
            grid.search(search);
        }
    }
    
    // Read sort
    const sort = urlParams.get('sort');
    if (sort) {
        const sortSelect = document.getElementById('sortSel');
        if (sortSelect) {
            sortSelect.value = sort;
            grid.sort(sort);
        }
    }
    
    updateProductCount(grid.getCount());
}

function updateProductCount(count) {
    const countEl = document.getElementById('catInfo');
    if (countEl) {
        countEl.textContent = `${count} бараа олдлоо`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Browse components loaded');
    
    const grid = document.querySelector('browse-product-grid');
    if (grid) {
        // Wait for grid to load products
        const checkGrid = setInterval(() => {
            if (grid.products && grid.products.length > 0) {
                clearInterval(checkGrid);
                wireBrowseFilters('browse-product-grid');
            }
        }, 100);
    }
});