const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────
// ФАЙЛУУДЫН ЗАМЫГ ТОХИРУУЛАХ (ЗАМЫГ BACKEND-Д ТААРУУЛАВ)
// ─────────────────────────────────────────────────────────
// JSON өгөгдлүүд сервертэй нэг хавтас (backend/) дотор байгаа үед:
const PRODUCTS_PATH = path.join(__dirname, 'product.json');
const REVIEWS_PATH = path.join(__dirname, 'review.json');
const USERS_PATH = path.join(__dirname, 'user.json');
const REQUESTS_PATH = path.join(__dirname, 'rental-requests.json');

// ─────────────────────────────────────────────────────────
// ТУСЛАХ ФУНКЦҮҮД (JSON-ТОЙ ХАРЬЦАХ)
// ─────────────────────────────────────────────────────────

async function readDataFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Файл уншихад алдаа гарлаа (${filePath}):`, error);
    return []; // Файл олдохгүй эсвэл алдаа гарвал хоосон массив буцаана (сервер унахгүй)
  }
}

async function writeDataFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Файл руу бичихэд алдаа гарлаа (${filePath}):`, error);
    return false;
  }
}

function parsePrice(price) {
  if (typeof price === 'number') return price;
  return parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0;
}

// ─────────────────────────────────────────────────────────
// API ЗАМУУД (ROUTES)
// ─────────────────────────────────────────────────────────

// 1. ХЭРЭГЛЭГЧ НЭВТРЭХ (LOGIN API)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Имэйл болон нууц үгээ оруулна уу.' });
  }

  const users = await readDataFile(USERS_PATH);
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Имэйл эсвэл нууц үг буруу байна.' });
  }

  // Аюулгүй байдлын үүднээс нууц үгийг хасаж фронтенд рүү буцаана
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Амжилттай нэвтэрлээ.',
    user: userWithoutPassword
  });
});

// 2. ТҮРЭЭСЛЭХ ХҮСЭЛТ ХҮЛЭЭЖ АВАХ БА ХЭРЭГЛЭГЧИЙГ ХОЛБОХ
app.post('/api/rental-requests', async (req, res) => {
  const { productId, selectedSize, fromDate, toDate, userId } = req.body;

  if (!productId || !selectedSize || !fromDate || !toDate || !userId) {
    return res.status(400).json({ message: 'Мэдээлэл дутуу байна. (Бараа, размер, огноо, хэрэглэгчийн ID шаардлагатай)' });
  }

  // а. Хэрэглэгч (Түрээслэгч) байгаа эсэхийг шалгах
  const users = await readDataFile(USERS_PATH);
  const tenant = users.find(u => u.user_id === userId);
  if (!tenant) {
    return res.status(404).json({ message: 'Хүсэлт илгээгч хэрэглэгч олдсонгүй.' });
  }

  // б. Бараа байгаа эсэхийг шалгах
  const products = await readDataFile(PRODUCTS_PATH);
  const product = products.find(p => p.id == productId);
  if (!product) {
    return res.status(404).json({ message: 'Түрээслэх бараа олдсонгүй.' });
  }

  // в. Энэ барааг анх нийтэлсэн эзнийг (Owner) хайж олох
  const owner = users.find(u => u.published_items.includes(productId) || u.published_items.includes(product.img_src.split('.')[0]));

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
});

// 3. БҮХ БҮТЭЭГДЭХҮҮНИЙГ АВАХ (ШҮҮЛТҮҮРТЭЙ)
app.get('/api/products', async (req, res) => {
  const { cat, size, maxPrice } = req.query;
  const products = await readDataFile(PRODUCTS_PATH);
  let results = [...products];

  if (cat && cat !== 'All') results = results.filter(p => p.category === cat);
  if (size && size !== 'All') results = results.filter(p => p.sizes && p.sizes.includes(size));
  if (maxPrice) results = results.filter(p => parsePrice(p.price) <= parseInt(maxPrice, 10));

  res.json(results);
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

// ─────────────────────────────────────────────────────────
// СЕРВЕРИЙГ АСААХ
// ─────────────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});