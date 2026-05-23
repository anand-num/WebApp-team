const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;
let usersCollection;
let productsCollection;

// ── Connect once when server starts ──
async function connectToDb() {
  if (!db) {
    await client.connect();
    db = client.db('webapp-team');
    usersCollection = db.collection('users');
    productsCollection = db.collection('product');
    console.log('✅ MongoDB connected successfully');
  }
  return { db, usersCollection, productsCollection };
}

// Call this at server startup (in server.js)
// For now, we'll connect on first request
// ========== AUTH ROUTES ==========
router.get('/', async (req, res) => {
  try {
    const { usersCollection } = await connectToDb();
    const result = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { usersCollection } = await connectToDb();

    const user = await usersCollection.findOne({
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
    const { email, username, password, full_name, phone } = req.body;
    const { usersCollection } = await connectToDb();

    const existing = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ error: 'Энэ имэйл аль хэдийн бүртгэлтэй байна' });
    }

    // Generate new user_id
    const lastUser = await usersCollection.find().sort({ user_id: -1 }).limit(1).toArray();
    let newUserId = 'u001';
    if (lastUser.length > 0) {
      const lastId = parseInt(lastUser[0].user_id.substring(1));
      newUserId = `u${String(lastId + 1).padStart(3, '0')}`;
    }

    const newUser = { 
      user_id: newUserId,
      email, 
      username, 
      full_name: full_name || username,
      phone: phone || '',
      password, 
      membership: 'standard',
      published_items: [],
      rented_items: [],
      cart: [],
      liked_items: [],
      createdAt: new Date() 
    };

    await usersCollection.insertOne(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    const { usersCollection } = await connectToDb();
    const existing = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
    res.json({ exists: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CART ROUTES ==========
router.post('/:userId/cart/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id, starts_at, expires_at, size, status = 'pending' } = req.body;
    const { usersCollection } = await connectToDb();

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const productIdStr = String(product_id);
    const cartItem = {
      cart_id: new ObjectId().toString(),
      product_id: productIdStr,
      starts_at: starts_at,
      expires_at: expires_at,
      size: size || 'M',
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
    const { usersCollection } = await connectToDb();

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
    const { usersCollection } = await connectToDb();

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
    const { usersCollection } = await connectToDb();

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
      size: item.size || 'M',
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

// ========== LIKED ITEMS ROUTES ==========
router.get('/:userId/liked', async (req, res) => {
  try {
    const { userId } = req.params;
    const { usersCollection } = await connectToDb();

    const user = await usersCollection.findOne(
      { user_id: userId },
      { projection: { liked_items: 1, username: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: userId,
      username: user.username,
      liked_items: user.liked_items || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/liked/toggle', async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id } = req.body;
    const { usersCollection } = await connectToDb();

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const likedItems = user.liked_items || [];
    const index = likedItems.indexOf(product_id);

    let action;
    if (index === -1) {
      await usersCollection.updateOne(
        { user_id: userId },
        { $push: { liked_items: product_id } }
      );
      action = 'added';
    } else {
      await usersCollection.updateOne(
        { user_id: userId },
        { $pull: { liked_items: product_id } }
      );
      action = 'removed';
    }

    res.json({
      success: true,
      action: action,
      liked: action === 'added'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RENTED ITEMS ROUTES ==========
router.get('/:userId/rented-items', async (req, res) => {
  try {
    const { userId } = req.params;
    const { usersCollection } = await connectToDb();

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
    const { usersCollection } = await connectToDb();

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

// ========== NOTIFICATIONS ROUTES ==========
router.get('/:userId/notifications', async (req, res) => {
  try {
    const { usersCollection } = await connectToDb();
    const user = await usersCollection.findOne(
      { user_id: req.params.userId },
      { projection: { notifications: 1 } }
    );
    res.json(user?.notifications || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:userId/notifications/read', async (req, res) => {
  try {
    const { usersCollection } = await connectToDb();
    await usersCollection.updateOne(
      { user_id: req.params.userId },
      { $set: { 'notifications.$[].read': true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RENTALS WITH PRODUCT DETAILS ==========
router.get('/:userId/rentals', async (req, res) => {
  try {
    const { usersCollection, productsCollection } = await connectToDb();
    const user = await usersCollection.findOne(
      { user_id: req.params.userId },
      { projection: { rented_items: 1 } }
    );

    const items = user?.rented_items || [];

    const productIds = items.map(i => i.product_id).filter(id => id != null);
    const products = await productsCollection.find({
      id: { $in: productIds }
    }).toArray();

    const result = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        ...item,
        name: product?.item_name || item.name || 'Unknown',
        brand: product?.brand || item.brand || '',
        img: product?.img_src || item.img || '',
        price: product?.price || item.price || 0
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== LISTINGS (PUBLISHED ITEMS) ==========
router.get('/:userId/listings', async (req, res) => {
  try {
    const { usersCollection, productsCollection } = await connectToDb();
    const user = await usersCollection.findOne(
      { user_id: req.params.userId },
      { projection: { published_items: 1 } }
    );

    const items = user?.published_items || [];
    const productIds = items;

    const products = await productsCollection.find({
      id: { $in: productIds }
    }).toArray();

    const result = products.map(product => ({
      ...product,
      status: product.status || 'active'
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GENERAL USER ROUTE - MUST BE LAST! ==========
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { usersCollection } = await connectToDb();

    const user = await usersCollection.findOne(
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