// liked.js
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('browse-product-grid');
    if (!grid) {
        console.error('browse-product-grid not found');
        return;
    }
    
    function getCurrentUser() {
        try {
            const userJson = localStorage.getItem('rf_user');
            if (!userJson) return null;
            const userData = JSON.parse(userJson);
            return userData.user_id || userData.id || userData._id;
        } catch (e) {
            return null;
        }
    }
    
    async function loadLikedProducts() {
        const userId = getCurrentUser();
        
        if (!userId) {
            console.log('No user logged in');
            // Clear grid if grid has render method
            if (grid.products) grid.products = [];
            if (grid.filteredProducts) grid.filteredProducts = [];
            if (typeof grid.render === 'function') grid.render();
            const countEl = document.getElementById('likedCount');
            if (countEl) countEl.textContent = 'Нэвтрэх шаардлагатай';
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}/liked`);
            if (!response.ok) throw new Error('Failed to fetch liked items');
            const data = await response.json();
            const likedIds = data.liked_items || [];
            
            if (likedIds.length === 0) {
                if (grid.products) grid.products = [];
                if (grid.filteredProducts) grid.filteredProducts = [];
                if (typeof grid.render === 'function') grid.render();
                const countEl = document.getElementById('likedCount');
                if (countEl) countEl.textContent = 'Дуртай бараа байхгүй';
                return;
            }
            
            const productsRes = await fetch('http://localhost:3000/api/products');
            const allProducts = await productsRes.json();
            const likedProducts = allProducts.filter(p => likedIds.includes(String(p.id)));
            
            grid.products = likedProducts;
            grid.filteredProducts = likedProducts;
            if (typeof grid.render === 'function') grid.render();
            
            const countEl = document.getElementById('likedCount');
            if (countEl) {
                countEl.textContent = likedProducts.length === 0 
                    ? 'Дуртай бараа байхгүй' 
                    : `${likedProducts.length} дуртай бараа`;
            }
        } catch (error) {
            console.error('Error loading liked products:', error);
        }
    }
    
    await loadLikedProducts();
    
    window.addEventListener('likedUpdated', () => {
        loadLikedProducts();
    });
});