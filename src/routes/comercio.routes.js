/**
 * @swagger
 * /comercios:
 *   get:
 *     tags: [Comercios]
 *     summary: Listar todos los comercios
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de comercios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comercio'
 *   post:
 *     tags: [Comercios]
 *     summary: Crear nuevo comercio (comerciante/admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, direccion]
 *             properties:
 *               nombre:    { type: string }
 *               direccion: { type: string }
 *               latitud:   { type: number }
 *               longitud:  { type: number }
 *               telefono:  { type: string }
 *               horarioApertura: { type: string, example: "11:00" }
 *               horarioCierre:   { type: string, example: "23:00" }
 *     responses:
 *       201: { description: Comercio creado }
 * /comercios/{id}:
 *   get:
 *     tags: [Comercios]
 *     summary: Obtener comercio con menú completo
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Comercio con categorías y productos }
 *       404: { description: No encontrado }
 *   patch:
 *     tags: [Comercios]
 *     summary: Actualizar datos del comercio
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Comercio actualizado }
 * /comercios/{id}/estado:
 *   patch:
 *     tags: [Comercios]
 *     summary: Abrir o cerrar el comercio
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
 *               estado: { type: string, enum: [abierto, cerrado, inactivo] }
 *     responses:
 *       200: { description: Estado actualizado }
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const comercioController = require('../controllers/comercio.controller');
const categoriaController = require('../controllers/categoria.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const crearRules = [
  body('nombre').trim().notEmpty(),
  body('direccion').trim().notEmpty(),
  body('comisionPorcentaje').optional().isFloat({ min: 0, max: 100 }),
  body('zonaCobertura').optional().isInt({ min: 100 }),
];

// Comercios
router.get('/', comercioController.listar);
router.get('/stats', comercioController.stats);          // público — debe ir ANTES de /:id
router.get('/:id', comercioController.obtener);
router.post('/', authenticate, authorize('admin', 'comerciante'), crearRules, validate, comercioController.crear);
router.patch('/:id', authenticate, authorize('admin', 'comerciante'), comercioController.actualizar);
router.patch('/:id/estado', authenticate, authorize('admin', 'comerciante'), body('estado').notEmpty(), validate, comercioController.cambiarEstado);
router.delete('/:id', authenticate, authorize('admin'), comercioController.eliminar);

// Categorías de un comercio
router.get('/:comercioId/categorias', categoriaController.listar);
router.post('/:comercioId/categorias', authenticate, authorize('admin', 'comerciante'), body('nombre').trim().notEmpty(), validate, categoriaController.crear);
router.patch('/categorias/:id', authenticate, authorize('admin', 'comerciante'), categoriaController.actualizar);
router.delete('/categorias/:id', authenticate, authorize('admin', 'comerciante'), categoriaController.eliminar);

module.exports = router;
