require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ─────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static файлууд
app.use('/public', express.static(path.join(__dirname, '../public')));

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────

const productRoutes = require('./routes/products');
const reviewRoutes  = require('./routes/review');
const userRoutes    = require('./routes/users');

app.use('/api/products', productRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/users',    userRoutes);

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