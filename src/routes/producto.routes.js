const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productoController = require('../controllers/producto.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const crearRules = [
  body('nombre').trim().notEmpty(),
  body('precio').isFloat({ min: 0 }),
  body('comercioId').isUUID(),
];

router.get('/', productoController.listar);
router.get('/mi-comercio', authenticate, authorize('comerciante'), productoController.miComercio);
router.get('/:id', productoController.obtener);
router.post('/', authenticate, authorize('admin', 'comerciante'), crearRules, validate, productoController.crear);
router.patch('/:id', authenticate, authorize('admin', 'comerciante'), productoController.actualizar);
router.put('/:id/variantes', authenticate, authorize('admin', 'comerciante'), productoController.actualizarVariantes);
router.delete('/:id', authenticate, authorize('admin', 'comerciante'), productoController.eliminar);

module.exports = router;
