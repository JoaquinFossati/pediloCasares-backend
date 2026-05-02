const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const usuarioController = require('../controllers/usuario.controller');
const direccionController = require('../controllers/direccion.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// ── Perfil propio ──────────────────────────────────────────────────────
router.get('/perfil', authenticate, usuarioController.obtenerPerfil);
router.patch('/perfil', authenticate, usuarioController.actualizarPerfil);
router.patch('/cambiar-password',
  authenticate,
  body('passwordActual').notEmpty(),
  body('passwordNueva').isLength({ min: 6 }),
  validate,
  usuarioController.cambiarPassword
);
router.patch('/en-linea', authenticate, authorize('delivery'), body('enLinea').isBoolean(), validate, usuarioController.toggleEnLinea);
router.post('/fcm-token', authenticate, body('fcmToken').notEmpty(), validate, usuarioController.guardarFcmToken);
router.get('/estadisticas', authenticate, usuarioController.obtenerEstadisticas);
router.get('/deliveries-disponibles', authenticate, usuarioController.deliveriesDisponibles);

// ── Direcciones ────────────────────────────────────────────────────────
router.get('/direcciones', authenticate, authorize('cliente'), direccionController.listar);
router.post('/direcciones',
  authenticate,
  authorize('cliente'),
  body('direccion').trim().notEmpty(),
  validate,
  direccionController.crear
);
router.patch('/direcciones/:id', authenticate, authorize('cliente'), direccionController.actualizar);
router.delete('/direcciones/:id', authenticate, authorize('cliente'), direccionController.eliminar);
router.patch('/direcciones/:id/principal', authenticate, authorize('cliente'), direccionController.setPrincipal);

// ── Admin ──────────────────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin'), usuarioController.listarUsuarios);
router.post('/admin',
  authenticate,
  authorize('admin'),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').notEmpty(),
  body('telefono').notEmpty(),
  validate,
  usuarioController.crearAdmin
);
router.get('/:id', authenticate, authorize('admin'), usuarioController.obtenerUsuario);
router.patch('/:id', authenticate, authorize('admin'), usuarioController.actualizarUsuario);
router.patch('/:id/estado', authenticate, authorize('admin'), usuarioController.toggleEstadoUsuario);
router.get('/:id/estadisticas', authenticate, authorize('admin'), usuarioController.obtenerEstadisticas);

module.exports = router;
