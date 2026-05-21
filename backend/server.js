require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// ─────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

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


  // Огноо болон хоног тооцоолох логик
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ message: 'Түрээслэх огноо буруу байна.' });
  }

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const basePrice = parsePrice(product.price);
  const totalPrice = basePrice * days;

  // Захиалгын шинэ объект үүсгэх
  const newRequest = {
    request_id: `REQ-${Date.now()}`,
    product: {
      id: product.id,
      item_name: product.item_name,
      brand: product.brand
    },
    tenant: {
      user_id: tenant.user_id,
      username: tenant.username,
      phone: tenant.phone
    },
    owner: owner ? {
      user_id: owner.user_id,
      username: owner.username,
      phone: owner.phone
    } : "Системийн бараа (Эзэмшигч тодорхойгүй)",
    rental_details: {
      size: selectedSize,
      from_date: fromDate,
      to_date: toDate,
      total_days: days,
      total_price: `${totalPrice.toLocaleString()}₮`
    },
    status: 'Pending',
    created_at: new Date()
  };

  const currentRequests = await readDataFile(REQUESTS_PATH);
  currentRequests.push(newRequest);

  const success = await writeDataFile(REQUESTS_PATH, currentRequests);

  if (!success) {
    return res.status(500).json({ message: 'Хүсэлтийг хадгалахад серверийн алдаа гарлаа.' });
  }

  res.status(201).json({
    success: true,
    message: 'Түрээсийн хүсэлт амжилттай бүртгэгдлээ.',
    data: newRequest
  });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));

});

app.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/browse.html'));
});


// 4. НЭГ БҮТЭЭГДЭХҮҮНИЙГ ID-ААР НЬ АВАХ
app.get('/api/products/:id', async (req, res) => {
  const products = await readDataFile(PRODUCTS_PATH);
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ message: 'Бүтээгдэхүүн олдсонгүй' });
  res.json(product);
});

// 5. СЭТГЭГДЛҮҮДИЙГ АВАХ (ДИНАМИК БА БҮГД)
app.get('/api/reviews', async (req, res) => {
  const { productId } = req.query;
  const reviews = await readDataFile(REVIEWS_PATH);
  
  // Хэрэв productId ирсэн байвал шүүнэ, ирээгүй бол бүх сэтгэгдлийг буцаана
  if (productId) {
    const filteredReviews = reviews.filter(r => r.product_id == productId);
    return res.json(filteredReviews);
  }
  
  res.json(reviews);
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