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

module.exports = router;