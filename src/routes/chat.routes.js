const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/no-leidos', authenticate, chatController.noLeidos);
router.get('/:pedidoId/mensajes', authenticate, chatController.historial);

module.exports = router;
