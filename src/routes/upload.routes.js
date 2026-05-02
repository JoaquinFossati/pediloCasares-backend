const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

const makeStorage = (prefix) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
};

const uploadProducto  = multer({ storage: makeStorage('producto'),  limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
const uploadComercio  = multer({ storage: makeStorage('comercio'),  limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

const responderUrl = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
};

router.post('/producto', authenticate, authorize('comerciante', 'admin'), uploadProducto.single('foto'), responderUrl);
router.post('/comercio', authenticate, authorize('comerciante', 'admin'), uploadComercio.single('foto'), responderUrl);

module.exports = router;
