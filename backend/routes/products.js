const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// GET /api/products — status нь rejected эсвэл pending биш бүтээгдэхүүн
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const products = db.collection('product');

    const result = await products.find({
      status: { $nin: ['Rejected', 'Pending'] }
    }).toArray();

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/all — бүх бараа + хэрэглэгчдийн publish_requests (admin-д)
// БҮГДИЙГ НЭГ array-д нийлүүлж, Product классад тохирох форматад оруулж буцаана
router.get('/all', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');

    // Бүх бараа авах
    const products = await db.collection('product').find({}).toArray();

    // Хэрэглэгчдийн publish_requests авах
    const users = await db.collection('users').find(
      { publish_requests: { $exists: true, $ne: [] } },
      { projection: { username: 1, publish_requests: 1 } }
    ).toArray();

    // publish_requests-г Product классад тохирох форматад хувиргах
    const requestItems = [];
    users.forEach(user => {
      if (user.publish_requests && user.publish_requests.length > 0) {
        user.publish_requests.forEach((req, idx) => {
          requestItems.push({
            id: req.request_id || ('req_' + Date.now() + '_' + idx),
            request_id: req.request_id || ('req_' + Date.now() + '_' + idx),
            brand: req.brand || '',
            publisher: user.username || '',
            item_name: req.name || '',
            rating: 0,
            review_count: 0,
            price: req.price || '',
            price_period: 'өдрөөс',
            status: req.status || 'pending',
            category: req.category || 'Other',
            description: req.description || '',
            img_src: req.img || '',
            sizes: req.size ? req.size.split('/') : ['S', 'M', 'L'],
            in_stock: 1,
            date_posted: req.createdAt ? req.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            type: 'publish_request'
          });
        });
      }
    });

    // Бүгдийг НЭГ array-д нийлүүлэх
    const allItems = [...products, ...requestItems];

    res.json(allItems);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id/status — статус өөрчлөх
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await client.connect();
    const db = client.db('webapp-team');
    await db.collection('product').updateOne(
      { id: parseInt(req.params.id) },
      { $set: { status } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id — бараа засах
router.put('/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    await db.collection('product').updateOne(
      { id: parseInt(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE /api/products/:id — бараа устгах + user-ийн published_items-с хасах
router.delete('/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');

    const productId = parseInt(req.params.id);

    // 1. Product-г олох — хэний бараа болохыг мэдэхийн тулд
    const product = await db.collection('product').findOne({ id: productId });

    // 2. Product устгах
    await db.collection('product').deleteOne({ id: productId });

    // 3. Хэрэв product байсан бол publisher-ийн published_items-с хасах
    if (product) {
      await db.collection('users').updateOne(
        { username: product.publisher },
        { $pull: { published_items: { product_id: productId } } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products — шинэ бараа нэмэх
router.post('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('product');

    const last = await collection.find().sort({ id: -1 }).limit(1).toArray();
    const newId = last.length ? last[0].id + 1 : 1;

    const newProduct = {
      ...req.body,
      id: newId,
      status: 'pending',
      date_posted: new Date().toISOString().split('T')[0]
    };
    await collection.insertOne(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('product');

    let product = null;

    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      product = await collection.findOne({ id: numericId });
    }

    if (!product) {
      product = await collection.findOne({ id: id });
    }

    if (!product) {
      product = await collection.findOne({ product_id: id });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;