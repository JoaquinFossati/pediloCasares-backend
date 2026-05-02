const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const comercioRoutes = require('./comercio.routes');
const productoRoutes = require('./producto.routes');
const pedidoRoutes = require('./pedido.routes');
const usuarioRoutes = require('./usuario.routes');
const transaccionRoutes = require('./transaccion.routes');
const dashboardRoutes = require('./dashboard.routes');
const uploadRoutes = require('./upload.routes');
const walletRoutes = require('./wallet.routes');
const notificacionRoutes = require('./notificacion.routes');

router.use('/auth', authRoutes);
router.use('/comercios', comercioRoutes);
router.use('/productos', productoRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/transacciones', transaccionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/chat', require('./chat.routes'));
router.use('/upload', uploadRoutes);
router.use('/wallet', walletRoutes);
router.use('/notificaciones', notificacionRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'DeliveryCS API v1.0' });
});

module.exports = router;
