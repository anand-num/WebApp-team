require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// ─────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — frontend-с API дуудах боломжтой болгох
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Static файлууд — public folder-г serve хийх
app.use('/public', express.static(path.join(__dirname, '../public')));

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────

const productRoutes = require('./routes/products');
const reviewRoutes  = require('./routes/review');

app.use('/api/products', productRoutes);
app.use('/api/reviews',  reviewRoutes);

// ─────────────────────────────────────────────────────────
// HTML PAGES
// ─────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));
});

app.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/browse.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/product.html'));
});

// ─────────────────────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});