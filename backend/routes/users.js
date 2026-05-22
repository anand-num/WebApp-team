const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// ========== AUTH ROUTES (no userId parameter) ==========
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');
    const result = await collection.find({}, { projection: { password: 0 } }).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');
    
    const user = await collection.findOne({
      $or: [{ email: email }, { username: email }],
      password: password
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');
    
    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Энэ имэйл аль хэдийн бүртгэлтэй байна' });
    }
    
    const newUser = { email, username, password, createdAt: new Date() };
    await collection.insertOne(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');
    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    res.json({ exists: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CART ROUTES (SPECIFIC - MUST COME BEFORE /:userId) ==========
router.post('/:userId/cart/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id, starts_at, expires_at, status = 'pending' } = req.body;
    
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const cartItem = {
      cart_id: new ObjectId().toString(),  // ← Now works because ObjectId is imported
      product_id: product_id,
      starts_at: starts_at,
      expires_at: expires_at,
      status: status,
      added_at: new Date().toISOString()
    };
    
    await usersCollection.updateOne(
      { user_id: userId },
      { $push: { cart: cartItem } }
    );
    
    const updatedUser = await usersCollection.findOne(
      { user_id: userId },
      { projection: { cart: 1 } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      cart: updatedUser.cart || [],
      cartCount: (updatedUser.cart || []).length
    });
    
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    
    res.json({
      user_id: userId,
      username: user.username,
      cart: user.cart || [],
      cartCount: (user.cart || []).length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:userId/cart/remove/:cartId', async (req, res) => {
  try {
    const { userId, cartId } = req.params;
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { user_id: userId },
      { $pull: { cart: { cart_id: cartId } } }
    );
    
    res.json({ message: 'Item removed from cart' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/cart/checkout', async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    const rentalItems = user.cart.map(item => ({
      rental_id: new ObjectId().toString(),
      product_id: item.product_id,
      starts_at: item.starts_at,
      expires_at: item.expires_at,
      status: 'paid',
      rented_at: new Date().toISOString()
    }));
    
    await usersCollection.updateOne(
      { user_id: userId },
      {
        $push: { rented_items: { $each: rentalItems } },
        $set: { cart: [] }
      }
    );
    
    res.json({ message: `Successfully checked out ${rentalItems.length} items` });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RENTED ITEMS ROUTES ==========
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

router.patch('/:userId/rented-items/:rentalId/return', async (req, res) => {
  try {
    const { userId, rentalId } = req.params;
    await client.connect();
    const db = client.db('webapp-team');
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { 
        user_id: userId,
        "rented_items.rental_id": rentalId
      },
      { 
        $set: { 
          "rented_items.$.status": "returned",
          "rented_items.$.returned_at": new Date().toISOString()
        } 
      }
    );
    
    res.json({ message: 'Item returned successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GENERAL USER ROUTE - MUST BE LAST! ==========
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');
    
    const user = await collection.findOne(
      { user_id: userId },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;