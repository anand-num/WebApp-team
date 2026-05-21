require('dotenv').config();
const express = require('express');
const app = express();

// Static файлууд (HTML, CSS, JS)
app.use(express.static('../public'));
app.use(express.json());

// CORS — frontend-с API дуудах боломжтой болгох
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Routes
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});