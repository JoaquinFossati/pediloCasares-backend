const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { listar, contarNoLeidas, marcarLeida, marcarTodasLeidas } = require('../controllers/notificacion.controller');

router.get('/',           authenticate, listar);
router.get('/no-leidas',  authenticate, contarNoLeidas);
router.patch('/leer-todo', authenticate, marcarTodasLeidas);
router.patch('/:id/leer', authenticate, marcarLeida);

module.exports = router;
