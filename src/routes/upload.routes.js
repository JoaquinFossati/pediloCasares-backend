const express = require('express');
const multer  = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const makeStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         `pedilo-casares/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
};

const uploadProducto = multer({ storage: makeStorage('productos'), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
const uploadComercio = multer({ storage: makeStorage('comercios'), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

const responderUrl = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  res.json({ url: req.file.path });
};

router.post('/producto', authenticate, authorize('comerciante', 'admin'), uploadProducto.single('foto'), responderUrl);
router.post('/comercio', authenticate, authorize('comerciante', 'admin'), uploadComercio.single('foto'), responderUrl);

module.exports = router;
