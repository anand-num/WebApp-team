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

//all product
router.get('/all', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const products = db.collection('product');

    
    const result = await products.find({}).toArray();

    res.json(result);

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