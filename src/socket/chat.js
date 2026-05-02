const { Mensaje, Pedido, User } = require('../models');
const { Op } = require('sequelize');

const CANALES_VALIDOS = ['cliente_comercio', 'comercio_delivery', 'delivery_cliente'];

const registrarChat = (io, socket) => {
  socket.on('chat:unirse', async ({ pedidoId, canal = 'cliente_comercio' }) => {
    if (!socket.userId) return;
    if (!CANALES_VALIDOS.includes(canal)) return;

    try {
      const pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) return socket.emit('error', { message: 'Pedido no encontrado' });

      const autorizado =
        pedido.clienteId === socket.userId ||
        pedido.deliveryId === socket.userId ||
        socket.userRol === 'admin' ||
        socket.userRol === 'comerciante';

      if (!autorizado) return socket.emit('error', { message: 'Sin permiso para este chat' });

      const room = `chat:${pedidoId}:${canal}`;
      socket.join(room);
      socket.emit('chat:unido', { pedidoId, canal });

      await Mensaje.update(
        { leido: true },
        { where: { pedidoId, canal, remitenteId: { [Op.ne]: socket.userId }, leido: false } }
      );
    } catch (err) {
      console.error('Error en chat:unirse', err.message);
    }
  });

  socket.on('chat:mensaje', async ({ pedidoId, canal = 'cliente_comercio', mensaje, foto, tipo = 'texto' }) => {
    if (!socket.userId) return;
    if (!mensaje && !foto) return;
    if (!CANALES_VALIDOS.includes(canal)) return;

    try {
      const pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) return socket.emit('error', { message: 'Pedido no encontrado' });

      const nuevoMensaje = await Mensaje.create({
        pedidoId,
        remitenteId: socket.userId,
        mensaje,
        foto,
        tipo,
        canal,
      });

      const mensajeConRemitente = await Mensaje.findByPk(nuevoMensaje.id, {
        include: [{ model: User, as: 'remitente', attributes: ['id', 'nombre', 'foto', 'rol'] }],
      });

      io.to(`chat:${pedidoId}:${canal}`).emit('chat:nuevo-mensaje', mensajeConRemitente);
    } catch (err) {
      console.error('Error en chat:mensaje', err.message);
    }
  });

  socket.on('chat:escribiendo', ({ pedidoId, canal = 'cliente_comercio' }) => {
    if (!socket.userId) return;
    socket.to(`chat:${pedidoId}:${canal}`).emit('chat:escribiendo', {
      userId: socket.userId,
      nombre: socket.userName,
    });
  });

  socket.on('chat:dejo-escribir', ({ pedidoId, canal = 'cliente_comercio' }) => {
    if (!socket.userId) return;
    socket.to(`chat:${pedidoId}:${canal}`).emit('chat:dejo-escribir', { userId: socket.userId });
  });

  socket.on('chat:salir', ({ pedidoId, canal = 'cliente_comercio' }) => {
    socket.leave(`chat:${pedidoId}:${canal}`);
  });
};

module.exports = { registrarChat };
