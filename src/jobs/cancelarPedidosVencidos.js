const { Op } = require('sequelize');
const { Pedido, User } = require('../models');
const { sendPush } = require('../utils/notifications');

const INTERVALO_MS = 60 * 1000; // cada 60 segundos

async function cancelarVencidos(io) {
  try {
    const vencidos = await Pedido.findAll({
      where: {
        estado: 'pendiente',
        expiraEn: { [Op.lt]: new Date() },
      },
      include: [{ model: User, as: 'cliente', attributes: ['id', 'fcmToken'] }],
    });

    for (const pedido of vencidos) {
      await pedido.update({ estado: 'cancelado' });

      if (io) {
        io.to(`pedido:${pedido.id}`).emit('pedido:estado', { estado: 'cancelado' });
        io.to(`user:${pedido.clienteId}`).emit('pedido:estado', { estado: 'cancelado' });
      }

      sendPush(
        pedido.cliente?.fcmToken,
        '❌ Pedido cancelado',
        `Tu pedido #${pedido.numeroPedido} fue cancelado porque el comercio no respondió a tiempo.`,
        { pedidoId: pedido.id }
      );

      console.log(`[job] Pedido vencido cancelado: #${pedido.numeroPedido}`);
    }
  } catch (err) {
    console.error('[job] Error al cancelar pedidos vencidos:', err.message);
  }
}

function iniciarJob(io) {
  // Ejecutar inmediatamente al arrancar y luego cada 60s
  cancelarVencidos(io);
  setInterval(() => cancelarVencidos(io), INTERVALO_MS);
  console.log('[job] Cancelación automática de pedidos vencidos activa (cada 60s)');
}

module.exports = { iniciarJob };
