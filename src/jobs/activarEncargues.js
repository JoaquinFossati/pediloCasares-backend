const { Op } = require('sequelize');
const { Pedido, Comercio, User } = require('../models');
const { sendPush } = require('../utils/notifications');

const INTERVALO_MS = 60 * 1000;

async function activarEncargues(io) {
  try {
    const ahora = new Date();
    const encargues = await Pedido.findAll({
      where: {
        estado: 'programado',
        programadoPara: { [Op.lte]: ahora },
      },
      include: [
        { model: Comercio, as: 'comercio', attributes: ['id', 'usuarioId'] },
      ],
    });

    for (const pedido of encargues) {
      const expiraEn = new Date(Date.now() + 5 * 60 * 1000);
      await pedido.update({ estado: 'pendiente', expiraEn });

      if (io) {
        io.to(`user:${pedido.comercio.usuarioId}`).emit('pedido:nuevo', {
          pedidoId: pedido.id,
          numeroPedido: pedido.numeroPedido,
          total: pedido.total,
        });
        io.to(`pedido:${pedido.id}`).emit('pedido:estado-actualizado', { pedidoId: pedido.id, estado: 'pendiente' });
        io.to(`user:${pedido.clienteId}`).emit('pedido:estado-actualizado', { pedidoId: pedido.id, estado: 'pendiente' });
      }

      const propietario = await User.findByPk(pedido.comercio.usuarioId, { attributes: ['fcmToken'] });
      sendPush(
        propietario?.fcmToken,
        '🛒 Nuevo encargue',
        `Pedido #${pedido.numeroPedido} · $${pedido.total}`,
        { pedidoId: pedido.id }
      );

      console.log(`[job] Encargue activado: #${pedido.numeroPedido}`);
    }
  } catch (err) {
    console.error('[job] Error al activar encargues:', err.message);
  }
}

function iniciarJob(io) {
  activarEncargues(io);
  setInterval(() => activarEncargues(io), INTERVALO_MS);
  console.log('[job] Activación automática de encargues activa (cada 60s)');
}

module.exports = { iniciarJob };
