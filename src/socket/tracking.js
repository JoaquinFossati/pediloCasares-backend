const { Pedido } = require('../models');

// deliveryId → { lat, lng, timestamp }
const ubicaciones = new Map();

const registrarTracking = (io, socket) => {
  // Delivery actualiza su ubicación
  socket.on('ubicacion:actualizar', async ({ pedidoId, lat, lng }) => {
    if (!socket.userId || socket.userRol !== 'delivery') return;

    ubicaciones.set(socket.userId, { lat, lng, timestamp: Date.now() });

    // Emitir a todos en la sala del pedido
    io.to(`pedido:${pedidoId}`).emit('ubicacion:actualizada', {
      deliveryId: socket.userId,
      lat,
      lng,
      timestamp: Date.now(),
    });
  });

  // Cliente/comercio se une a la sala de un pedido para tracking
  socket.on('pedido:seguir', async ({ pedidoId }) => {
    if (!socket.userId) return;

    try {
      const pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) return socket.emit('error', { message: 'Pedido no encontrado' });

      const autorizado =
        pedido.clienteId === socket.userId ||
        pedido.deliveryId === socket.userId ||
        socket.userRol === 'admin' ||
        socket.userRol === 'comerciante';

      if (!autorizado) return socket.emit('error', { message: 'Sin permiso' });

      socket.join(`pedido:${pedidoId}`);
      socket.emit('pedido:siguiendo', { pedidoId });

      // Si el delivery ya tiene ubicación, enviarla inmediatamente
      if (pedido.deliveryId && ubicaciones.has(pedido.deliveryId)) {
        socket.emit('ubicacion:actualizada', {
          deliveryId: pedido.deliveryId,
          ...ubicaciones.get(pedido.deliveryId),
        });
      }
    } catch (err) {
      console.error('Error en pedido:seguir', err.message);
    }
  });

  socket.on('pedido:dejar', ({ pedidoId }) => {
    socket.leave(`pedido:${pedidoId}`);
  });
};

const obtenerUbicacion = (deliveryId) => ubicaciones.get(deliveryId) || null;

module.exports = { registrarTracking, obtenerUbicacion };
