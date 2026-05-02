const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const walletController = require('../controllers/wallet.controller');

router.get('/mi-billetera',  authenticate, authorize('admin', 'comerciante', 'delivery'), walletController.miBilletera);
router.post('/retiro',       authenticate, authorize('admin', 'comerciante', 'delivery'), walletController.retirar);
router.post('/deposito',     authenticate, authorize('delivery'), walletController.depositar);
router.get('/admin/resumen', authenticate, authorize('admin'), walletController.resumenAdmin);
router.post('/admin/ajuste', authenticate, authorize('admin'), walletController.ajuste);

module.exports = router;
