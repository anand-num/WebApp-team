/* ══════════════════════════════════════════════════════════
   MODULE — Cart
   Shared cart storage class that syncs with MongoDB
   Fetches products from user's cart attribute in database
══════════════════════════════════════════════════════════ */

export default class Cart {
  #currentUserId = null;

  constructor() {
    this.apiBaseUrl = 'http://localhost:3000';
  }

  // ── Get current user from localStorage ─────────────────
  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('rf_user');
      if (!userJson) return null;
      const userData = JSON.parse(userJson);
      this.#currentUserId = userData.user_id || userData.id || userData._id;
      return this.#currentUserId;
    } catch (e) {
      console.error('Error getting current user:', e);
      return null;
    }
  }

  // ── Fetch cart items from MongoDB ───────────────────────
  async getItems() {
    const userId = this.getCurrentUser();
    if (!userId) {
      console.warn('No user logged in');
      return [];
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
      const data = await response.json();
      
      // Convert cart items to product format with enriched data
      const cartItems = data.cart || [];
      
      // Fetch product details for each cart item
      const enrichedItems = await Promise.all(
        cartItems.map(async (cartItem) => {
          try {
            const productResponse = await fetch(`${this.apiBaseUrl}/api/products/${cartItem.product_id}`);
            if (productResponse.ok) {
              const product = await productResponse.json();
              return {
                id: cartItem.product_id,
                cart_id: cartItem.cart_id,
                name: product.item_name || product.name,
                brand: product.brand,
                img: product.img_src,
                emoji: product.emoji || '👗',
                size: cartItem.size || 'M',
                basePrice: parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0,
                selectedDays: this.calculateDays(cartItem.starts_at, cartItem.expires_at),
                startDate: cartItem.starts_at,
                endDate: cartItem.expires_at,
                status: cartItem.status,
                addedAt: cartItem.added_at
              };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching product ${cartItem.product_id}:`, err);
            return null;
          }
        })
      );
      
      // Filter out any null items (failed to fetch)
      return enrichedItems.filter(item => item !== null);
      
    } catch (error) {
      console.error('Error fetching cart from MongoDB:', error);
      return [];
    }
  }

  // ── Calculate days between two dates ────────────────────
  calculateDays(startDate, endDate) {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }

  // ── Add product to cart in MongoDB ──────────────────────
  async addProduct(product, startDate, endDate, size) {
    const userId = this.getCurrentUser();
    if (!userId) {
      console.warn('No user logged in');
      return false;
    }

    const cartData = {
      product_id: product.id || product.product_id,
      starts_at: startDate,
      expires_at: endDate,
      size: size || 'M',
      status: 'pending'
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status}`);
      }

      const result = await response.json();
      console.log('Product added to cart in MongoDB:', result);
      return true;
      
    } catch (error) {
      console.error('Error adding product to cart:', error);
      return false;
    }
  }

  // ── Remove item from cart in MongoDB ────────────────────
  async remove(cartId) {
    const userId = this.getCurrentUser();
    if (!userId) {
      console.warn('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart/remove/${cartId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to remove from cart: ${response.status}`);
      }

      console.log('Item removed from cart in MongoDB');
      return true;
      
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return false;
    }
  }

  // ── Remove product by product_id (for backward compatibility) ──
  async removeByProductId(productId) {
    const items = await this.getItems();
    const item = items.find(i => i.id == productId);
    if (item && item.cart_id) {
      return this.remove(item.cart_id);
    }
    return false;
  }

  // ── Clear entire cart in MongoDB ────────────────────────
  async clear() {
    const userId = this.getCurrentUser();
    if (!userId) {
      console.warn('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart/clear`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to clear cart: ${response.status}`);
      }

      console.log('Cart cleared in MongoDB');
      return true;
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  // ── Checkout - move cart items to rented_items ──────────
  async checkout() {
    const userId = this.getCurrentUser();
    if (!userId) {
      console.warn('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart/checkout`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to checkout: ${response.status}`);
      }

      const result = await response.json();
      console.log('Checkout successful:', result);
      return true;
      
    } catch (error) {
      console.error('Error during checkout:', error);
      return false;
    }
  }

  // ── Check if product exists in cart ─────────────────────
  async has(productId) {
    const items = await this.getItems();
    return items.some(i => i.id == productId);
  }

  // ── Get total price of all items in cart ────────────────
  async total() {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + (item.basePrice * item.selectedDays), 0);
  }

  // ── Get cart item count ─────────────────────────────────
  async count() {
    const items = await this.getItems();
    return items.length;
  }

  // ── Update cart item (dates, size) in MongoDB ───────────
  async updateItem(cartId, updates) {
    const userId = this.getCurrentUser();
    if (!userId) {
      console.warn('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart/update/${cartId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update cart item: ${response.status}`);
      }

      console.log('Cart item updated in MongoDB');
      return true;
      
    } catch (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
  }

  // ── Get raw cart data from API (without enrichment) ─────
  async getRawCart() {
    const userId = this.getCurrentUser();
    if (!userId) return [];

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/users/${userId}/cart`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.cart || [];
    } catch (error) {
      console.error('Error fetching raw cart:', error);
      return [];
    }
  }
}