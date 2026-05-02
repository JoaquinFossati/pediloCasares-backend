const { Notificacion } = require('../models');
const { getIO } = require('../config/socketInstance');

/**
 * Crea una notificación en la base de datos y la emite al usuario vía socket.
 * Es fire-and-forget: no lanza excepción para no romper el flujo principal.
 *
 * @param {string} usuarioId - UUID del destinatario
 * @param {object} payload   - { tipo, emoji, titulo, mensaje, data }
 */
const crearNotificacion = async (usuarioId, { tipo = 'sistema', emoji = '🔔', titulo, mensaje, data = null }) => {
  try {
    const notif = await Notificacion.create({ usuarioId, tipo, emoji, titulo, mensaje, data });

    const io = getIO();
    if (io) {
      io.to(`user:${usuarioId}`).emit('notificacion:nueva', {
        id:        notif.id,
        tipo:      notif.tipo,
        emoji:     notif.emoji,
        titulo:    notif.titulo,
        mensaje:   notif.mensaje,
        leido:     false,
        data:      notif.data,
        createdAt: notif.createdAt,
      });
    }

    return notif;
  } catch (err) {
    console.error('[notif] Error al crear notificación:', err.message);
  }
};

module.exports = { crearNotificacion };
