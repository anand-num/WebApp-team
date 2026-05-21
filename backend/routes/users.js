const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// GET /api/users — бүх хэрэглэгч
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    // Password-г буцааж болохгүй — projection ашиглан хасах
    const result = await collection.find(
      {},
      { projection: { password: 0 } }  // ← password харагдахгүй
    ).toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/login — нэвтрэх
// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, password }); // debug

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    // Email эсвэл username-р хайх
    const user = await collection.findOne({
      $or: [
        { email:    email    },
        { username: email    }  // email field-д username ч орж болно
      ],
      password: password
    });

    console.log('Found user:', user); // debug

    if (!user) {
      return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна' });
    }

    // Password хасаад буцаах
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/register — бүртгүүлэх
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    // Email аль хэдийн байгаа эсэхийг шалгах
    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ error: 'Энэ имэйл аль хэдийн бүртгэлтэй байна' });
    }

    // Шинэ хэрэглэгч нэмэх
    const newUser = { email, username, password, createdAt: new Date() };
    await collection.insertOne(newUser);

    // Password хасаад буцаах
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/users/check-email?email=... — email байгаа эсэх шалгах
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    res.json({ exists: !!existing });  // true эсвэл false
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



/* ═══════════════════════════════════════════════════════
   CART OPERATIONS (Түр сагс)
═══════════════════════════════════════════════════════ */

// POST /api/users/:userId/cart/add - Add item to cart
router.post('/:userId/cart/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      productId, 
      startDate, 
      endDate, 
      days, 
      size, 
      totalPrice, 
      dailyRate 
    } = req.body;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    // Check if user exists
    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create cart item object
    const cartItem = {
      cartId: new ObjectId().toString(),
      productId: productId,
      size: size,
      startDate: startDate,
      endDate: endDate,
      days: days,
      dailyRate: dailyRate,
      totalPrice: totalPrice,
      addedAt: new Date().toISOString()
    };
    
    // Add to cart array
    const result = await usersCollection.updateOne(
      { user_id: userId },
      { $push: { cart: cartItem } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated cart
    const updatedUser = await usersCollection.findOne(
      { user_id: userId },
      { projection: { cart: 1, password: 0 } }
    );
    
    res.status(201).json({
      message: 'Item added to cart',
      cart: updatedUser.cart,
      cartCount: updatedUser.cart.length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/cart - View cart
router.get('/:userId/cart', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne(
      { user_id: userId },
      { projection: { cart: 1, username: 1 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate cart total
    const cartTotal = (user.cart || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    res.json({
      user_id: userId,
      username: user.username,
      cart: user.cart || [],
      cartCount: (user.cart || []).length,
      cartTotal: cartTotal
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:userId/cart/remove/:cartId - Remove from cart
router.delete('/:userId/cart/remove/:cartId', async (req, res) => {
  try {
    const { userId, cartId } = req.params;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    // Remove from cart using $pull
    const result = await usersCollection.updateOne(
      { user_id: userId },
      { $pull: { cart: { cartId: cartId } } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Item removed from cart', cartId: cartId });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:userId/cart/checkout - Move cart items to rented_items
router.post('/:userId/cart/checkout', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    // Get current user
    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Convert cart items to rented_items format
    const rentalItems = user.cart.map(item => ({
      rentalId: new ObjectId().toString(),
      productId: item.productId,
      size: item.size,
      startDate: item.startDate,
      endDate: item.endDate,
      days: item.days,
      dailyRate: item.dailyRate,
      totalPrice: item.totalPrice,
      status: 'pending',  // pending, approved, rented, returned
      rentedAt: new Date().toISOString()
    }));
    
    // Add to rented_items and clear cart (atomic operation)
    const result = await usersCollection.updateOne(
      { user_id: userId },
      {
        $push: { rented_items: { $each: rentalItems } },
        $set: { cart: [] }  // Clear cart
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { user_id: userId },
      { projection: { rented_items: 1, cart: 1, password: 0 } }
    );
    
    res.json({
      message: `Successfully rented ${rentalItems.length} items`,
      rented_items: updatedUser.rented_items,
      cart: updatedUser.cart
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:userId/cart/clear - Clear entire cart
router.delete('/:userId/cart/clear', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { user_id: userId },
      { $set: { cart: [] } }
    );
    
    res.json({ message: 'Cart cleared successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ═══════════════════════════════════════════════════════
   RENTED ITEMS OPERATIONS (Түрээсэлсэн зүйлс)
═══════════════════════════════════════════════════════ */

// GET /api/users/:userId/rented-items - Get all rented items
router.get('/:userId/rented-items', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne(
      { user_id: userId },
      { projection: { rented_items: 1, username: 1 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user_id: userId,
      username: user.username,
      rented_items: user.rented_items || [],
      total_rented: (user.rented_items || []).length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:userId/rented-items/:rentalId/return - Return a rented item
router.patch('/:userId/rented-items/:rentalId/return', async (req, res) => {
  try {
    const { userId, rentalId } = req.params;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { 
        user_id: userId,
        "rented_items.rentalId": rentalId
      },
      { 
        $set: { 
          "rented_items.$.status": "returned",
          "rented_items.$.returnedAt": new Date().toISOString()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    res.json({ message: 'Item returned successfully', rentalId: rentalId });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;


