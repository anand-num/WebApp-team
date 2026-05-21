const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// GET /api/reviews — бүх review (product page + review-list)
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('review');

    const result = await collection.find({}).toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/home — home page-д rating 4+, product тус бүрээс 1, зөвхөн 3
router.get('/home', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('review');

    const allReviews = await collection.find({
      rating: { $gte: 4 }
    }).toArray();

    const seen = new Set();
    const result = allReviews
      .filter(r => {
        if (!seen.has(r.product_id)) {
          seen.add(r.product_id);
          return true;
        }
        return false;
      })
      .slice(0, 3);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;