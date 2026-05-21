const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// GET /api/users — бүх хэрэглэгч
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    // Password-г буцааж болохгүй — projection ашиглан хасах
    const result = await collection.find(
      {},
      { projection: { password: 0 } }  // ← password харагдахгүй
    ).toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/login — нэвтрэх
// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, password }); // debug

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    // Email эсвэл username-р хайх
    const user = await collection.findOne({
      $or: [
        { email:    email    },
        { username: email    }  // email field-д username ч орж болно
      ],
      password: password
    });

    console.log('Found user:', user); // debug

    if (!user) {
      return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна' });
    }

    // Password хасаад буцаах
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/register — бүртгүүлэх
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    // Email аль хэдийн байгаа эсэхийг шалгах
    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ error: 'Энэ имэйл аль хэдийн бүртгэлтэй байна' });
    }

    // Шинэ хэрэглэгч нэмэх
    const newUser = { email, username, password, createdAt: new Date() };
    await collection.insertOne(newUser);

    // Password хасаад буцаах
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/check-email?email=... — email байгаа эсэх шалгах
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    await client.connect();
    const db = client.db('webapp-team');
    const collection = db.collection('users');

    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    res.json({ exists: !!existing });  // true эсвэл false
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;