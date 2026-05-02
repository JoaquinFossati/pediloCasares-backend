/**
 * @swagger
 * /pedidos:
 *   post:
 *     tags: [Pedidos]
 *     summary: Crear nuevo pedido (cliente)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comercioId, items, direccionEntrega, metodoPago]
 *             properties:
 *               comercioId:       { type: string, format: uuid }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productoId: { type: string, format: uuid }
 *                     cantidad:   { type: integer, minimum: 1 }
 *               direccionEntrega: { type: string }
 *               metodoPago:       { type: string, enum: [tarjeta, efectivo, billetera] }
 *               notas:            { type: string }
 *     responses:
 *       201: { description: Pedido creado con detalles y total calculado }
 *       400: { description: Comercio cerrado o producto no disponible }
 *       409: { description: Ya tenés un pedido activo en este comercio }
 * /pedidos/{id}/estado:
 *   patch:
 *     tags: [Pedidos]
 *     summary: Cambiar estado del pedido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado: { type: string, enum: [preparando, listo, en_entrega, entregado, cancelado] }
 *     responses:
 *       200: { description: Estado actualizado }
 *       400: { description: Transición inválida }
 *       403: { description: Sin permiso para este estado }
 * /pedidos/{id}/aceptar:
 *   post:
 *     tags: [Pedidos]
 *     summary: Delivery acepta un pedido disponible
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Pedido asignado al delivery }
 *       409: { description: Ya tenés una entrega activa }
 * /pedidos/{id}/calificar:
 *   post:
 *     tags: [Pedidos]
 *     summary: Cliente califica comercio y delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               calificacionComercio: { type: integer, minimum: 1, maximum: 5 }
 *               calificacionDelivery: { type: integer, minimum: 1, maximum: 5 }
 *               comentario:           { type: string }
 *     responses:
 *       200: { description: Calificación guardada y ratings actualizados }
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pedidoController = require('../controllers/pedido.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const crearRules = [
  body('comercioId').isUUID(),
  body('items').isArray({ min: 1 }),
  body('items.*.productoId').isUUID(),
  body('items.*.cantidad').isFloat({ min: 0.5 }),
  body('direccionEntrega').trim().notEmpty(),
  body('metodoPago').isIn(['efectivo', 'transferencia']),
];

// Pedidos disponibles para delivery (antes de :id para evitar conflicto)
router.get('/disponibles', authenticate, authorize('delivery', 'admin'), pedidoController.pedidosDisponibles);

// Mis pedidos (cliente)
router.get('/mis-pedidos', authenticate, authorize('cliente'), pedidoController.listarMisPedidos);

// Entregas del delivery
router.get('/mis-entregas', authenticate, authorize('delivery'), pedidoController.listarPedidosDelivery);

// Pedidos activos del comercio propio (sin parámetro de ID)
router.get('/activos-comercio', authenticate, authorize('comerciante', 'admin'), pedidoController.activosComercio);

// Historial de pedidos del comercio propio
router.get('/historial-comercio', authenticate, authorize('comerciante', 'admin'), pedidoController.historialComercio);

// Pedidos de un comercio
router.get('/comercio/:comercioId', authenticate, authorize('comerciante', 'admin'), pedidoController.listarPedidosComercio);

// CRUD principal
router.post('/', authenticate, authorize('cliente'), crearRules, validate, pedidoController.crear);
router.get('/:id', authenticate, pedidoController.obtener);
router.patch('/:id/estado', authenticate, body('estado').notEmpty(), validate, pedidoController.cambiarEstado);
router.post('/:id/aceptar', authenticate, authorize('delivery'), pedidoController.aceptarDelivery);
router.post('/:id/tomar', authenticate, authorize('delivery'), pedidoController.aceptarDelivery);
router.post('/:id/confirmar-retiro', authenticate, authorize('delivery'), pedidoController.confirmarRetiro);
router.post('/:id/confirmar-entrega', authenticate, authorize('delivery'), pedidoController.confirmarEntrega);
router.post('/:id/liberar', authenticate, authorize('delivery'), pedidoController.liberarPedido);
router.post('/:id/calificar', authenticate, authorize('cliente'), pedidoController.calificar);
router.post('/:id/alertar-llegada', authenticate, authorize('delivery'), pedidoController.alertarLlegada);

module.exports = router;
