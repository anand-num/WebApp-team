const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// GET /api/reviews — Get all reviews from all products
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const productsCollection = db.collection('product');
    
    // Get all products and extract their reviews
    const products = await productsCollection.find({}).toArray();
    
    // Collect all reviews from all products
    const allReviews = [];
    products.forEach(product => {
      if (product.reviews && Array.isArray(product.reviews)) {
        product.reviews.forEach(review => {
          allReviews.push({
            ...review,
            product_id: product.id,
            product_name: product.item_name
          });
        });
      }
    });
    
    res.json(allReviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/product/:productId — Get reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const numericId = parseInt(productId);
    
    await client.connect();
    const db = client.db('webapp-team');
    const productsCollection = db.collection('product');
    
    const product = await productsCollection.findOne({ 
      $or: [{ id: numericId }, { id: productId }]
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      product_id: product.id,
      product_name: product.item_name,
      reviews: product.reviews || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reviews/home — Get top 3 unique product reviews for homepage
router.get('/home', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const productsCollection = db.collection('product');
    
    // Get all products
    const products = await productsCollection.find({}).toArray();
    
    // Collect reviews with rating >= 4, one per product
    const featuredReviews = [];
    const seenProducts = new Set();
    
    for (const product of products) {
      if (product.reviews && Array.isArray(product.reviews) && !seenProducts.has(product.id)) {
        // Find a review with rating >= 4
        const goodReview = product.reviews.find(r => r.rating >= 4);
        if (goodReview) {
          featuredReviews.push({
            ...goodReview,
            product_id: product.id,
            product_name: product.item_name,
            product_img: product.img_src
          });
          seenProducts.add(product.id);
        }
      }
      
      // Stop after 3 reviews
      if (featuredReviews.length >= 3) break;
    }
    
    res.json(featuredReviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews - Add a new review to a product
router.post('/', async (req, res) => {
  try {
    const { product_id, user_id, name, rating, comment } = req.body;
    
    if (!product_id || !user_id || !name || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await client.connect();
    const db = client.db('webapp-team');
    const productsCollection = db.collection('product');
    
    const numericProductId = parseInt(product_id);
    
    // Check if product exists
    const product = await productsCollection.findOne({ id: numericProductId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Add new review
    const newReview = {
      user_id: user_id,
      name: name,
      rating: rating,
      comment: comment
    };
    
    const result = await productsCollection.updateOne(
      { id: numericProductId },
      { 
        $push: { reviews: newReview },
        $inc: { review_count: 1 }
      }
    );
    
    // Recalculate average rating
    const updatedProduct = await productsCollection.findOne({ id: numericProductId });
    const reviews = updatedProduct.reviews || [];
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;
    
    await productsCollection.updateOne(
      { id: numericProductId },
      { $set: { rating: Math.round(avgRating * 10) / 10 } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: newReview
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reviews/:productId/:userId - Delete a review
router.delete('/:productId/:userId', async (req, res) => {
  try {
    const { productId, userId } = req.params;
    const numericProductId = parseInt(productId);
    
    await client.connect();
    const db = client.db('webapp-team');
    const productsCollection = db.collection('product');
    
    // Remove the review
    const result = await productsCollection.updateOne(
      { id: numericProductId },
      { $pull: { reviews: { user_id: userId } } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Update review count and average rating
    const updatedProduct = await productsCollection.findOne({ id: numericProductId });
    const reviews = updatedProduct.reviews || [];
    const reviewCount = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0;
    
    await productsCollection.updateOne(
      { id: numericProductId },
      { 
        $set: { 
          rating: Math.round(avgRating * 10) / 10,
          review_count: reviewCount
        }
      }
    );
    
    res.json({ success: true, message: 'Review deleted successfully' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;