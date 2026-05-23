const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// Хадгалах хавтас байхгүй бол үүсгэнэ
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Файлын нэрийг sanitize хийнэ: timestamp + random + extension
    const ext      = path.extname(file.originalname).toLowerCase();
    const unique   = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// Алдаа барих middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Зураг 5MB-аас хэтэрсэн байна' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
};

router.post('/', upload.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Зураг олдсонгүй' });
  }

  // Харьцангуй замыг буцаана (frontend static serve хийхэд ашиглана)
  const relativePath = `/uploads/images/${req.file.filename}`;

  res.json({
    success:  true,
    url:      relativePath,           // жишээ: /uploads/images/1716541234567-123456789.jpg
    filename: req.file.originalname,
    size:     req.file.size
  });
});

module.exports = router;