const express = require('express');
const multer  = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Guardamos en memoria (no en disco)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
  },
});

// Sube el buffer a Cloudinary y devuelve la URL segura
const subirACloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `pedilo-casares/${folder}`, transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

const handleUpload = (folder) => async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const url = await subirACloudinary(req.file.buffer, folder);
    res.json({ url });
  } catch (err) {
    console.error('[UPLOAD ERROR]', JSON.stringify(err));
    res.status(500).json({ error: err.message || err.error || 'Error al subir imagen' });
  }
};

router.post('/producto', authenticate, authorize('comerciante', 'admin'), upload.single('foto'), handleUpload('productos'));
router.post('/comercio', authenticate, authorize('comerciante', 'admin'), upload.single('foto'), handleUpload('comercios'));

module.exports = router;
