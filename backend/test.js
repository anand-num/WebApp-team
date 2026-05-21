// dotenv болон mongodb-г ачаалах
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

const getData = async () => {
  // Client үүсгэх
  const client = new MongoClient(uri);

  try {
    // Database-д холбогдох
    await client.connect();
    console.log('✅ Connected!');

    // Database болон collection сонгох
    const db = client.db('webapp-team');
    const products = db.collection('product');

    // 1️⃣ БҮГДИЙГ унших
    const allProducts = await products.find({}).toArray();
    console.log('📦 Бүх бүтээгдэхүүн:', allProducts.length, 'ширхэг');

    // 2️⃣ НЭГИЙГ унших
    const oneProduct = await products.findOne({ status: 'Premium' });
    console.log('⭐ Premium бүтээгдэхүүн:', oneProduct.item_name);

    // 3️⃣ FILTER-ТЭЙ унших
    const cosplay = await products.find({ category: 'Cosplay' }).toArray();
    console.log('🎭 Cosplay бүтээгдэхүүн:', cosplay.length, 'ширхэг');

    // 4️⃣ ЗӨВХӨН ТОДОРХОЙ талбар харах (projection)
    const names = await products.find(
      {},
      { projection: { item_name: 1, price: 1, _id: 0 } }
    ).toArray();
    console.log('📋 Нэр болон үнэ:', names);

  } catch (error) {
    console.error('❌ Алдаа:', error.message);
  } finally {
    // Заавал холболтыг хаах
    await client.close();
    console.log('🔌 Холболт хаагдлаа');
  }
};

getData();