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

    // status нь "rejected" эсвэл "pending" биш өгөгдлийг авах
    const result = await products.find({
      status: { $nin: ['Rejected', 'Pending'] }
      //       ↑ $nin = "not in" гэсэн утга
    }).toArray();

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/all — бүх статустай бараа (admin-д)
router.get('/all', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const result = await db.collection('product').find({}).toArray();
    res.json(result);
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

// DELETE /api/products/:id — бараа устгах
router.delete('/:id', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    await db.collection('product').deleteOne(
      { id: parseInt(req.params.id) }
    );
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

    // Хамгийн их id олж +1 нэмэх
    const last = await collection.find().sort({ id: -1 }).limit(1).toArray();
    const newId = last.length ? last[0].id + 1 : 1;

    const newProduct = { ...req.body, id: newId, status: 'pending' };
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
    
    // Try to find by numeric id or string id
    let product = null;
    
    // Try as number first
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      product = await collection.findOne({ id: numericId });
    }
    
    // If not found, try as string
    if (!product) {
      product = await collection.findOne({ id: id });
    }
    
    // If still not found, try product_id field
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