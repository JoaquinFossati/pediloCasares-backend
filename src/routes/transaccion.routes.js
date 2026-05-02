const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccion.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, transaccionController.listar);
router.get('/:id', authenticate, transaccionController.obtener);
router.post('/:id/reembolsar', authenticate, authorize('admin'), transaccionController.reembolsar);
router.post('/webhook-mp', transaccionController.webhookMP); // sin auth — viene de MP

module.exports = router;
