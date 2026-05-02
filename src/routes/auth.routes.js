/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nombre, telefono, rol]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               nombre:   { type: string }
 *               telefono: { type: string }
 *               rol:      { type: string, enum: [cliente, comerciante, delivery] }
 *     responses:
 *       201: { description: Usuario registrado con tokens JWT }
 *       409: { description: Email ya registrado }
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login exitoso con user + accessToken + refreshToken }
 *       401: { description: Credenciales inválidas }
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión (invalida refresh token)
 *     responses:
 *       200: { description: Sesión cerrada }
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Renovar access token
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Nuevo accessToken y refreshToken }
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').trim().notEmpty(),
  body('telefono').trim().notEmpty(),
  body('rol').isIn(['cliente', 'comerciante', 'delivery']),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', body('email').isEmail(), validate, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
