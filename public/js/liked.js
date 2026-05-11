// liked.js
import { isLiked } from '../wc/product-card.js';

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('browse-product-grid');
    if (!grid) return;
    
    // Function to load and display liked products
    async function loadLikedProducts() {
        // Get liked IDs from localStorage
        const likedIds = JSON.parse(localStorage.getItem('rf_liked') || '[]');
        
        // If no liked products, show empty grid immediately
        if (likedIds.length === 0) {
            grid.products = [];
            grid.filteredProducts = [];
            grid.render();
            
            const countEl = document.getElementById('likedCount');
            if (countEl) {
                countEl.textContent = 'Дуртай бараа байхгүй';
            }
            return;
        }
        
        // Fetch all products and filter by liked IDs
        const response = await fetch('/public/json/product.json');
        const allProducts = await response.json();
        const likedProducts = allProducts.filter(p => likedIds.includes(String(p.id)));
        
        // Override grid's products
        grid.products = likedProducts;
        grid.filteredProducts = likedProducts;
        grid.render();
        
        // Update count
        const countEl = document.getElementById('likedCount');
        if (countEl) {
            countEl.textContent = likedProducts.length === 0 
                ? 'Дуртай бараа байхгүй' 
                : `${likedProducts.length} дуртай бараа`;
        }
    }
    
    // Initial load
    await loadLikedProducts();
    
    // Listen for liked status changes from product cards
    window.addEventListener('likedUpdated', () => {
        loadLikedProducts();
    });
    
    // Also listen for storage changes (if liked from another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'rf_liked') {
            loadLikedProducts();
        }
    });
});