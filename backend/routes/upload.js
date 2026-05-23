const express = require('express');
const router  = express.Router();
const multer  = require('multer');

// Memory storage — disk-д хадгалахгүй
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Зөвхөн зураг оруулна уу'));
  }
});

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Зураг олдсонгүй' });

  // Buffer → base64 string
  const base64  = req.file.buffer.toString('base64');
  const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

  res.json({
    success:  true,
    url:      dataUrl,              // шууд img src болгон ашиглана
    filename: req.file.originalname
  });
});

module.exports = router;